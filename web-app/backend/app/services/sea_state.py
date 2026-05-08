"""
Servizio stato del mare — indicatore ambientale smussato.

Lo stato del mare è calcolato come indicatore ambientale derivato,
basato su segnali aggregati e smussati, con vincolo di non-regressione
per evitare feedback ansiogeni.
"""
from datetime import datetime, timedelta, timezone
from math import log
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.models.models import Event, Fish, FishState, SeaState


# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
EMA_ALPHA: float = 0.1
NEUTRAL_ES: float = 0.5
LOOKBACK_DAYS: int = 14


# ──────────────────────────────────────────────
# UTILS
# ──────────────────────────────────────────────
def ema(previous: float, current: float, alpha: float = EMA_ALPHA) -> float:
    return alpha * current + (1 - alpha) * previous


def time_factor(days_active: int) -> float:
    if days_active <= 0:
        return 0.05
    return min(1.0, log(1 + days_active) / log(60))


def discretize_sea_state(score: float) -> str:
    if score < 0.3:
        return "neutro"
    elif score < 0.5:
        return "luminoso"
    elif score < 0.7:
        return "calmo"
    elif score < 0.85:
        return "molto_calmo"
    return "armonioso"


def visual_params_from_state(label: str) -> dict:
    mapping = {
        "neutro": {"light": 0.4, "wave_speed": 0.5, "particles": False},
        "luminoso": {"light": 0.55, "wave_speed": 0.4, "particles": False},
        "calmo": {"light": 0.7, "wave_speed": 0.3, "particles": True},
        "molto_calmo": {"light": 0.85, "wave_speed": 0.2, "particles": True},
        "armonioso": {"light": 1.0, "wave_speed": 0.15, "particles": True},
    }
    return mapping.get(label, mapping["neutro"])


# ──────────────────────────────────────────────
# INTERMEDIATE INDICES
# ──────────────────────────────────────────────
def compute_consistency_index(db: Session, user_id: str) -> float:
    """CI: Presence over last 14 days (0..1)."""
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=LOOKBACK_DAYS)

    events = db.execute(
        select(Event.created_at)
        .where(Event.user_id == user_id)
        .where(Event.created_at >= datetime.combine(start, datetime.min.time()))
    ).scalars().all()

    active_days = {e.date() for e in events}
    return min(len(active_days) / LOOKBACK_DAYS, 1.0)


def compute_emotional_stability(db: Session, user_id: str) -> float:
    """ES: 1 - normalized_variance of recent anxiety scores."""
    events = db.execute(
        select(Event)
        .where(Event.user_id == user_id)
        .where(Event.event_type == "check_in")
        .order_by(Event.created_at.desc())
        .limit(LOOKBACK_DAYS)
    ).scalars().all()

    values = []
    for e in events:
        meta = e.metadata_json or {}
        al = meta.get("anxiety_level")
        if al is not None:
            values.append(int(al))

    if len(values) < 3:
        return NEUTRAL_ES

    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)

    # Normalize on 1-5 scale → max variance = 4
    normalized_var = min(variance / 4, 1.0)
    return max(0.0, 1 - normalized_var)


# ──────────────────────────────────────────────
# CORE LOGIC
# ──────────────────────────────────────────────
def compute_sea_state(
    db: Session,
    user_id: str,
    reference_date: datetime | None = None,
) -> None:
    """
    Ricalcola lo stato del mare per l'utente.

    Formula: 0.4 * avg_growth + 0.3 * CI + 0.2 * ES + 0.1 * TF
    Vincolo: sea_state non peggiora mai nel breve termine.
    """
    if reference_date is None:
        reference_date = datetime.now(timezone.utc)

    # Media crescita pesci
    fish_ids = db.execute(
        select(Fish.id).where(Fish.user_id == user_id)
    ).scalars().all()

    if fish_ids:
        avg_growth_result = db.execute(
            select(func.avg(FishState.growth_level))
            .where(FishState.fish_id.in_(fish_ids))
        ).scalar()
        avg_growth = avg_growth_result or 0.0
    else:
        avg_growth = 0.0

    # Indices
    ci = compute_consistency_index(db, user_id)
    es = compute_emotional_stability(db, user_id)

    # Time factor
    first_event = db.execute(
        select(func.min(Event.created_at))
        .where(Event.user_id == user_id)
    ).scalar()

    days_active = max((reference_date - first_event).days, 1) if first_event else 1
    tf = time_factor(days_active)

    # Raw score
    raw_score = 0.4 * avg_growth + 0.3 * ci + 0.2 * es + 0.1 * tf

    # Previous state
    sea_state = db.get(SeaState, user_id)
    previous_score = sea_state.sea_state_score if sea_state else 0.0

    # Smoothing + non-regression rule
    smoothed_score = ema(previous_score, raw_score)
    final_score = max(previous_score, smoothed_score)

    label = discretize_sea_state(final_score)
    visual_params = visual_params_from_state(label)

    # Upsert
    if sea_state:
        sea_state.sea_state_score = final_score
        sea_state.sea_state_label = label
        sea_state.visual_params = visual_params
        sea_state.last_computed = reference_date
    else:
        db.add(
            SeaState(
                user_id=user_id,
                sea_state_score=final_score,
                sea_state_label=label,
                visual_params=visual_params,
                last_computed=reference_date,
            )
        )

    db.commit()

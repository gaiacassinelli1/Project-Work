"""
Servizio di crescita pesci — logica pura, deterministica, anti-ansia.

L'algoritmo di crescita utilizza una funzione cumulativa smussata basata su
eventi a basso peso, progettata per privilegiare la continuità temporale
rispetto all'intensità delle interazioni.
"""
from datetime import datetime, timezone
from math import log
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.models import Event, Fish, FishState


# ──────────────────────────────────────────────
# CONFIG (tunable)
# ──────────────────────────────────────────────
EVENT_WEIGHTS: dict[str, float] = {
    "check_in": 0.02,
    "micro_action": 0.05,
    "reflection": 0.01,
}

EMA_ALPHA: float = 0.3
MAX_GROWTH: float = 1.0


# ──────────────────────────────────────────────
# UTILS
# ──────────────────────────────────────────────
def time_factor(days_active: int) -> float:
    """Crescita lenta all'inizio, poi si stabilizza (~30 giorni)."""
    if days_active <= 0:
        return 0.1
    return min(1.0, log(1 + days_active) / log(30))


def ema(previous: float, current: float, alpha: float = EMA_ALPHA) -> float:
    """Exponential Moving Average — smussa la crescita."""
    return alpha * current + (1 - alpha) * previous


def discretize_visual_stage(growth_level: float) -> str:
    """Converte growth_level continuo in stage discreto per il frontend."""
    if growth_level < 0.2:
        return "small"
    elif growth_level < 0.4:
        return "medium"
    elif growth_level < 0.6:
        return "grown"
    elif growth_level < 0.8:
        return "large"
    return "adult"


# ──────────────────────────────────────────────
# CORE LOGIC
# ──────────────────────────────────────────────
def compute_fish_growth(
    db: Session,
    user_id: str,
    reference_date: datetime | None = None,
) -> None:
    """
    Ricalcola lo stato di crescita di TUTTI i pesci dell'utente.

    - Idempotente: può essere richiamato più volte.
    - Deterministico: stesso input → stesso output.
    - Non penalizza mai: growth_level non diminuisce.
    """
    if reference_date is None:
        reference_date = datetime.now(timezone.utc)

    # Primo evento dell'utente (per calcolare giorni attivi)
    first_event = db.execute(
        select(Event.created_at)
        .where(Event.user_id == user_id)
        .order_by(Event.created_at.asc())
        .limit(1)
    ).scalar_one_or_none()

    if not first_event:
        return  # nessun evento → nessun calcolo

    days_active = max((reference_date - first_event).days, 1)
    tf = time_factor(days_active)

    # Tutti i pesci dell'utente
    fish_list = db.execute(
        select(Fish).where(Fish.user_id == user_id)
    ).scalars().all()

    for fish in fish_list:
        # Eventi associati a questo pesce (via metadata)
        all_events = db.execute(
            select(Event)
            .where(Event.user_id == user_id)
            .order_by(Event.created_at.asc())
        ).scalars().all()

        # Filtra eventi legati a questo pesce
        fish_events = []
        for event in all_events:
            meta = event.metadata_json or {}
            # Se l'evento non specifica un pesce, conta per tutti
            event_fish_id = meta.get("fish_id")
            if event_fish_id is None or event_fish_id == fish.id:
                fish_events.append(event)

        # Calcolo contributo giornaliero
        daily_growth = 0.0
        for event in fish_events:
            daily_growth += EVENT_WEIGHTS.get(event.event_type, 0.0)

        daily_growth *= tf

        # Stato precedente
        fish_state = db.get(FishState, fish.id)
        previous_growth = fish_state.growth_level if fish_state else 0.0

        # Smoothing EMA
        growth_today = ema(previous_growth, daily_growth)

        # Crescita cumulativa — MAI diminuisce
        new_growth = min(previous_growth + growth_today, MAX_GROWTH)

        # Upsert
        if fish_state:
            fish_state.growth_level = new_growth
            fish_state.visual_stage = discretize_visual_stage(new_growth)
            fish_state.last_computed = reference_date
        else:
            db.add(
                FishState(
                    fish_id=fish.id,
                    growth_level=new_growth,
                    visual_stage=discretize_visual_stage(new_growth),
                    last_computed=reference_date,
                )
            )

    db.commit()

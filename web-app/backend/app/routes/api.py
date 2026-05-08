"""
API Routes

L'API è progettata secondo un modello event-driven minimale,
in cui il backend centralizza la logica di progressione e
restituisce esclusivamente stati discreti pronti per la visualizzazione.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import uuid4
import json
import tempfile
from app.db.database import get_db
from app.models.models import Event, Fish, FishState, SeaState, User
from app.schemas import (
ComputeResponse,
EventCreate,
EventResponse,
FishResponse,
SeaStateResponse,
UserCreate,
UserResponse,
RegisterRequest,
LoginRequest,
AuthResponse,
)
from app.services.growth import compute_fish_growth
from app.services.sea_state import compute_sea_state
from app.services.export import export_user_data, sync_to_mongodb, get_user_analytics
from app.auth import register_user, login_user, get_current_user
router = APIRouter()


# ──────────────────────────────────────────────
# AUTHENTICATION — Autenticazione utenti
# ──────────────────────────────────────────────


# Test endpoint
@router.post("/auth/test")
def test_endpoint():
    """Endpoint di test per verificare che il routing funziona."""
    print("[TEST] Test endpoint called")
    return {"status": "ok", "message": "Backend funziona"}


@router.post("/auth/register", response_model=AuthResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Registra un nuovo utente con email e password."""
    result = register_user(
        email=data.email,
        password=data.password,
        locale=data.locale,
        db=db
    )
    return AuthResponse(**result)


@router.post("/auth/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Accedi al tuo diario con email e password."""
    result = login_user(data.email, data.password, db)
    return AuthResponse(**result)


# ──────────────────────────────────────────────
# 1. POST /events — Registra qualsiasi interazione
# ──────────────────────────────────────────────
@router.post("/events", response_model=EventResponse)
def create_event(
    data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Registra un evento immutabile.
    Il frontend non sa cosa succede dopo.
    
    Richiede autenticazione.
    """
    event = Event(
        user_id=current_user.id,
        event_type=data.event_type,
        metadata_json=data.metadata,
    )
    db.add(event)
    db.commit()
    return EventResponse(status="ok")


# ──────────────────────────────────────────────
# 2. GET /user/{user_id}/sea-state
# ──────────────────────────────────────────────
@router.get("/user/{user_id}/sea-state", response_model=SeaStateResponse)
def get_sea_state(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restituisce lo stato del mare già calcolato.
    
    Richiede autenticazione, e user_id deve corrispondere all'utente.
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai accesso ai dati di questo utente.",
        )
    
    sea_state = db.get(SeaState, user_id)
    if not sea_state:
        raise HTTPException(status_code=404, detail="Sea state not found")

    return SeaStateResponse(
        state=sea_state.sea_state_label,
        score=sea_state.sea_state_score,
        visual_params=sea_state.visual_params or {},
    )


# ──────────────────────────────────────────────
# 3. GET /user/{user_id}/fish
# ──────────────────────────────────────────────
@router.get("/user/{user_id}/fish", response_model=list[FishResponse])
def get_user_fish(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restituisce stato dei pesci. visual_stage è già discretizzato.
    
    Richiede autenticazione, e user_id deve corrispondere all'utente.
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai accesso ai dati di questo utente.",
        )
    
    fish_list = db.execute(
        select(Fish).where(Fish.user_id == user_id)
    ).scalars().all()

    result = []
    for f in fish_list:
        state = db.get(FishState, f.id)
        result.append(FishResponse(
            fish_id=f.id,
            dimension=f.dimension,
            growth_level=state.growth_level if state else 0.0,
            visual_stage=state.visual_stage if state else "small",
        ))
    return result


# ──────────────────────────────────────────────
# 4. POST /user/{user_id}/compute-state
# ──────────────────────────────────────────────
@router.post("/user/{user_id}/compute-state", response_model=ComputeResponse)
def compute_state(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger ricalcolo di crescita pesci + stato mare.
    In produzione diventa un cron job.
    
    Richiede autenticazione, e user_id deve corrispondere all'utente.
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai accesso ai dati di questo utente.",
        )
    
    compute_fish_growth(db, user_id)
    compute_sea_state(db, user_id)

    return ComputeResponse(status="recomputed")


# ──────────────────────────────────────────────
# EXPORT & ANALYTICS
# ──────────────────────────────────────────────
@router.get("/user/{user_id}/export-data")
def export_user_data_endpoint(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Esporta i dati dell'utente in formato JSON.
    Include events, game state, e statistiche.
    
    Richiede autenticazione, e user_id deve corrispondere all'utente.
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai accesso ai dati di questo utente.",
        )
    
    return export_user_data(db, user_id)


@router.post("/user/{user_id}/export-mongodb")
def sync_user_to_mongodb_endpoint(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Esporta i dati dell'utente e sincronizza con MongoDB.
    
    Ritorna:
    - export_data: JSON esportato
    - mongodb_result: Risultato della sincronizzazione
    
    Richiede autenticazione, e user_id deve corrispondere all'utente.
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai accesso ai dati di questo utente.",
        )
    
    return sync_to_mongodb(db, user_id)


@router.get("/user/{user_id}/analytics")
def get_user_analytics_endpoint(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Recupera insights e analisi per l'utente da MongoDB.
    
    Include:
    - Trend ansia
    - Correlazioni per dimensione
    - Statistiche aggregate
    
    Richiede autenticazione, e user_id deve corrispondere all'utente.
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai accesso ai dati di questo utente.",
        )
    
    analytics = get_user_analytics(user_id)
    
    if "error" in analytics:
        return {
            "status": "unavailable",
            "message": "MongoDB analytics non disponibile",
            "fallback": "Esegui prima /export-mongodb",
        }
    
    return analytics


"""
Pydantic schemas — request/response models for the API.
"""
from pydantic import BaseModel
from datetime import datetime


# ──────────────────────────────────────────────
# AUTHENTICATION
# ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    """Schema per la registrazione di un nuovo utente."""
    email: str  # Formato: user@example.com
    password: str  # min 8 chars in production
    locale: str = "it"


class LoginRequest(BaseModel):
    """Schema per il login."""
    email: str  # Formato: user@example.com
    password: str


class AuthResponse(BaseModel):
    """
    Risposta dopo autenticazione.
    Il token è la chiave del diario.
    """
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


# ──────────────────────────────────────────────
# EVENTS
# ──────────────────────────────────────────────
class EventCreate(BaseModel):
    user_id: str
    event_type: str  # check_in, micro_action, reflection
    metadata: dict | None = None


class EventResponse(BaseModel):
    status: str = "ok"


# ──────────────────────────────────────────────
# USER
# ──────────────────────────────────────────────
class UserCreate(BaseModel):
    locale: str = "it"


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime
    onboarding_completed: bool


# ──────────────────────────────────────────────
# FISH
# ──────────────────────────────────────────────
class FishResponse(BaseModel):
    fish_id: str
    dimension: str
    growth_level: float
    visual_stage: str


# ──────────────────────────────────────────────
# SEA STATE
# ──────────────────────────────────────────────
class SeaStateResponse(BaseModel):
    state: str
    score: float
    visual_params: dict


# ──────────────────────────────────────────────
# COMPUTE
# ──────────────────────────────────────────────
class ComputeResponse(BaseModel):
    status: str = "recomputed"

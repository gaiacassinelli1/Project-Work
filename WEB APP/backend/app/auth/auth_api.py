"""
Authentication API Endpoints
Endpoint FastAPI per registrazione, login e accesso protetto.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User
from .auth_service import register_user, login_user
from .auth_dependencies import get_current_user
from .auth_logger import logger


# ══════════════════════════════════════════════════════════════
# Pydantic Models (Request/Response)
# ══════════════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    """Richiesta di registrazione."""
    email: EmailStr = Field(..., description="Email dell'utente")
    password: str = Field(
        ...,
        min_length=6,
        description="Password (minimo 6 caratteri)"
    )
    locale: str = Field("it", description="Locale (es. 'it', 'en')")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "locale": "it"
            }
        }


class LoginRequest(BaseModel):
    """Richiesta di login."""
    email: EmailStr = Field(..., description="Email dell'utente")
    password: str = Field(..., description="Password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }


class AuthResponse(BaseModel):
    """Risposta di autenticazione (registrazione o login)."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Tipo di token")
    user_id: str = Field(..., description="ID dell'utente")
    email: str = Field(..., description="Email dell'utente")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com"
            }
        }


class UserResponse(BaseModel):
    """Risposta con dati dell'utente."""
    id: str
    email: str
    locale: str
    onboarding_completed: bool
    
    class Config:
        from_attributes = True


class HealthCheckResponse(BaseModel):
    """Risposta del health check."""
    status: str
    message: str


# ══════════════════════════════════════════════════════════════
# Router
# ══════════════════════════════════════════════════════════════

router = APIRouter(prefix="/api/auth", tags=["authentication"])


# ──────────────────────────────────────────────────────────────
# Health Check (per diagnostica)
# ──────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthCheckResponse)
def health_check():
    """
    Verifica che il backend sia raggiungibile e funzionante.
    Utile per debugging e diagnostica.
    """
    logger.debug("Health check request")
    return {
        "status": "ok",
        "message": "Backend di mare-calmo è funzionante"
    }


# ──────────────────────────────────────────────────────────────
# Registrazione
# ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registra un nuovo utente.
    
    - Valida email e password
    - Crea l'utente nel database
    - Crea i pesci e lo stato del mare iniziali
    - Restituisce JWT token
    
    **Raises:**
    - 400: Email già registrata o dati non validi
    - 500: Errore interno
    """
    logger.info(f"POST /register - Nuova registrazione: {data.email}")
    
    try:
        result = register_user(
            email=data.email,
            password=data.password,
            locale=data.locale,
            db=db
        )
        return AuthResponse(**result)
    except Exception as e:
        logger.error(f"Errore durante registrazione di {data.email}: {str(e)}")
        # L'errore è già stato convertito a HTTPException in service.py
        raise


# ──────────────────────────────────────────────────────────────
# Login
# ──────────────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Autentica un utente e restituisce JWT token.
    
    - Verifica email e password
    - Restituisce access token valido per 24 ore
    
    **Raises:**
    - 401: Credenziali non valide
    - 500: Errore interno
    """
    logger.info(f"POST /login - Login attempt: {data.email}")
    
    try:
        result = login_user(
            email=data.email,
            password=data.password,
            db=db
        )
        return AuthResponse(**result)
    except Exception as e:
        logger.error(f"Errore durante login di {data.email}: {str(e)}")
        # L'errore è già stato convertito a HTTPException in service.py
        raise


# ──────────────────────────────────────────────────────────────
# Profilo Utente (Protetto)
# ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Ottiene i dati dell'utente attualmente autenticato.
    
    **Richiede:** Authorization header con Bearer token
    """
    logger.debug(f"GET /me - Utente: {current_user.email}")
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout dell'utente.
    
    Nota: Poiché usiamo JWT stateless, il logout viene gestito
    dal frontend eliminando il token da localStorage.
    
    **Richiede:** Authorization header con Bearer token
    """
    logger.info(f"POST /logout - Logout: {current_user.email}")
    return {
        "status": "ok",
        "message": "Logout completato. Elimina il token dal client.",
    }


# ──────────────────────────────────────────────────────────────
# Debug Endpoint (da rimuovere in produzione)
# ──────────────────────────────────────────────────────────────

@router.get("/debug/test", response_model=HealthCheckResponse)
def test_endpoint():
    """
    Endpoint di test per verificare che il routing funziona.
    
    **DA RIMUOVERE IN PRODUZIONE**
    """
    logger.debug("Test endpoint called")
    return {
        "status": "ok",
        "message": "Backend funziona correttamente"
    }

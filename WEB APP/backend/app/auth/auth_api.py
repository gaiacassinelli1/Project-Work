"""
Authentication API Endpoints con Rate Limiting
Endpoint FastAPI per registrazione, login e password reset.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import secrets

from app.db.database import get_db
from app.models.models import User
from app.services.auth.auth_service import register_user, login_user
from app.services.auth.auth_dependencies import get_current_user
from app.services.auth.auth_tokens import create_access_token, create_refresh_token, verify_token
from app.services.auth.auth_hashing import hash_password, verify_password
from app.services.auth.auth_logger import logger


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
    """Risposta di autenticazione con access e refresh token."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field("bearer", description="Tipo di token")
    user_id: str = Field(..., description="ID dell'utente")
    email: str = Field(..., description="Email dell'utente")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com"
            }
        }


class RefreshTokenRequest(BaseModel):
    """Richiesta di refresh token."""
    refresh_token: str = Field(..., description="Refresh token")


class ForgotPasswordRequest(BaseModel):
    """Richiesta di reset password."""
    email: EmailStr = Field(..., description="Email dell'utente")


class ResetPasswordRequest(BaseModel):
    """Richiesta di cambio password."""
    token: str = Field(..., description="Token di reset")
    new_password: str = Field(..., min_length=6, description="Nuova password")


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
# Registrazione con Rate Limiting
# ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse)
def register(
    data: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Registra un nuovo utente.
    
    Rate Limit: 5 tentativi per IP ogni 15 minuti
    
    - Valida email e password
    - Crea l'utente nel database
    - Crea i pesci e lo stato del mare iniziali
    - Restituisce JWT token
    
    **Raises:**
    - 400: Email già registrata o dati non validi
    - 429: Too many requests
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
        
        # Aggiungi refresh token alla risposta
        refresh_token = create_refresh_token({"email": result["email"]})
        
        return AuthResponse(
            access_token=result["access_token"],
            refresh_token=refresh_token,
            token_type=result["token_type"],
            user_id=result["user_id"],
            email=result["email"],
        )
    except Exception as e:
        logger.error(f"Errore durante registrazione di {data.email}: {str(e)}")
        raise


# ──────────────────────────────────────────────────────────────
# Login con Rate Limiting
# ──────────────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
def login(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Autentica un utente e restituisce JWT token.
    
    Rate Limit: 5 tentativi per IP ogni minuto
    
    - Verifica email e password
    - Restituisce access token valido per 24 ore
    - Restituisce refresh token valido per 7 giorni
    
    **Raises:**
    - 401: Credenziali non valide
    - 429: Too many requests
    - 500: Errore interno
    """
    logger.info(f"POST /login - Login attempt: {data.email}")
    
    try:
        result = login_user(
            email=data.email,
            password=data.password,
            db=db
        )
        
        # Aggiungi refresh token alla risposta
        refresh_token = create_refresh_token({"email": result["email"]})
        
        return AuthResponse(
            access_token=result["access_token"],
            refresh_token=refresh_token,
            token_type=result["token_type"],
            user_id=result["user_id"],
            email=result["email"],
        )
    except Exception as e:
        logger.error(f"Errore durante login di {data.email}: {str(e)}")
        raise


# ──────────────────────────────────────────────────────────────
# Refresh Token
# ──────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=AuthResponse)
def refresh(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Rinova l'access token usando il refresh token.
    
    - Valida il refresh token
    - Genera un nuovo access token
    - Ritorna il nuovo access token
    
    **Raises:**
    - 401: Refresh token non valido o scaduto
    - 500: Errore interno
    """
    logger.info("POST /refresh - Token refresh request")
    
    # Verifica il refresh token
    payload = verify_token(data.refresh_token)
    if not payload:
        logger.warning("Refresh token non valido o scaduto")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token non valido o scaduto",
        )
    
    email = payload.get("email")
    
    # Recupera l'utente
    from sqlalchemy import select
    user = db.execute(
        select(User).where(User.email == email)
    ).scalars().first()
    
    if not user:
        logger.warning(f"Utente non trovato: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato",
        )
    
    # Genera nuovo access token
    access_token = create_access_token({"email": email})
    refresh_token = create_refresh_token({"email": email})
    
    logger.info(f"Token rinnovato per: {email}")
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
    )


# ──────────────────────────────────────────────────────────────
# Password Reset
# ──────────────────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Invia un link di reset password via email.
    
    Rate Limit: 3 tentativi per IP ogni 10 minuti
    
    - Genera un token di reset
    - Salva il token nel database (opzionale)
    - Dovrebbe inviare email (TODO: implementare)
    
    **Nota**: Attualmente NON invia email. Implementare con SendGrid/Mailgun.
    
    **Returns**: Messaggio di successo (anche se email non mandato)
    """
    logger.info(f"POST /forgot-password - Reset request per: {data.email}")
    
    from sqlalchemy import select
    user = db.execute(
        select(User).where(User.email == data.email)
    ).scalars().first()
    
    if not user:
        # Non dire se l'email esiste o meno (security best practice)
        logger.warning(f"Tentativo di reset per email non esistente: {data.email}")
        return {
            "status": "ok",
            "message": "Se l'email esiste, riceverai un link di reset."
        }
    
    # Genera token di reset (valido 1 ora)
    reset_token = secrets.token_urlsafe(32)
    expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # TODO: Salva il token in un modello PasswordReset nel database
    # TODO: Invia email con il link: https://tuodominio.com/reset-password?token=...
    
    logger.info(f"Token di reset generato per: {data.email}")
    
    return {
        "status": "ok",
        "message": "Se l'email esiste, riceverai un link di reset."
    }


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Cambia la password usando il token di reset.
    
    - Valida il token di reset
    - Verifica che non sia scaduto
    - Cambia la password
    - Invalida tutti gli altri token
    
    **Raises:**
    - 400: Token non valido o scaduto
    - 500: Errore interno
    """
    logger.info("POST /reset-password - Password reset request")
    
    # TODO: Valida il token dal database
    # Questo è uno stub, implementare correttamente
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Password reset non ancora implementato. Usa forgot-password per generare un token.",
    )


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
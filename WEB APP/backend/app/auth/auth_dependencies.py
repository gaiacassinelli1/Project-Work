"""
Authentication Dependencies
Fornisce le dipendenze per proteggere le route FastAPI.
Migliorato con HTTPAuthCredentials e error handling robusto.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import User
from .auth_tokens import verify_token
from .auth_logger import logger


# Security scheme per Swagger/OpenAPI
security = HTTPBearer(
    description="Bearer token JWT",
    auto_error=False  # Gestisci manualmente l'errore
)


async def get_current_user(
    credentials: Optional[HTTPAuthCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dipendenza per proteggere le route.
    Estrae il token JWT dall'header Authorization e restituisce l'utente.
    
    Args:
        credentials: Credenziali HTTP Bearer (automaticamente estratte)
        db: Sessione database
        
    Returns:
        User: Oggetto utente dal database
        
    Raises:
        HTTPException: 401 se token non valido, non trovato, o utente non esiste
    """
    # Verifica che le credenziali siano fornite
    if not credentials:
        logger.warning("Richiesta senza token di autenticazione")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di autenticazione mancante",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Verifica il token JWT
    payload = verify_token(token)
    if payload is None:
        logger.warning(f"Token non valido o scaduto")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o scaduto",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("email")
    if not email:
        logger.error("Email non trovata nel payload del token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido: email mancante",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Recupera l'utente dal database
    try:
        user = db.execute(
            select(User).where(User.email == email)
        ).scalars().first()
        
        if not user:
            logger.warning(f"Utente non trovato nel database: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utente non trovato",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.debug(f"Utente autenticato: {user.email}")
        return user
        
    except HTTPException:
        # Re-raise HTTPException
        raise
    except Exception as e:
        logger.error(f"Errore nel recuperare l'utente dal database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante l'autenticazione",
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Dipendenza opzionale per l'autenticazione.
    Ritorna l'utente se autenticato, None altrimenti.
    Utile per endpoint che supportano sia accesso autenticato che anonimo.
    
    Args:
        credentials: Credenziali HTTP Bearer (opzionali)
        db: Sessione database
        
    Returns:
        User se autenticato, None altrimenti
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        return None
    
    email = payload.get("email")
    if not email:
        return None
    
    try:
        user = db.execute(
            select(User).where(User.email == email)
        ).scalars().first()
        return user
    except Exception as e:
        logger.error(f"Errore nel recuperare l'utente (optional): {str(e)}")
        return None

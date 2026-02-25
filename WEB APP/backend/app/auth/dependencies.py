"""
🔑 Authentication Dependencies
Fornisce le dipendenze per proteggere le route.
"""
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import User
from app.auth.tokens import verify_token


async def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    Dipendenza per proteggere le route.
    Estrae l'email dal token JWT e restituisce l'utente dal database.
    
    Args:
        authorization: Header Authorization (Bearer <token>)
        db: Sessione database
        
    Returns:
        User: Oggetto utente dal database
        
    Raises:
        HTTPException: 401 se token non valido o utente non trovato
    """
    print(f"[AUTH] get_current_user called, auth header: {authorization}")
    
    if not authorization:
        print("[AUTH] Authorization header mancante")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token mancante",
        )
    
    # Estrai il token dal header "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Schema non valido")
    except ValueError:
        print(f"[AUTH] Header Authorization malformato: {authorization}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header malformato",
        )
    
    # Verifica il token
    payload = verify_token(token)
    if payload is None:
        print("[AUTH] Token non valido o scaduto")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o scaduto",
        )
    
    email = payload.get("email")
    if not email:
        print("[AUTH] Email non trovata nel token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email non trovata nel token",
        )
    
    # Ottieni l'utente dal database
    user = db.execute(
        select(User).where(User.email == email)
    ).scalars().first()
    
    if not user:
        print(f"[AUTH] Utente non trovato: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato",
        )
    
    print(f"[AUTH] Utente autenticato: {user.email}")
    return user

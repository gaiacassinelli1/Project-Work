"""
🔐 JWT Token Module
Crea e verifica JWT tokens per l'autenticazione.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from app.auth.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un JWT token.
    
    Args:
        data: Dati da includere nel token (minimo: {"email": "..."})
        expires_delta: Durata personalizzata del token (default: 24h)
        
    Returns:
        Token JWT firmato
        
    Raises:
        RuntimeError: Se si verificano errori nella codifica
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        raise RuntimeError(f"Errore nella generazione del token: {str(e)}")


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifica un JWT token e estrae il payload.
    
    Args:
        token: JWT token da verificare
        
    Returns:
        Dict con il payload se valido, None altrimenti
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            return None
        return {"email": email}
    except JWTError:
        return None
    except Exception:
        return None

"""
JWT Token Module
Crea e verifica JWT tokens per l'autenticazione.
Supporta sia access token che refresh token.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError

from .auth_config import AuthConfig
from .auth_logger import logger


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crea un JWT access token.
    
    Args:
        data: Dati da includere nel token (minimo: {"email": "user@example.com"})
        expires_delta: Durata personalizzata del token (default: 24 ore)
        
    Returns:
        Token JWT firmato
        
    Raises:
        ValueError: Se i dati sono vuoti o None
        RuntimeError: Se si verificano errori nella codifica
    """
    if not data or not isinstance(data, dict):
        logger.error("Tentativo di creare token con dati non validi")
        raise ValueError("Data deve essere un dict non vuoto")
    
    if "email" not in data:
        logger.error("Email non trovata nei dati del token")
        raise ValueError("Email richiesta nei dati del token")
    
    try:
        to_encode = data.copy()
        
        # Imposta la scadenza
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + AuthConfig.get_access_token_expire_delta()
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc)
        })
        
        # Codifica il token
        encoded_jwt = jwt.encode(
            to_encode,
            AuthConfig.SECRET_KEY,
            algorithm=AuthConfig.ALGORITHM
        )
        
        logger.info(f"Access token creato per: {data.get('email')}")
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"Errore nella generazione del token: {str(e)}")
        raise RuntimeError(f"Errore nella generazione del token: {str(e)}")


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Crea un JWT refresh token (lunga durata).
    
    Args:
        data: Dati da includere nel token
        
    Returns:
        Token JWT di refresh
    """
    expires_delta = AuthConfig.get_refresh_token_expire_delta()
    return create_access_token(data, expires_delta)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifica un JWT token e estrae il payload.
    
    Args:
        token: JWT token da verificare
        
    Returns:
        Dict con il payload se valido, None altrimenti
    """
    if not token or not isinstance(token, str):
        logger.warning("Tentativo di verificare token non valido")
        return None
    
    try:
        payload = jwt.decode(
            token,
            AuthConfig.SECRET_KEY,
            algorithms=[AuthConfig.ALGORITHM]
        )
        
        email: str = payload.get("email")
        if not email:
            logger.warning("Email non trovata nel token")
            return None
        
        logger.debug(f"Token verificato per: {email}")
        return {"email": email}
        
    except JWTError as e:
        logger.warning(f"Token JWT non valido: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Errore non previsto nella verifica del token: {str(e)}")
        return None


def is_token_expired(token: str) -> bool:
    """
    Verifica se un token è scaduto.
    
    Args:
        token: JWT token
        
    Returns:
        True se scaduto, False se valido
    """
    try:
        payload = jwt.decode(
            token,
            AuthConfig.SECRET_KEY,
            algorithms=[AuthConfig.ALGORITHM]
        )
        
        exp = payload.get("exp")
        if not exp:
            return True
        
        exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
        is_expired = datetime.now(timezone.utc) > exp_datetime
        
        if is_expired:
            logger.info(f"Token scaduto per: {payload.get('email')}")
        
        return is_expired
        
    except JWTError:
        return True
    except Exception:
        return True


def decode_token_no_verify(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodifica un token SENZA verificare la firma.
    Utile per debugging e inspecting.
    
    ATTENZIONE: Non usare in produzione per validazione!
    
    Args:
        token: JWT token
        
    Returns:
        Payload decodificato
    """
    try:
        payload = jwt.decode(
            token,
            options={"verify_signature": False}
        )
        return payload
    except Exception as e:
        logger.error(f"Errore nel decodificare il token: {str(e)}")
        return None

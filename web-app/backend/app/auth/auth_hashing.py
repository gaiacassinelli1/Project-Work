"""
Password Hashing Module
Gestisce l'hashing e la verifica delle password con Argon2.
Migliorato con error handling e logging.
"""
from passlib.context import CryptContext
from typing import Optional

from .auth_config import AuthConfig
from .auth_logger import logger


# Configura il contesto per l'hashing
pwd_context = CryptContext(
    schemes=AuthConfig.PASSWORD_SCHEMES,
    deprecated="auto",
    argon2__rounds=3,  # Numero di iterazioni Argon2
)


def hash_password(password: str) -> str:
    """
    Hash una password usando Argon2.
    
    Args:
        password: Password in chiaro
        
    Returns:
        Hash sicuro della password
        
    Raises:
        ValueError: Se la password è vuota o None
    """
    if not password or not isinstance(password, str):
        logger.warning("Tentativo di hashare una password non valida")
        raise ValueError("Password non valida")
    
    if len(password) < AuthConfig.PASSWORD_MIN_LENGTH:
        logger.warning(
            f"Password troppo corta: {len(password)} < {AuthConfig.PASSWORD_MIN_LENGTH}"
        )
        raise ValueError(
            f"Password deve essere lunga almeno {AuthConfig.PASSWORD_MIN_LENGTH} caratteri"
        )
    
    try:
        hashed = pwd_context.hash(password)
        logger.debug("Password hashata con successo")
        return hashed
    except Exception as e:
        logger.error(f"Errore durante l'hashing della password: {str(e)}")
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica che una password corrisponda all'hash.
    
    Args:
        plain_password: Password in chiaro da verificare
        hashed_password: Hash memorizzato nel database
        
    Returns:
        True se le password corrispondono, False altrimenti
    """
    if not plain_password or not hashed_password:
        logger.warning("Tentativo di verificare password o hash vuoti")
        return False
    
    try:
        is_valid = pwd_context.verify(plain_password, hashed_password)
        
        if is_valid:
            logger.debug("Password verificata con successo")
        else:
            logger.warning("Password non corrisponde all'hash")
        
        return is_valid
    except Exception as e:
        logger.error(f"Errore durante la verifica della password: {str(e)}")
        return False


def needs_password_rehash(hashed_password: str) -> bool:
    """
    Verifica se una password hashata necessita di rehashing (es. dopo upgrade algoritmo).
    
    Args:
        hashed_password: Hash della password
        
    Returns:
        True se il rehashing è consigliato
    """
    try:
        return pwd_context.needs_update(hashed_password)
    except Exception as e:
        logger.error(f"Errore nel controllare se il rehashing è necessario: {str(e)}")
        return False

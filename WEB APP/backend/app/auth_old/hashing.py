"""
🔐 Password Hashing Module
Gestisce l'hashing e la verifica delle password con Argon2.
"""
from passlib.context import CryptContext
from app.auth.config import PASSWORD_SCHEMES

# Configura il contesto per l'hashing
pwd_context = CryptContext(schemes=PASSWORD_SCHEMES, deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash una password usando Argon2.
    
    Args:
        password: Password in chiaro
        
    Returns:
        Hash sicuro della password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica che una password corrisponda all'hash.
    
    Args:
        plain_password: Password in chiaro da verificare
        hashed_password: Hash memorizzato nel database
        
    Returns:
        True se le password corrispondono, False altrimenti
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

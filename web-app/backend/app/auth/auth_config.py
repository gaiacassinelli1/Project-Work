"""
Configurazione centralizzata per l'autenticazione.
Gestisce SECRET_KEY, algoritmi, timeout, e costanti globali.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Carica variabili di ambiente
load_dotenv()


class AuthConfig:
    """Configurazione di autenticazione."""
    
    # JWT Configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS = 24
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    
    # Password Configuration
    PASSWORD_MIN_LENGTH = 6
    PASSWORD_SCHEMES = ["argon2"]
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    
    def __post_init__(self):
        """Validazione della configurazione."""
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            raise ValueError(
                "SECRET_KEY non configurato correttamente. "
                "Deve essere una stringa di almeno 32 caratteri in .env"
            )
    
    @staticmethod
    def get_access_token_expire_delta() -> timedelta:
        """Ritorna la delta di scadenza per il token di accesso."""
        return timedelta(hours=AuthConfig.ACCESS_TOKEN_EXPIRE_HOURS)
    
    @staticmethod
    def get_refresh_token_expire_delta() -> timedelta:
        """Ritorna la delta di scadenza per il token di refresh."""
        return timedelta(days=AuthConfig.REFRESH_TOKEN_EXPIRE_DAYS)


# Validazione al caricamento
try:
    auth_config = AuthConfig()
except ValueError as e:
    print(f"[AUTH CONFIG ERROR] {str(e)}")
    import sys
    sys.exit(1)


# Esporta singleton
config = auth_config

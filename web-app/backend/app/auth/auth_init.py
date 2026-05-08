"""
🔐 Authentication Module - Init
Centralizza tutte le esportazioni del modulo di autenticazione.
"""

# Import dalle dipendenze interne
from app.auth.auth_hashing import hash_password, verify_password
from app.auth.auth_tokens import create_access_token, verify_token
from app.auth.auth_dependencies import get_current_user, get_current_user_optional
from app.auth.auth_service import register_user, login_user
from app.auth.auth_logger import logger
from app.auth.auth_config import config

# Esporta tutto quello che serve
__all__ = [
    # Hashing
    "hash_password",
    "verify_password",
    
    # Tokens
    "create_access_token",
    "verify_token",
    
    # Dependencies
    "get_current_user",
    "get_current_user_optional",
    
    # Service
    "register_user",
    "login_user",
    
    # Logger e Config
    "logger",
    "config",
]

"""
🔐 Authentication Module
Centralizza tutta la logica di autenticazione.

Esporta:
- register_user, login_user (service)
- get_current_user (dependencies)
- hash_password, verify_password (hashing)
- create_access_token, verify_token (tokens)
"""

from app.auth.service import register_user, login_user
from app.auth.dependencies import get_current_user
from app.auth.hashing import hash_password, verify_password
from app.auth.tokens import create_access_token, verify_token
from app.auth.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS

__all__ = [
    # Service
    "register_user",
    "login_user",
    # Dependencies
    "get_current_user",
    # Hashing
    "hash_password",
    "verify_password",
    # Tokens
    "create_access_token",
    "verify_token",
    # Config
    "SECRET_KEY",
    "ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_HOURS",
]

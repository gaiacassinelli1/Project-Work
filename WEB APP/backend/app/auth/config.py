"""
🔐 Authentication Configuration
Centralizza tutte le configurazioni di autenticazione.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "mare-calmo-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password Configuration
PASSWORD_MIN_LENGTH = 6
PASSWORD_SCHEMES = ["argon2"]  # Using Argon2 for better security

"""
🔐 Authentication Configuration
Centralizza tutte le configurazioni di autenticazione.
"""
import os
from dotenv import load_dotenv

# Carica .env dalla root del progetto
env_path = os.path.join(os.path.dirname(__file__), '../../../../.env')
load_dotenv(env_path)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "mare-calmo-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password Configuration
PASSWORD_MIN_LENGTH = 6
PASSWORD_SCHEMES = ["argon2"]  # Using Argon2 for better security

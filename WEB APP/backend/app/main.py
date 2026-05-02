"""
Mare Calmo - Main App
API per l'app di supporto all'ansia

Con rate limiting per proteggere gli endpoint auth
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
import os

# Import auth router (NUOVO SISTEMA)
from app.auth.auth_api import router as auth_router
from app.auth.auth_config import AuthConfig

from app.db.database import init_db

# Create app
app = FastAPI(
    title="Mare Calmo API",
    description="API per l'app di supporto all'ansia",
    version="1.0.0",
)

# ══════════════════════════════════════════════════════════════
# RATE LIMITING CONFIGURATION
# ══════════════════════════════════════════════════════════════
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request, exc):
    """Gestione errori rate limit"""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Troppi tentativi. Riprova più tardi.",
            "retry_after": exc.detail,
        },
    )

def _get_cors_origins():
    """Leggi CORS origins da env, con fallback per Vercel"""
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

    if os.getenv("VERCEL_URL"):
        vercel_url = f"https://{os.getenv('VERCEL_URL')}"
        if vercel_url not in cors_origins:
            cors_origins.append(vercel_url)

    return [origin.strip() for origin in cors_origins if origin.strip()]

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Init DB on startup
@app.on_event("startup")
def startup():
    init_db()

# Include routers con rate limiting
# I limiti sono definiti nei singoli endpoint di auth_api.py
app.include_router(auth_router)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "Mare Calmo API v1.0.0",
    }

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
    }
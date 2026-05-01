"""
Mare Calmo - Main App
API per l'app di supporto all'ansia
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=AuthConfig.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Init DB on startup
@app.on_event("startup")
def startup():
    init_db()

# Include routers
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
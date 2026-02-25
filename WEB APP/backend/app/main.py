"""
Mare Calmo — Backend API

Un'app di supporto all'ansia da prestazione che utilizza una metafora
visiva non competitiva e meccaniche di gamification soft, progettata per
favorire costanza, consapevolezza e raccolta dati longitudinali.

Stack: FastAPI + SQLite + SQLAlchemy 2.0 + MongoDB (optional)

Run:
    uvicorn app.main:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.database import init_db
from app.db.mongodb import init_mongodb
from app.routes.api import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB on startup."""
    init_db()
    print("✅ Database initialized (SQLite)")
    init_mongodb()
    print("🌊 Mare Calmo backend is ready")
    yield


app = FastAPI(
    title="Mare Calmo API",
    description=(
        "API event-driven per il supporto all'ansia da prestazione. "
        "Il backend centralizza la logica di progressione e restituisce "
        "esclusivamente stati discreti pronti per la visualizzazione."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — permetti accesso dal frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione: specificare l'URL del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware di error catching
@app.middleware("http")
async def error_middleware(request: Request, call_next):
    """Cattura e logga ALL tutti gli errori."""
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        print(f"[ERROR] Eccezione non gestita: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Errore interno: {str(e)}"}
        )

# Routes
app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": "Mare Calmo",
        "version": "0.1.0",
        "docs": "/docs",
        "status": "🌊 Il mare è calmo",
    }


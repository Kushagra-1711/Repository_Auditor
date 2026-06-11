"""
FastAPI application entry point.

Run locally with:
    uvicorn main:app --reload
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import settings
from db.database import init_db
from routes.auth import router as auth_router
from routes.audits import router as audits_router
from routes.reports import router as reports_router
from routes.reviews import router as reviews_router
from routes.contact import router as contact_router


# ---------------------------------------------------------------------------
# Rate limiter (keyed by client IP)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


# ---------------------------------------------------------------------------
# Lifespan — validate config + create DB tables on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: validate settings and create DB tables on startup."""
    settings.validate()
    await init_db()
    yield


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="RepoAuditor API",
    description="Backend API for the RepoAuditor platform — auth, reviews, and audit management.",
    version="1.0.0",
    lifespan=lifespan,
)

# Attach limiter to the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ---------------------------------------------------------------------------
# CORS — allow the frontend origin(s)
# ---------------------------------------------------------------------------
allowed_origins = [
    settings.FRONTEND_URL,           # e.g. http://localhost:8000
    "http://localhost:5500",          # VS Code Live Server
    "http://127.0.0.1:5500",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Mount routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(audits_router)
app.include_router(reports_router)
app.include_router(reviews_router)
app.include_router(contact_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "RepoAuditor API"}

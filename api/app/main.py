"""Seira API - FastAPI backend for sponsorship fulfillment."""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.auth import User, get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    settings = get_settings()
    print(f"Starting Seira API (env: {settings.ENV})")
    yield
    print("Shutting down Seira API")


settings = get_settings()

app = FastAPI(
    title="Seira API",
    version="2.0.0",
    description="Sponsorship fulfillment API",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://seira.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------------------


@app.get("/health", tags=["health"])
async def health_check():
    """Health check for load balancers and uptime monitors."""
    return {"status": "ok"}


@app.get("/me", tags=["auth"])
async def me(user: User = Depends(get_current_user)):
    """Return the current authenticated user."""
    return {"id": user.id, "email": user.email, "role": user.role}


# -----------------------------------------------------------------------------
# Routers
# -----------------------------------------------------------------------------

from app.api.v1 import users, agents

app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(agents.router, prefix="/api/v1", tags=["agents"])

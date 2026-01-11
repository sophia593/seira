"""Seira API - FastAPI backend for AI travel planning."""

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
    version="0.1.0",
    description="AI-powered travel planning assistant",
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
# Health & Debug
# -----------------------------------------------------------------------------


@app.get("/health", tags=["health"])
async def health_check():
    """Health check for load balancers and uptime monitors."""
    return {"status": "ok"}


@app.get("/metrics/ai", tags=["health"])
async def ai_metrics():
    """
    Get AI tool metrics (Gemini rescue, research_web).

    Shows success rates, trigger reasons, and source quality stats.
    Useful for monitoring and debugging AI behavior.
    """
    from app.ai.metrics import get_all_metrics
    return get_all_metrics()


@app.get("/me", tags=["auth"])
async def me(user: User = Depends(get_current_user)):
    """Return the current authenticated user. Useful for testing auth."""
    return {"id": user.id, "email": user.email, "role": user.role}


# -----------------------------------------------------------------------------
# Routers
# -----------------------------------------------------------------------------

from app.api.v1 import users, conversations, messages, chat, trips, metrics

app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(conversations.router, prefix="/api/v1", tags=["conversations"])
app.include_router(messages.router, prefix="/api/v1", tags=["messages"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(trips.router, prefix="/api/v1", tags=["trips"])
app.include_router(metrics.router, prefix="/api/v1", tags=["metrics"])

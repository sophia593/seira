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


@app.get("/debug/config", tags=["debug"])
async def debug_config():
    """Show non-sensitive configuration values. Disabled in production."""
    if settings.ENV == "production":
        return {"error": "Debug endpoints disabled in production"}

    return {
        "env": settings.ENV,
        "cors_origins": settings.CORS_ORIGINS,
        "claude_model": settings.CLAUDE_MODEL,
        "claude_max_tokens": settings.CLAUDE_MAX_TOKENS,
        "claude_timeout": settings.CLAUDE_TIMEOUT,
        "max_tool_rounds": settings.MAX_TOOL_ROUNDS,
        "max_context_tokens": settings.MAX_CONTEXT_TOKENS,
        "gemini_model": settings.GEMINI_MODEL,
        "gemini_max_tokens": settings.GEMINI_MAX_TOKENS,
        "gemini_timeout": settings.GEMINI_TIMEOUT,
        "amadeus_base_url": settings.AMADEUS_BASE_URL,
        "api_keys_configured": {
            "supabase": bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY),
            "anthropic": bool(settings.ANTHROPIC_API_KEY),
            "gemini": bool(settings.GEMINI_API_KEY),
            "ticketmaster": bool(settings.TICKETMASTER_API_KEY),
            "amadeus": bool(settings.AMADEUS_API_KEY and settings.AMADEUS_API_SECRET),
            "redis": bool(settings.UPSTASH_REDIS_REST_URL),
        },
    }


@app.get("/debug/db", tags=["debug"])
async def debug_db():
    """Test database connection and show table counts. Disabled in production."""
    if settings.ENV == "production":
        return {"error": "Debug endpoints disabled in production"}

    from app.core.database import get_supabase

    try:
        sb = get_supabase()
        tables = ["users", "conversations", "messages", "trips"]
        counts = {}

        for table in tables:
            try:
                res = sb.table(table).select("id", count="exact").limit(0).execute()
                counts[table] = res.count if res.count is not None else "unknown"
            except Exception as e:
                counts[table] = f"error: {str(e)[:50]}"

        return {
            "status": "connected",
            "supabase_url": settings.SUPABASE_URL[:40] + "...",
            "table_counts": counts,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/debug/redis", tags=["debug"])
async def debug_redis():
    """Test Redis connection. Disabled in production."""
    if settings.ENV == "production":
        return {"error": "Debug endpoints disabled in production"}

    if not settings.UPSTASH_REDIS_REST_URL:
        return {"status": "not_configured", "message": "UPSTASH_REDIS_REST_URL not set"}

    try:
        import httpx

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.UPSTASH_REDIS_REST_URL}/ping",
                headers={"Authorization": f"Bearer {settings.UPSTASH_REDIS_REST_TOKEN}"},
                timeout=5.0,
            )

            if response.status_code == 200:
                return {"status": "connected", "response": response.json()}
            else:
                return {"status": "error", "code": response.status_code, "body": response.text[:100]}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/debug/external-apis", tags=["debug"])
async def debug_external_apis():
    """Test external API connectivity (Ticketmaster, Amadeus). Disabled in production."""
    if settings.ENV == "production":
        return {"error": "Debug endpoints disabled in production"}

    import httpx

    results = {}

    # Test Ticketmaster
    if settings.TICKETMASTER_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://app.ticketmaster.com/discovery/v2/events.json",
                    params={"apikey": settings.TICKETMASTER_API_KEY, "size": 1},
                    timeout=10.0,
                )
                results["ticketmaster"] = {
                    "status": "ok" if resp.status_code == 200 else "error",
                    "code": resp.status_code,
                    "rate_limit_remaining": resp.headers.get("Rate-Limit-Available"),
                }
        except Exception as e:
            results["ticketmaster"] = {"status": "error", "message": str(e)[:100]}
    else:
        results["ticketmaster"] = {"status": "not_configured"}

    # Test Amadeus (get auth token)
    if settings.AMADEUS_API_KEY and settings.AMADEUS_API_SECRET:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{settings.AMADEUS_BASE_URL}/v1/security/oauth2/token",
                    data={
                        "grant_type": "client_credentials",
                        "client_id": settings.AMADEUS_API_KEY,
                        "client_secret": settings.AMADEUS_API_SECRET,
                    },
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results["amadeus"] = {
                        "status": "ok",
                        "token_type": data.get("token_type"),
                        "expires_in": data.get("expires_in"),
                        "base_url": settings.AMADEUS_BASE_URL,
                    }
                else:
                    results["amadeus"] = {"status": "error", "code": resp.status_code}
        except Exception as e:
            results["amadeus"] = {"status": "error", "message": str(e)[:100]}
    else:
        results["amadeus"] = {"status": "not_configured"}

    # Test Anthropic (just check if key format looks valid)
    if settings.ANTHROPIC_API_KEY:
        results["anthropic"] = {
            "status": "configured",
            "key_prefix": settings.ANTHROPIC_API_KEY[:10] + "...",
        }
    else:
        results["anthropic"] = {"status": "not_configured"}

    # Test Gemini
    if settings.GEMINI_API_KEY:
        results["gemini"] = {
            "status": "configured",
            "key_prefix": settings.GEMINI_API_KEY[:10] + "...",
        }
    else:
        results["gemini"] = {"status": "not_configured"}

    return results


@app.get("/debug/routes", tags=["debug"])
async def debug_routes():
    """List all registered routes. Disabled in production."""
    if settings.ENV == "production":
        return {"error": "Debug endpoints disabled in production"}

    routes = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods - {"HEAD", "OPTIONS"}),
                "name": route.name,
            })

    # Sort by path
    routes.sort(key=lambda r: r["path"])
    return {"total": len(routes), "routes": routes}


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

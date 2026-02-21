from __future__ import annotations

from typing import Any

import anyio
from fastapi import HTTPException, status
from supabase import create_client, Client

from app.core.config import get_settings

_supabase: Client | None = None


def get_supabase() -> Client:
    """
    Returns a singleton Supabase client configured with the SERVICE ROLE key.
    WARNING: service role bypasses RLS. Only use this on the backend.
    """
    global _supabase
    if _supabase is None:
        settings = get_settings()
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase


# ---------------------------------------------------------------------------
# Shared async query helper
# ---------------------------------------------------------------------------


def _sb_exec(query: Any) -> Any:
    """Execute a supabase-py query synchronously and normalize errors."""
    res = query.execute()
    err = getattr(res, "error", None)
    if err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {err}",
        )
    return getattr(res, "data", None)


async def execute(query: Any) -> Any:
    """Async wrapper — runs a supabase-py query in a thread."""
    return await anyio.to_thread.run_sync(_sb_exec, query)

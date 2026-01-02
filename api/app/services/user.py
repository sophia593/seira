"""
User service - business logic for users and preferences.
"""

from __future__ import annotations

from typing import Any, Optional, Dict

import anyio
from fastapi import HTTPException, status

from app.core.database import get_supabase


# -----------------------------------------------------------------------------
# Database helpers
# -----------------------------------------------------------------------------


def _sb_exec(query):
    """Execute a supabase-py query and normalize errors."""
    res = query.execute()
    err = getattr(res, "error", None)
    if err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {err}",
        )
    return getattr(res, "data", None)


async def _exec(query):
    """Async wrapper for supabase queries."""
    return await anyio.to_thread.run_sync(_sb_exec, query)


# -----------------------------------------------------------------------------
# User operations
# -----------------------------------------------------------------------------


async def get_user_row(user_id: str) -> Optional[Dict[str, Any]]:
    """Get a user by ID."""
    sb = get_supabase()
    data = await _exec(sb.table("users").select("*").eq("id", user_id).limit(1))
    if not data:
        return None
    return data[0]


async def create_user_row(
    user_id: str,
    email: str,
    name: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new user row."""
    sb = get_supabase()
    payload = {"id": user_id, "email": email, "name": name}
    # Insert then fetch (supabase-py sync doesn't support .insert().select() chain)
    await _exec(sb.table("users").insert(payload))
    # Fetch the created row
    data = await _exec(sb.table("users").select("*").eq("id", user_id).limit(1))
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create user row")
    return data[0]


async def update_user_row(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update a user row."""
    sb = get_supabase()
    # Update then fetch (supabase-py sync doesn't support .update().select() chain)
    await _exec(sb.table("users").update(updates).eq("id", user_id))
    data = await _exec(sb.table("users").select("*").eq("id", user_id).limit(1))
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return data[0]


async def ensure_user_exists(user_id: str, email: str, name: Optional[str] = None) -> Dict[str, Any]:
    """
    Ensure a row exists in public.users for this user.
    If not, create it.
    """
    existing = await get_user_row(user_id)
    if existing:
        return existing
    return await create_user_row(user_id, email, name)


# -----------------------------------------------------------------------------
# Preferences operations
# -----------------------------------------------------------------------------


async def get_preferences_row(user_id: str) -> Optional[Dict[str, Any]]:
    """Get preferences for a user."""
    sb = get_supabase()
    data = await _exec(
        sb.table("user_preferences").select("*").eq("user_id", user_id).limit(1)
    )
    if not data:
        return None
    return data[0]


async def upsert_preferences_row(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upsert preferences for user_id.
    Works whether row exists or not.
    """
    sb = get_supabase()
    payload = {"user_id": user_id, **updates}
    # Upsert then fetch (supabase-py sync doesn't support .upsert().select() chain)
    await _exec(sb.table("user_preferences").upsert(payload, on_conflict="user_id"))
    data = await _exec(
        sb.table("user_preferences").select("*").eq("user_id", user_id).limit(1)
    )
    if not data:
        raise HTTPException(status_code=500, detail="Failed to upsert preferences")
    return data[0]


async def ensure_preferences_exists(user_id: str) -> Dict[str, Any]:
    """Ensure preferences row exists, creating empty one if needed."""
    prefs = await get_preferences_row(user_id)
    if prefs:
        return prefs
    return await upsert_preferences_row(user_id, {})

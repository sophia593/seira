from __future__ import annotations

from datetime import datetime
from typing import Any, Optional, List, Dict

import anyio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.core.auth import User, get_current_user
from app.core.database import get_supabase

router = APIRouter(tags=["users"])


# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    created_at: Optional[datetime] = None


class UserPreferencesResponse(BaseModel):
    user_id: str
    home_airport: Optional[str] = None
    preferred_airlines: Optional[List[str]] = None
    seat_preference: Optional[str] = None
    cabin_class: Optional[str] = "economy"
    budget_default: Optional[int] = None
    updated_at: Optional[datetime] = None

    @field_validator("home_airport")
    @classmethod
    def validate_home_airport(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if len(v) != 3:
            raise ValueError("home_airport must be a 3-letter IATA code")
        return v

    @field_validator("preferred_airlines")
    @classmethod
    def validate_airlines(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        cleaned = []
        for a in v:
            if a is None:
                continue
            a2 = a.strip().upper()
            if a2:
                cleaned.append(a2)
        return cleaned


class UserWithPreferencesResponse(BaseModel):
    user: UserResponse
    preferences: UserPreferencesResponse


class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)


class UpdatePreferencesRequest(BaseModel):
    home_airport: Optional[str] = None
    preferred_airlines: Optional[List[str]] = None
    seat_preference: Optional[str] = None
    cabin_class: Optional[str] = None
    budget_default: Optional[int] = Field(default=None, ge=0)

    @field_validator("home_airport")
    @classmethod
    def validate_home_airport(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if len(v) != 3:
            raise ValueError("home_airport must be a 3-letter IATA code")
        return v

    @field_validator("preferred_airlines")
    @classmethod
    def validate_airlines(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        cleaned = []
        for a in v:
            if a is None:
                continue
            a2 = a.strip().upper()
            if a2:
                cleaned.append(a2)
        return cleaned


# -----------------------------------------------------------------------------
# Supabase helpers (sync client wrapped for async endpoints)
# -----------------------------------------------------------------------------

def _sb_exec(query):
    """Execute a supabase-py query and normalize errors."""
    res = query.execute()
    # supabase-py typically returns { data, error } or raises; handle both patterns.
    err = getattr(res, "error", None)
    if err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {err}",
        )
    return getattr(res, "data", None)


async def sb_exec(query):
    return await anyio.to_thread.run_sync(_sb_exec, query)


async def get_user_row(user_id: str) -> Optional[Dict[str, Any]]:
    sb = get_supabase()
    data = await sb_exec(sb.table("users").select("*").eq("id", user_id).limit(1))
    if not data:
        return None
    return data[0]


async def create_user_row(user_id: str, email: str, name: Optional[str]) -> Dict[str, Any]:
    sb = get_supabase()
    payload = {"id": user_id, "email": email, "name": name}
    data = await sb_exec(sb.table("users").insert(payload).select("*"))
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create user row")
    return data[0]


async def update_user_row(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    sb = get_supabase()
    data = await sb_exec(sb.table("users").update(updates).eq("id", user_id).select("*"))
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return data[0]


async def get_preferences_row(user_id: str) -> Optional[Dict[str, Any]]:
    sb = get_supabase()
    data = await sb_exec(
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
    data = await sb_exec(
        sb.table("user_preferences")
        .upsert(payload, on_conflict="user_id")
        .select("*")
    )
    if not data:
        raise HTTPException(status_code=500, detail="Failed to upsert preferences")
    return data[0]


async def ensure_user_exists(user: User) -> Dict[str, Any]:
    """
    Ensure a row exists in public.users for this JWT user.
    If not, create it.
    """
    existing = await get_user_row(user.id)
    if existing:
        return existing

    # Name fallback: try user_metadata if your User carries it; otherwise None
    name = None
    try:
        if hasattr(user, "user_metadata") and isinstance(user.user_metadata, dict):
            name = user.user_metadata.get("full_name") or user.user_metadata.get("name")
    except Exception:
        name = None

    return await create_user_row(user.id, user.email, name)


async def ensure_preferences_exists(user_id: str) -> Dict[str, Any]:
    prefs = await get_preferences_row(user_id)
    if prefs:
        return prefs
    # create empty row via upsert
    return await upsert_preferences_row(user_id, {})


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@router.get("/me", response_model=UserWithPreferencesResponse)
async def get_me(current: User = Depends(get_current_user)):
    """
    Return current user profile + preferences.
    Creates missing public.users and/or user_preferences rows if needed.
    """
    user_row = await ensure_user_exists(current)
    prefs_row = await ensure_preferences_exists(current.id)

    return {
        "user": user_row,
        "preferences": prefs_row,
    }


@router.patch("/me", response_model=UserResponse)
async def patch_me(
    body: UpdateUserRequest,
    current: User = Depends(get_current_user),
):
    """
    Update current user's profile (currently only name).
    Creates the user row if missing.
    """
    await ensure_user_exists(current)

    updates: Dict[str, Any] = {}
    if body.name is not None:
        updates["name"] = body.name.strip() if body.name else None

    if not updates:
        # No changes requested — return current row
        row = await get_user_row(current.id)
        if not row:
            row = await ensure_user_exists(current)
        return row

    updated = await update_user_row(current.id, updates)
    return updated


@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def get_my_preferences(current: User = Depends(get_current_user)):
    """
    Return only preferences.
    Creates preferences row if missing.
    """
    await ensure_user_exists(current)
    prefs = await ensure_preferences_exists(current.id)
    return prefs


@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def put_my_preferences(
    body: UpdatePreferencesRequest,
    current: User = Depends(get_current_user),
):
    """
    Upsert preferences for current user.
    """
    await ensure_user_exists(current)

    updates = body.model_dump(exclude_unset=True)

    # Normalize strings (optional but nice)
    if "seat_preference" in updates and updates["seat_preference"] is not None:
        updates["seat_preference"] = updates["seat_preference"].strip()

    if "cabin_class" in updates and updates["cabin_class"] is not None:
        updates["cabin_class"] = updates["cabin_class"].strip()

    prefs = await upsert_preferences_row(current.id, updates)
    return prefs

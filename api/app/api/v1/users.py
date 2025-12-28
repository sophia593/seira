from __future__ import annotations

from datetime import datetime
from typing import Any, Optional, List, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.core.auth import User, get_current_user
from app.services import user as user_service

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
# Helpers
# -----------------------------------------------------------------------------


async def _ensure_user_exists(user: User) -> Dict[str, Any]:
    """
    Ensure a row exists in public.users for this JWT user.
    If not, create it with name from user_metadata if available.
    """
    # Try to get name from user metadata
    name = None
    try:
        if hasattr(user, "user_metadata") and isinstance(user.user_metadata, dict):
            name = user.user_metadata.get("full_name") or user.user_metadata.get("name")
    except Exception:
        name = None

    return await user_service.ensure_user_exists(user.id, user.email, name)


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@router.get("/me", response_model=UserWithPreferencesResponse)
async def get_me(current: User = Depends(get_current_user)):
    """
    Return current user profile + preferences.
    Creates missing public.users and/or user_preferences rows if needed.
    """
    user_row = await _ensure_user_exists(current)
    prefs_row = await user_service.ensure_preferences_exists(current.id)

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
    await _ensure_user_exists(current)

    updates: Dict[str, Any] = {}
    if body.name is not None:
        updates["name"] = body.name.strip() if body.name else None

    if not updates:
        # No changes requested — return current row
        row = await user_service.get_user_row(current.id)
        if not row:
            row = await _ensure_user_exists(current)
        return row

    updated = await user_service.update_user_row(current.id, updates)
    return updated


@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def get_my_preferences(current: User = Depends(get_current_user)):
    """
    Return only preferences.
    Creates preferences row if missing.
    """
    await _ensure_user_exists(current)
    prefs = await user_service.ensure_preferences_exists(current.id)
    return prefs


@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def put_my_preferences(
    body: UpdatePreferencesRequest,
    current: User = Depends(get_current_user),
):
    """
    Upsert preferences for current user.
    """
    await _ensure_user_exists(current)

    updates = body.model_dump(exclude_unset=True)

    # Normalize strings (optional but nice)
    if "seat_preference" in updates and updates["seat_preference"] is not None:
        updates["seat_preference"] = updates["seat_preference"].strip()

    if "cabin_class" in updates and updates["cabin_class"] is not None:
        updates["cabin_class"] = updates["cabin_class"].strip()

    prefs = await user_service.upsert_preferences_row(current.id, updates)
    return prefs

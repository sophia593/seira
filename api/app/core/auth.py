from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Any

import jwt
from jwt import InvalidTokenError
from jwt.exceptions import ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

# Bearer auth: Authorization: Bearer <token>
security = HTTPBearer(auto_error=False)


@dataclass
class User:
    """Authenticated user extracted from a Supabase JWT."""
    id: str
    email: str = ""
    role: str = "authenticated"
    app_metadata: dict[str, Any] = None
    user_metadata: dict[str, Any] = None

    def __post_init__(self):
        if self.app_metadata is None:
            self.app_metadata = {}
        if self.user_metadata is None:
            self.user_metadata = {}


def _expected_issuer(supabase_url: str) -> str:
    # Supabase tokens typically have: iss = {SUPABASE_URL}/auth/v1
    return f"{supabase_url.rstrip('/')}/auth/v1"


def validate_jwt(token: str) -> dict[str, Any]:
    """
    Validate Supabase JWT and return payload.
    Uses HS256 with your Supabase JWT secret (backend-only).
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=_expected_issuer(settings.SUPABASE_URL),
            options={"require": ["exp", "sub", "aud", "iss"]},
        )
        return payload

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (InvalidAudienceError, InvalidIssuerError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _user_from_payload(payload: dict[str, Any]) -> User:
    return User(
        id=payload["sub"],
        email=payload.get("email", "") or "",
        role=payload.get("role", "authenticated") or "authenticated",
        app_metadata=payload.get("app_metadata") or {},
        user_metadata=payload.get("user_metadata") or {},
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    """Require a valid Bearer token and return the user."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = validate_jwt(credentials.credentials)
    return _user_from_payload(payload)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:
    """Return user if token provided + valid; return None if no token."""
    if credentials is None:
        return None

    payload = validate_jwt(credentials.credentials)
    return _user_from_payload(payload)


def require_owner(user: User, resource_user_id: str) -> None:
    """
    Extra guard after you fetch something (defense-in-depth).
    Uses 404 to avoid leaking whether a resource exists.
    """
    if user.id != resource_user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

"""
Trip service - business logic for trips.
"""

from __future__ import annotations

from typing import Any, Optional, List, Dict

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
# Trip operations
# -----------------------------------------------------------------------------


async def get_trip(trip_id: str) -> Optional[Dict[str, Any]]:
    """Get a single trip by ID."""
    sb = get_supabase()
    data = await _exec(
        sb.table("trips").select("*").eq("id", trip_id).limit(1)
    )
    if not data:
        return None
    return data[0]


async def list_trips(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    status_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List trips for a user.
    Returns trips ordered by most recently updated.
    """
    sb = get_supabase()
    query = sb.table("trips").select("*").eq("user_id", user_id)

    if status_filter:
        query = query.eq("status", status_filter)

    query = query.order("updated_at", desc=True).range(offset, offset + limit - 1)
    data = await _exec(query)
    return data or []


async def create_trip(
    user_id: str,
    title: str = "Untitled Trip",
    conversation_id: Optional[str] = None,
    **kwargs,
) -> Dict[str, Any]:
    """Create a new trip."""
    sb = get_supabase()
    payload: Dict[str, Any] = {
        "user_id": user_id,
        "title": title,
    }

    if conversation_id:
        payload["conversation_id"] = conversation_id

    # Add any additional fields
    allowed_fields = [
        "status", "notes", "destination_city", "destination_country",
        "event_name", "event_date", "event_time", "event_provider",
        "event_provider_id", "event_venue", "event_venue_address",
        "event_price_estimate", "event_purchase_url",
        "flight_offer_id", "flight_origin", "flight_destination",
        "flight_outbound_date", "flight_outbound_time",
        "flight_return_date", "flight_return_time",
        "flight_price", "flight_carrier", "flight_booking_ref",
        "flight_purchase_url",
        "hotel_name", "hotel_check_in", "hotel_check_out",
        "hotel_price", "hotel_purchase_url",
        "estimated_total", "quoted_at", "quote_expires_at",
    ]

    for field in allowed_fields:
        if field in kwargs and kwargs[field] is not None:
            payload[field] = kwargs[field]

    # Insert then fetch
    await _exec(sb.table("trips").insert(payload))
    # Get the most recent trip for this user
    data = await _exec(
        sb.table("trips")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
    )
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create trip")
    return data[0]


async def update_trip(
    trip_id: str,
    updates: Dict[str, Any],
) -> Dict[str, Any]:
    """Update a trip."""
    sb = get_supabase()

    # Filter to allowed fields
    allowed_fields = [
        "title", "status", "notes", "destination_city", "destination_country",
        "event_name", "event_date", "event_time", "event_provider",
        "event_provider_id", "event_venue", "event_venue_address",
        "event_price_estimate", "event_purchase_url",
        "flight_offer_id", "flight_origin", "flight_destination",
        "flight_outbound_date", "flight_outbound_time",
        "flight_return_date", "flight_return_time",
        "flight_price", "flight_carrier", "flight_booking_ref",
        "flight_purchase_url",
        "hotel_name", "hotel_check_in", "hotel_check_out",
        "hotel_price", "hotel_purchase_url",
        "estimated_total", "quoted_at", "quote_expires_at",
    ]

    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}

    if not filtered_updates:
        # No changes - return existing
        trip = await get_trip(trip_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        return trip

    # Update then fetch
    await _exec(sb.table("trips").update(filtered_updates).eq("id", trip_id))
    data = await _exec(sb.table("trips").select("*").eq("id", trip_id).limit(1))
    if not data:
        raise HTTPException(status_code=404, detail="Trip not found")
    return data[0]


async def delete_trip(trip_id: str) -> None:
    """Delete a trip."""
    sb = get_supabase()
    await _exec(sb.table("trips").delete().eq("id", trip_id))


# -----------------------------------------------------------------------------
# Share operations
# -----------------------------------------------------------------------------


def _generate_share_token() -> str:
    """Generate a unique share token (URL-safe, 12 characters)."""
    import secrets
    return secrets.token_urlsafe(9)  # 9 bytes = 12 chars base64


async def generate_share_token(trip_id: str, shared_by_name: Optional[str] = None) -> str:
    """Generate and save a share token for a trip."""
    sb = get_supabase()
    token = _generate_share_token()

    update_data: Dict[str, Any] = {"share_token": token}
    if shared_by_name:
        update_data["shared_by_name"] = shared_by_name

    await _exec(sb.table("trips").update(update_data).eq("id", trip_id))
    return token


async def remove_share_token(trip_id: str) -> None:
    """Remove sharing from a trip."""
    sb = get_supabase()
    await _exec(
        sb.table("trips")
        .update({"share_token": None, "shared_by_name": None})
        .eq("id", trip_id)
    )


async def get_trip_by_share_token(token: str) -> Optional[Dict[str, Any]]:
    """Get a trip by its share token (for public access)."""
    sb = get_supabase()
    data = await _exec(
        sb.table("trips").select("*").eq("share_token", token).limit(1)
    )
    if not data:
        return None
    return data[0]


async def duplicate_trip(source_trip: Dict[str, Any], new_user_id: str) -> Dict[str, Any]:
    """
    Duplicate a trip for a new user.
    Copies all trip details except user-specific fields.
    """
    sb = get_supabase()

    # Fields to copy from source trip
    copy_fields = [
        "title", "notes", "destination_city", "destination_country",
        "event_name", "event_date", "event_time", "event_provider",
        "event_provider_id", "event_venue", "event_venue_address",
        "event_price_estimate", "event_purchase_url",
        # Note: We copy flight/hotel details but they may need to be re-searched
        "flight_origin", "flight_destination",
        "flight_outbound_date", "flight_return_date",
        "hotel_check_in", "hotel_check_out",
    ]

    payload: Dict[str, Any] = {
        "user_id": new_user_id,
        "status": "draft",  # Always start as draft
        "title": f"{source_trip.get('title', 'Trip')} (copy)",
    }

    for field in copy_fields:
        if field in source_trip and source_trip[field] is not None:
            if field != "title":  # Don't override the modified title
                payload[field] = source_trip[field]

    # Insert the new trip
    await _exec(sb.table("trips").insert(payload))

    # Get the newly created trip
    data = await _exec(
        sb.table("trips")
        .select("*")
        .eq("user_id", new_user_id)
        .order("created_at", desc=True)
        .limit(1)
    )
    if not data:
        raise HTTPException(status_code=500, detail="Failed to duplicate trip")
    return data[0]

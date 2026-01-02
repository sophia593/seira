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

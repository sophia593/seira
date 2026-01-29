"""
Shared trips API routes (public, no auth required).
"""

from __future__ import annotations

from typing import Any, Optional, Dict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import User, get_current_user
from app.services import trip as trip_service

router = APIRouter(prefix="/shared", tags=["shared"])


# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------


class SharedTripResponse(BaseModel):
    """Shared trip response (read-only view)."""
    id: str
    title: str
    status: str
    shared_by_name: Optional[str] = None

    # Destination
    destination_city: Optional[str] = None
    destination_country: Optional[str] = None

    # Event
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    event_venue: Optional[str] = None
    event_venue_address: Optional[str] = None
    event_price_estimate: Optional[float] = None
    event_purchase_url: Optional[str] = None

    # Flight
    flight_origin: Optional[str] = None
    flight_destination: Optional[str] = None
    flight_outbound_date: Optional[str] = None
    flight_outbound_time: Optional[str] = None
    flight_return_date: Optional[str] = None
    flight_return_time: Optional[str] = None
    flight_price: Optional[float] = None
    flight_carrier: Optional[str] = None

    # Hotel
    hotel_name: Optional[str] = None
    hotel_check_in: Optional[str] = None
    hotel_check_out: Optional[str] = None
    hotel_price: Optional[float] = None

    # Total
    estimated_total: Optional[float] = None

    # Metadata
    created_at: datetime


class DuplicateTripResponse(BaseModel):
    """Response after duplicating a trip."""
    id: str
    title: str


# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------


def _format_shared_trip(trip: Dict[str, Any]) -> Dict[str, Any]:
    """Format trip data for shared response, converting dates/times to strings."""
    result = dict(trip)

    # Remove sensitive fields
    sensitive_fields = [
        "user_id", "conversation_id", "notes",
        "flight_offer_id", "flight_booking_ref", "flight_purchase_url",
        "hotel_purchase_url", "share_token",
        "quoted_at", "quote_expires_at", "updated_at",
    ]
    for field in sensitive_fields:
        result.pop(field, None)

    # Convert date fields to strings
    date_fields = ["event_date", "flight_outbound_date", "flight_return_date",
                   "hotel_check_in", "hotel_check_out"]
    for field in date_fields:
        if result.get(field) and hasattr(result[field], "isoformat"):
            result[field] = result[field].isoformat()

    # Convert time fields to strings
    time_fields = ["event_time", "flight_outbound_time", "flight_return_time"]
    for field in time_fields:
        if result.get(field) and hasattr(result[field], "isoformat"):
            result[field] = result[field].isoformat()

    # Convert Decimal to float
    decimal_fields = ["event_price_estimate", "flight_price", "hotel_price", "estimated_total"]
    for field in decimal_fields:
        if result.get(field) is not None:
            result[field] = float(result[field])

    return result


# -----------------------------------------------------------------------------
# Routes (PUBLIC - no auth required)
# -----------------------------------------------------------------------------


@router.get("/{token}", response_model=SharedTripResponse)
async def get_shared_trip(token: str):
    """
    Get a shared trip by its share token.
    This endpoint is public and does not require authentication.
    """
    trip = await trip_service.get_trip_by_share_token(token)

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Shared trip not found or link has expired"
        )

    return _format_shared_trip(trip)


@router.post("/{token}/duplicate", response_model=DuplicateTripResponse)
async def duplicate_shared_trip(
    token: str,
    current: User = Depends(get_current_user),
):
    """
    Duplicate a shared trip to the current user's account.
    Requires authentication.
    """
    # Get the source trip
    source_trip = await trip_service.get_trip_by_share_token(token)

    if not source_trip:
        raise HTTPException(
            status_code=404,
            detail="Shared trip not found or link has expired"
        )

    # Don't allow duplicating own trip
    if source_trip["user_id"] == current.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot duplicate your own trip"
        )

    # Duplicate the trip
    new_trip = await trip_service.duplicate_trip(source_trip, current.id)

    return DuplicateTripResponse(
        id=new_trip["id"],
        title=new_trip["title"],
    )

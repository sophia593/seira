"""
Trips API routes.
"""

from __future__ import annotations

from datetime import datetime, date
from typing import Any, Optional, List, Dict
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.core.auth import User, get_current_user
from app.services import trip as trip_service
from app.integrations.ticketmaster import TicketmasterClient

router = APIRouter(prefix="/trips", tags=["trips"])


# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------


class TripResponse(BaseModel):
    """Basic trip response for list views."""
    id: str
    title: str
    status: str
    destination_city: Optional[str] = None
    destination_country: Optional[str] = None
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    estimated_total: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class TripDetailResponse(TripResponse):
    """Full trip details."""
    conversation_id: Optional[str] = None
    notes: Optional[str] = None

    # Event
    event_time: Optional[str] = None
    event_provider: Optional[str] = None
    event_provider_id: Optional[str] = None
    event_venue: Optional[str] = None
    event_venue_address: Optional[str] = None
    event_price_estimate: Optional[float] = None
    event_purchase_url: Optional[str] = None

    # Flight
    flight_offer_id: Optional[str] = None
    flight_origin: Optional[str] = None
    flight_destination: Optional[str] = None
    flight_outbound_date: Optional[str] = None
    flight_outbound_time: Optional[str] = None
    flight_return_date: Optional[str] = None
    flight_return_time: Optional[str] = None
    flight_price: Optional[float] = None
    flight_carrier: Optional[str] = None
    flight_booking_ref: Optional[str] = None
    flight_purchase_url: Optional[str] = None

    # Hotel
    hotel_name: Optional[str] = None
    hotel_check_in: Optional[str] = None
    hotel_check_out: Optional[str] = None
    hotel_price: Optional[float] = None
    hotel_purchase_url: Optional[str] = None

    # Quote
    quoted_at: Optional[datetime] = None
    quote_expires_at: Optional[datetime] = None


class CreateTripRequest(BaseModel):
    """Request to create a new trip."""
    title: str = Field(default="Untitled Trip", max_length=200)
    conversation_id: Optional[str] = None
    destination_city: Optional[str] = None
    destination_country: Optional[str] = None
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    notes: Optional[str] = None


class UpdateTripRequest(BaseModel):
    """Request to update a trip."""
    title: Optional[str] = Field(default=None, max_length=200)
    status: Optional[str] = None
    notes: Optional[str] = None
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
    flight_return_date: Optional[str] = None
    flight_price: Optional[float] = None
    flight_carrier: Optional[str] = None
    flight_purchase_url: Optional[str] = None

    # Hotel
    hotel_name: Optional[str] = None
    hotel_check_in: Optional[str] = None
    hotel_check_out: Optional[str] = None
    hotel_price: Optional[float] = None
    hotel_purchase_url: Optional[str] = None

    # Total
    estimated_total: Optional[float] = None


# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------


def _format_trip(trip: Dict[str, Any]) -> Dict[str, Any]:
    """Format trip data for response, converting dates/times to strings."""
    result = dict(trip)

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
# Routes
# -----------------------------------------------------------------------------


@router.get("", response_model=List[TripResponse])
async def list_trips(
    current: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status: Optional[str] = Query(default=None),
):
    """List all trips for the current user."""
    trips = await trip_service.list_trips(
        user_id=current.id,
        limit=limit,
        offset=offset,
        status_filter=status,
    )
    return [_format_trip(t) for t in trips]


@router.get("/{trip_id}", response_model=TripDetailResponse)
async def get_trip(
    trip_id: str,
    current: User = Depends(get_current_user),
):
    """Get a single trip by ID."""
    trip = await trip_service.get_trip(trip_id)

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Verify ownership
    if trip["user_id"] != current.id:
        raise HTTPException(status_code=404, detail="Trip not found")

    return _format_trip(trip)


@router.post("", response_model=TripDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    body: CreateTripRequest,
    current: User = Depends(get_current_user),
):
    """Create a new trip."""
    trip = await trip_service.create_trip(
        user_id=current.id,
        **body.model_dump(exclude_unset=True),
    )
    return _format_trip(trip)


@router.patch("/{trip_id}", response_model=TripDetailResponse)
async def update_trip(
    trip_id: str,
    body: UpdateTripRequest,
    current: User = Depends(get_current_user),
):
    """Update a trip."""
    # First verify the trip exists and belongs to user
    existing = await trip_service.get_trip(trip_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Trip not found")
    if existing["user_id"] != current.id:
        raise HTTPException(status_code=404, detail="Trip not found")

    updates = body.model_dump(exclude_unset=True)
    trip = await trip_service.update_trip(trip_id, updates)
    return _format_trip(trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: str,
    current: User = Depends(get_current_user),
):
    """Delete a trip."""
    # First verify the trip exists and belongs to user
    existing = await trip_service.get_trip(trip_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Trip not found")
    if existing["user_id"] != current.id:
        raise HTTPException(status_code=404, detail="Trip not found")

    await trip_service.delete_trip(trip_id)


class RefreshQuotesResponse(BaseModel):
    """Response from refreshing trip quotes."""
    trip: TripDetailResponse
    event_updated: bool = False
    previous_price: Optional[float] = None
    new_price: Optional[float] = None
    price_change: Optional[float] = None


@router.post("/{trip_id}/refresh-quotes", response_model=RefreshQuotesResponse)
async def refresh_quotes(
    trip_id: str,
    current: User = Depends(get_current_user),
):
    """
    Refresh quotes for a trip by re-fetching event data from Ticketmaster.

    Updates the trip with current pricing information.
    """
    # Verify trip exists and user owns it
    existing = await trip_service.get_trip(trip_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Trip not found")
    if existing["user_id"] != current.id:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Check if trip has a Ticketmaster event linked
    event_provider = existing.get("event_provider")
    event_provider_id = existing.get("event_provider_id")

    if not event_provider_id or event_provider != "ticketmaster":
        raise HTTPException(
            status_code=400,
            detail="Trip has no Ticketmaster event linked. Cannot refresh quotes."
        )

    # Store previous price for comparison
    previous_price = existing.get("event_price_estimate")
    if previous_price is not None:
        previous_price = float(previous_price)

    # Fetch updated event data from Ticketmaster
    try:
        async with TicketmasterClient() as client:
            event = await client.get_event(event_provider_id)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch event from Ticketmaster: {str(e)}"
        )

    # Prepare updates with fresh event data
    updates: Dict[str, Any] = {
        "quoted_at": datetime.utcnow().isoformat(),
    }

    # Update event details if available
    if event.name:
        updates["event_name"] = event.name
    if event.date:
        updates["event_date"] = event.date
    if event.time:
        updates["event_time"] = event.time
    if event.venue:
        updates["event_venue"] = event.venue.name
        if event.venue.address:
            venue_address = event.venue.address
            if event.venue.city:
                venue_address += f", {event.venue.city}"
            if event.venue.state:
                venue_address += f", {event.venue.state}"
            updates["event_venue_address"] = venue_address
        if event.venue.city:
            updates["destination_city"] = event.venue.city
        if event.venue.country:
            updates["destination_country"] = event.venue.country
    if event.purchase_url:
        updates["event_purchase_url"] = event.purchase_url

    # Update price if available
    new_price = None
    if event.price_range and event.price_range.min is not None:
        new_price = event.price_range.min
        updates["event_price_estimate"] = new_price

        # Recalculate estimated total
        flight_price = existing.get("flight_price") or 0
        hotel_price = existing.get("hotel_price") or 0
        if flight_price:
            flight_price = float(flight_price)
        if hotel_price:
            hotel_price = float(hotel_price)
        updates["estimated_total"] = new_price + flight_price + hotel_price

    # Update the trip
    updated_trip = await trip_service.update_trip(trip_id, updates)

    # Calculate price change
    price_change = None
    if previous_price is not None and new_price is not None:
        price_change = new_price - previous_price

    return RefreshQuotesResponse(
        trip=TripDetailResponse(**_format_trip(updated_trip)),
        event_updated=True,
        previous_price=previous_price,
        new_price=new_price,
        price_change=price_change,
    )

"""
Events API routes.

Direct access to event search (Ticketmaster) for UI-first approach.
No AI orchestration - just search and return results.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.auth import User, get_current_user
from app.integrations.ticketmaster import TicketmasterClient, Event, EventSearchResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["events"])


# -----------------------------------------------------------------------------
# Response Models
# -----------------------------------------------------------------------------


class VenueResponse(BaseModel):
    """Venue information."""
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None


class PriceRangeResponse(BaseModel):
    """Price range for an event."""
    min: Optional[float] = None
    max: Optional[float] = None
    currency: str = "USD"


class EventResponse(BaseModel):
    """Single event in search results."""
    id: str
    name: str
    date: str
    time: Optional[str] = None
    venue: Optional[VenueResponse] = None
    image_url: Optional[str] = None
    price_range: Optional[PriceRangeResponse] = None
    purchase_url: str
    genre: Optional[str] = None
    segment: Optional[str] = None
    status: Optional[str] = None
    provider: str = "ticketmaster"
    provider_id: str


class EventSearchResponse(BaseModel):
    """Search results response."""
    events: list[EventResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------


def _event_to_response(event: Event) -> EventResponse:
    """Convert internal Event to API response."""
    venue = None
    if event.venue:
        venue = VenueResponse(
            name=event.venue.name,
            city=event.venue.city,
            state=event.venue.state,
            address=event.venue.address,
        )

    price_range = None
    if event.price_range:
        price_range = PriceRangeResponse(
            min=event.price_range.min,
            max=event.price_range.max,
            currency=event.price_range.currency,
        )

    return EventResponse(
        id=event.id,
        name=event.name,
        date=event.date,
        time=event.time,
        venue=venue,
        image_url=event.image_url,
        price_range=price_range,
        purchase_url=event.purchase_url,
        genre=event.genre,
        segment=event.segment,
        status=event.status,
        provider=event.provider,
        provider_id=event.provider_id,
    )


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------


@router.get("/search", response_model=EventSearchResponse)
async def search_events(
    q: Optional[str] = Query(None, description="Search keyword (artist, team, event name)"),
    city: Optional[str] = Query(None, description="City name"),
    state: Optional[str] = Query(None, description="State code (e.g., CA, NY)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    genre: Optional[str] = Query(None, description="Genre filter"),
    segment: Optional[str] = Query(None, description="Segment (Music, Sports, Arts & Theatre)"),
    page: int = Query(0, ge=0, description="Page number (0-indexed)"),
    size: int = Query(20, ge=1, le=50, description="Results per page"),
    current_user: User = Depends(get_current_user),
) -> EventSearchResponse:
    """
    Search for events via Ticketmaster.

    Returns paginated list of events matching the search criteria.
    At least one of `q`, `city`, or `date_from` should be provided.
    """
    # Validate at least one search param
    if not any([q, city, date_from]):
        raise HTTPException(
            status_code=400,
            detail="At least one of 'q', 'city', or 'date_from' is required",
        )

    logger.info(f"Event search: q={q}, city={city}, state={state}, dates={date_from}-{date_to}")

    try:
        async with TicketmasterClient() as client:
            result = await client.search_events(
                keyword=q,
                city=city,
                state_code=state,
                start_date=date_from,
                end_date=date_to,
                genre=genre,
                segment=segment,
                page=page,
                size=size,
            )

        return EventSearchResponse(
            events=[_event_to_response(e) for e in result.events],
            total_count=result.total_count,
            page=result.page,
            page_size=result.page_size,
            total_pages=result.total_pages,
        )

    except ValueError as e:
        # Missing API key or config error
        logger.error(f"Ticketmaster config error: {e}")
        raise HTTPException(status_code=503, detail="Event search unavailable")

    except Exception as e:
        logger.exception(f"Event search failed: {e}")
        raise HTTPException(status_code=500, detail="Event search failed")


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
) -> EventResponse:
    """
    Get a single event by ID.

    The event_id should be the Ticketmaster event ID (without the 'tm_' prefix).
    """
    # Strip 'tm_' prefix if present
    provider_id = event_id.removeprefix("tm_")

    try:
        async with TicketmasterClient() as client:
            event = await client.get_event(provider_id)

        return _event_to_response(event)

    except Exception as e:
        logger.exception(f"Get event failed: {e}")
        raise HTTPException(status_code=404, detail="Event not found")

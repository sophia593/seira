"""
Flights API routes.

Direct access to flight search (Amadeus) for UI-first approach.
No AI orchestration - just search and return results.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.auth import User, get_current_user
from app.integrations.amadeus import (
    AmadeusClient,
    FlightOffer,
    FlightSegment,
    FlightSearchResult,
    format_duration,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/flights", tags=["flights"])


# -----------------------------------------------------------------------------
# Response Models
# -----------------------------------------------------------------------------


class FlightSegmentResponse(BaseModel):
    """A single flight segment."""
    departure_airport: str
    departure_time: str
    arrival_airport: str
    arrival_time: str
    carrier_code: str
    carrier_name: Optional[str] = None
    flight_number: str
    aircraft: Optional[str] = None
    duration: str
    duration_formatted: str
    stops: int = 0


class FlightOfferResponse(BaseModel):
    """A complete flight offer."""
    id: str
    source: str = "amadeus"

    # Price
    price: float
    currency: str = "USD"
    price_per_adult: Optional[float] = None

    # Outbound
    outbound_segments: list[FlightSegmentResponse]
    outbound_duration: str
    outbound_duration_formatted: str
    outbound_stops: int

    # Return (optional for one-way)
    return_segments: Optional[list[FlightSegmentResponse]] = None
    return_duration: Optional[str] = None
    return_duration_formatted: Optional[str] = None
    return_stops: Optional[int] = None

    # Booking info
    validating_carrier: str
    validating_carrier_name: Optional[str] = None
    booking_class: Optional[str] = None
    seats_available: Optional[int] = None

    # Convenience fields
    is_round_trip: bool
    is_nonstop: bool


class FlightSearchResponse(BaseModel):
    """Search results response."""
    offers: list[FlightOfferResponse]
    search_params: dict
    total_count: int


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

# Carrier name lookup
AIRLINE_NAMES = {
    "AA": "American Airlines",
    "UA": "United Airlines",
    "DL": "Delta Air Lines",
    "WN": "Southwest Airlines",
    "B6": "JetBlue Airways",
    "AS": "Alaska Airlines",
    "NK": "Spirit Airlines",
    "F9": "Frontier Airlines",
    "G4": "Allegiant Air",
    "HA": "Hawaiian Airlines",
    "BA": "British Airways",
    "AF": "Air France",
    "LH": "Lufthansa",
    "EK": "Emirates",
    "AC": "Air Canada",
}


def _segment_to_response(segment: FlightSegment) -> FlightSegmentResponse:
    """Convert internal FlightSegment to API response."""
    return FlightSegmentResponse(
        departure_airport=segment.departure_airport,
        departure_time=segment.departure_time,
        arrival_airport=segment.arrival_airport,
        arrival_time=segment.arrival_time,
        carrier_code=segment.carrier_code,
        carrier_name=segment.carrier_name or AIRLINE_NAMES.get(segment.carrier_code),
        flight_number=segment.flight_number,
        aircraft=segment.aircraft,
        duration=segment.duration,
        duration_formatted=format_duration(segment.duration),
        stops=segment.stops,
    )


def _offer_to_response(offer: FlightOffer) -> FlightOfferResponse:
    """Convert internal FlightOffer to API response."""
    outbound_segments = [_segment_to_response(s) for s in offer.outbound_segments]

    return_segments = None
    return_duration_formatted = None
    if offer.return_segments:
        return_segments = [_segment_to_response(s) for s in offer.return_segments]
        return_duration_formatted = format_duration(offer.return_duration) if offer.return_duration else None

    return FlightOfferResponse(
        id=offer.id,
        source=offer.source,
        price=offer.price,
        currency=offer.currency,
        price_per_adult=offer.price_per_adult,
        outbound_segments=outbound_segments,
        outbound_duration=offer.outbound_duration,
        outbound_duration_formatted=format_duration(offer.outbound_duration),
        outbound_stops=offer.outbound_stops,
        return_segments=return_segments,
        return_duration=offer.return_duration,
        return_duration_formatted=return_duration_formatted,
        return_stops=offer.return_stops,
        validating_carrier=offer.validating_carrier,
        validating_carrier_name=AIRLINE_NAMES.get(offer.validating_carrier),
        booking_class=offer.booking_class,
        seats_available=offer.seats_available,
        is_round_trip=offer.return_segments is not None,
        is_nonstop=offer.outbound_stops == 0 and (offer.return_stops is None or offer.return_stops == 0),
    )


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------


@router.get("/search", response_model=FlightSearchResponse)
async def search_flights(
    origin: str = Query(..., description="Origin airport IATA code (e.g., LAX)"),
    destination: str = Query(..., description="Destination airport IATA code (e.g., JFK)"),
    departure_date: str = Query(..., description="Departure date (YYYY-MM-DD)"),
    return_date: Optional[str] = Query(None, description="Return date for round trip (YYYY-MM-DD)"),
    adults: int = Query(1, ge=1, le=9, description="Number of adult passengers"),
    cabin_class: str = Query("ECONOMY", description="Cabin class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)"),
    max_offers: int = Query(10, ge=1, le=50, description="Maximum number of offers"),
    nonstop_only: bool = Query(False, description="Only return nonstop flights"),
    current_user: User = Depends(get_current_user),
) -> FlightSearchResponse:
    """
    Search for flights via Amadeus.

    Returns a list of flight offers matching the search criteria.
    """
    logger.info(
        f"Flight search: {origin} -> {destination}, "
        f"depart={departure_date}, return={return_date}, "
        f"adults={adults}, cabin={cabin_class}"
    )

    try:
        async with AmadeusClient() as client:
            if not client.is_configured():
                raise HTTPException(
                    status_code=503,
                    detail="Flight search is not configured"
                )

            result = await client.search_flights(
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                cabin_class=cabin_class,
                max_offers=max_offers,
                nonstop_only=nonstop_only,
            )

        offers = [_offer_to_response(o) for o in result.offers]

        return FlightSearchResponse(
            offers=offers,
            search_params=result.search_params,
            total_count=len(offers),
        )

    except ValueError as e:
        logger.error(f"Amadeus config error: {e}")
        raise HTTPException(status_code=503, detail="Flight search unavailable")

    except Exception as e:
        logger.exception(f"Flight search failed: {e}")
        raise HTTPException(status_code=500, detail="Flight search failed")

"""
Hotels API routes.

Direct access to hotel search (Amadeus) for UI-first approach.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.auth import User, get_current_user
from app.integrations.amadeus import AmadeusHotelClient, HotelOffer, HotelSearchResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hotels", tags=["hotels"])


# -----------------------------------------------------------------------------
# Response Models
# -----------------------------------------------------------------------------


class HotelOfferResponse(BaseModel):
    """A hotel offer."""
    id: str
    hotel_id: str
    hotel_name: str
    hotel_rating: Optional[int] = None

    # Location
    city_code: str
    address: Optional[str] = None
    distance_km: Optional[float] = None

    # Room
    room_type: Optional[str] = None
    room_description: Optional[str] = None
    bed_type: Optional[str] = None
    guests: int

    # Price
    price: float
    currency: str
    price_per_night: Optional[float] = None

    # Dates
    check_in: str
    check_out: str
    nights: int

    # Amenities
    amenities: list[str] = []

    # Policies
    cancellation_policy: Optional[str] = None
    payment_type: Optional[str] = None


class HotelSearchResponse(BaseModel):
    """Hotel search results."""
    offers: list[HotelOfferResponse]
    search_params: dict
    total_count: int


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

# City to IATA code mapping
CITY_TO_CODE = {
    "los angeles": "LAX",
    "new york": "NYC",
    "chicago": "CHI",
    "san francisco": "SFO",
    "miami": "MIA",
    "boston": "BOS",
    "seattle": "SEA",
    "denver": "DEN",
    "atlanta": "ATL",
    "dallas": "DFW",
    "phoenix": "PHX",
    "las vegas": "LAS",
    "orlando": "ORL",
    "philadelphia": "PHL",
    "houston": "HOU",
    "minneapolis": "MSP",
    "detroit": "DTT",
    "san diego": "SAN",
    "tampa": "TPA",
    "portland": "PDX",
    "austin": "AUS",
    "nashville": "BNA",
    "new orleans": "MSY",
    "salt lake city": "SLC",
    "san antonio": "SAT",
    "indianapolis": "IND",
    "charlotte": "CLT",
    "columbus": "CMH",
    "kansas city": "MCI",
    "cleveland": "CLE",
    "pittsburgh": "PIT",
    "cincinnati": "CVG",
    "milwaukee": "MKE",
    "st. louis": "STL",
    "sacramento": "SMF",
    "baltimore": "BWI",
    "washington": "WAS",
}


def get_city_code(city_name: str) -> str:
    """Convert city name to IATA code."""
    normalized = city_name.lower().strip()
    return CITY_TO_CODE.get(normalized, city_name.upper()[:3])


def _offer_to_response(offer: HotelOffer) -> HotelOfferResponse:
    """Convert internal HotelOffer to API response."""
    return HotelOfferResponse(
        id=offer.id,
        hotel_id=offer.hotel_id,
        hotel_name=offer.hotel_name,
        hotel_rating=offer.hotel_rating,
        city_code=offer.city_code,
        address=offer.address,
        distance_km=offer.distance_km,
        room_type=offer.room_type,
        room_description=offer.room_description,
        bed_type=offer.bed_type,
        guests=offer.guests,
        price=offer.price,
        currency=offer.currency,
        price_per_night=offer.price_per_night,
        check_in=offer.check_in,
        check_out=offer.check_out,
        nights=offer.nights,
        amenities=offer.amenities,
        cancellation_policy=offer.cancellation_policy,
        payment_type=offer.payment_type,
    )


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------


@router.get("/search", response_model=HotelSearchResponse)
async def search_hotels(
    city: str = Query(..., description="City name or IATA code (e.g., 'Los Angeles' or 'LAX')"),
    check_in: str = Query(..., description="Check-in date (YYYY-MM-DD)"),
    check_out: str = Query(..., description="Check-out date (YYYY-MM-DD)"),
    adults: int = Query(2, ge=1, le=9, description="Number of adult guests"),
    rooms: int = Query(1, ge=1, le=5, description="Number of rooms"),
    min_rating: Optional[int] = Query(None, ge=1, le=5, description="Minimum star rating"),
    max_price: Optional[int] = Query(None, description="Maximum total price"),
    max_offers: int = Query(20, ge=1, le=50, description="Maximum number of offers"),
    current_user: User = Depends(get_current_user),
) -> HotelSearchResponse:
    """
    Search for hotels via Amadeus.

    Returns a list of hotel offers matching the search criteria.
    """
    # Convert city name to code if needed
    city_code = get_city_code(city) if len(city) > 3 else city.upper()

    logger.info(
        f"Hotel search: {city} ({city_code}), "
        f"{check_in} to {check_out}, "
        f"{adults} adults, {rooms} rooms"
    )

    # Build ratings filter
    ratings = None
    if min_rating:
        ratings = list(range(min_rating, 6))  # e.g., min_rating=3 -> [3, 4, 5]

    # Build price range
    price_range = None
    if max_price:
        price_range = f"0-{max_price}"

    try:
        async with AmadeusHotelClient() as client:
            if not client.is_configured():
                raise HTTPException(
                    status_code=503,
                    detail="Hotel search is not configured"
                )

            result = await client.search_hotels(
                city_code=city_code,
                check_in=check_in,
                check_out=check_out,
                adults=adults,
                rooms=rooms,
                ratings=ratings,
                price_range=price_range,
                max_offers=max_offers,
            )

        offers = [_offer_to_response(o) for o in result.offers]

        return HotelSearchResponse(
            offers=offers,
            search_params=result.search_params,
            total_count=len(offers),
        )

    except ValueError as e:
        logger.error(f"Amadeus config error: {e}")
        raise HTTPException(status_code=503, detail="Hotel search unavailable")

    except Exception as e:
        logger.exception(f"Hotel search failed: {e}")
        raise HTTPException(status_code=500, detail="Hotel search failed")

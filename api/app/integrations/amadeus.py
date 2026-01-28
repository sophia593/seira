"""
Amadeus Flight Search API Client

Documentation: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import datetime
from typing import Any

import httpx
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.redis import cache_get, cache_set

logger = logging.getLogger(__name__)

# Cache TTL: 10 minutes for flight searches
CACHE_TTL_SECONDS = 10 * 60

# Token cache TTL: 25 minutes (tokens last 30 min, refresh early)
TOKEN_CACHE_TTL = 25 * 60


# -----------------------------------------------------------------------------
# Types
# -----------------------------------------------------------------------------


class FlightSegment(BaseModel):
    """A single flight segment (one takeoff to one landing)."""
    departure_airport: str
    departure_time: str  # ISO datetime
    arrival_airport: str
    arrival_time: str  # ISO datetime
    carrier_code: str
    carrier_name: str | None = None
    flight_number: str
    aircraft: str | None = None
    duration: str  # ISO 8601 duration (PT2H30M)
    stops: int = 0


class FlightOffer(BaseModel):
    """A complete flight offer (may have multiple segments)."""
    id: str
    source: str = "amadeus"

    # Price
    price: float
    currency: str = "USD"
    price_per_adult: float | None = None

    # Outbound
    outbound_segments: list[FlightSegment]
    outbound_duration: str  # Total duration
    outbound_stops: int

    # Return (optional for one-way)
    return_segments: list[FlightSegment] | None = None
    return_duration: str | None = None
    return_stops: int | None = None

    # Booking
    validating_carrier: str
    booking_class: str | None = None
    fare_type: str | None = None

    # Metadata
    seats_available: int | None = None
    instant_ticketing: bool = False
    is_mock: bool = False


class FlightSearchResult(BaseModel):
    """Search result with flight offers."""
    offers: list[FlightOffer]
    search_params: dict[str, Any]
    dictionaries: dict[str, Any] | None = None  # Carrier names, aircraft, etc.
    is_mock: bool = False


# -----------------------------------------------------------------------------
# Airline name mapping (common carriers)
# -----------------------------------------------------------------------------

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
    "SY": "Sun Country Airlines",
    # International
    "BA": "British Airways",
    "AF": "Air France",
    "LH": "Lufthansa",
    "KL": "KLM Royal Dutch",
    "EK": "Emirates",
    "QR": "Qatar Airways",
    "SQ": "Singapore Airlines",
    "CX": "Cathay Pacific",
    "JL": "Japan Airlines",
    "NH": "All Nippon Airways",
    "AC": "Air Canada",
    "AM": "Aeromexico",
    "AV": "Avianca",
    "LA": "LATAM Airlines",
    "IB": "Iberia",
    "VS": "Virgin Atlantic",
}


# -----------------------------------------------------------------------------
# Client
# -----------------------------------------------------------------------------


class AmadeusClient:
    """Client for Amadeus Flight Search API."""

    CACHE_PREFIX = "amadeus:flights:"
    TOKEN_CACHE_KEY = "amadeus:token"

    def __init__(
        self,
        api_key: str | None = None,
        api_secret: str | None = None,
        base_url: str | None = None,
        use_cache: bool = True,
    ):
        settings = get_settings()
        self.api_key = api_key or settings.AMADEUS_API_KEY
        self.api_secret = api_secret or settings.AMADEUS_API_SECRET
        self.base_url = base_url or settings.AMADEUS_BASE_URL
        self.use_cache = use_cache

        self._access_token: str | None = None
        self._token_expires_at: float = 0

        logger.info(
            f"AmadeusClient init: api_key={'SET' if self.api_key else 'MISSING'}, "
            f"api_secret={'SET' if self.api_secret else 'MISSING'}"
        )

        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"Accept": "application/json"},
        )

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()

    def is_configured(self) -> bool:
        """Check if Amadeus credentials are configured."""
        return bool(self.api_key and self.api_secret)

    # -------------------------------------------------------------------------
    # OAuth2 Token Management
    # -------------------------------------------------------------------------

    async def get_access_token(self) -> str:
        """
        Get a valid access token, refreshing if needed.

        Amadeus uses OAuth2 client credentials flow.
        Tokens are valid for 30 minutes.
        """
        # Check if we have a valid cached token
        if self._access_token and time.time() < self._token_expires_at:
            return self._access_token

        # Try to get token from Redis cache
        if self.use_cache:
            cached_token = await cache_get(self.TOKEN_CACHE_KEY)
            if cached_token:
                logger.debug("Using cached Amadeus access token")
                self._access_token = cached_token if isinstance(cached_token, str) else cached_token.get("token")
                self._token_expires_at = time.time() + TOKEN_CACHE_TTL
                return self._access_token

        # Request new token
        logger.info("Requesting new Amadeus access token")

        try:
            response = await self.client.post(
                f"{self.base_url}/v1/security/oauth2/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.api_key,
                    "client_secret": self.api_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            data = response.json()

            self._access_token = data["access_token"]
            expires_in = data.get("expires_in", 1800)  # Default 30 min
            self._token_expires_at = time.time() + expires_in - 60  # Refresh 1 min early

            # Cache the token
            if self.use_cache:
                await cache_set(
                    self.TOKEN_CACHE_KEY,
                    self._access_token,
                    ex=TOKEN_CACHE_TTL,
                )

            logger.info(f"Obtained Amadeus access token, expires in {expires_in}s")
            return self._access_token

        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to get Amadeus token: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Failed to get Amadeus token: {e}")
            raise

    def _make_cache_key(self, params: dict[str, Any]) -> str:
        """Generate a deterministic cache key from search parameters."""
        param_str = json.dumps(params, sort_keys=True)
        hash_digest = hashlib.sha256(param_str.encode()).hexdigest()[:16]
        return f"{self.CACHE_PREFIX}{hash_digest}"

    # -------------------------------------------------------------------------
    # Flight Search
    # -------------------------------------------------------------------------

    async def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,  # YYYY-MM-DD
        return_date: str | None = None,  # YYYY-MM-DD for round trip
        adults: int = 1,
        cabin_class: str = "ECONOMY",  # ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
        max_offers: int = 10,
        nonstop_only: bool = False,
    ) -> FlightSearchResult:
        """
        Search for flight offers.

        Args:
            origin: Origin airport IATA code (e.g., "LAX")
            destination: Destination airport IATA code (e.g., "JFK")
            departure_date: Departure date (YYYY-MM-DD)
            return_date: Return date for round trip (YYYY-MM-DD), None for one-way
            adults: Number of adult passengers
            cabin_class: Cabin class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
            max_offers: Maximum number of offers to return
            nonstop_only: Only return nonstop flights

        Returns:
            FlightSearchResult with normalized flight offers
        """
        # Normalize inputs
        origin = origin.upper().strip()
        destination = destination.upper().strip()
        cabin_class = cabin_class.upper().replace(" ", "_")

        # Map common cabin names
        cabin_mapping = {
            "ECONOMY": "ECONOMY",
            "PREMIUM_ECONOMY": "PREMIUM_ECONOMY",
            "PREMIUM": "PREMIUM_ECONOMY",
            "BUSINESS": "BUSINESS",
            "FIRST": "FIRST",
            "FIRST_CLASS": "FIRST",
        }
        cabin_class = cabin_mapping.get(cabin_class, "ECONOMY")

        search_params = {
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "adults": adults,
            "cabin_class": cabin_class,
            "max_offers": max_offers,
            "nonstop_only": nonstop_only,
        }

        logger.info(f"Searching Amadeus flights: {origin} -> {destination}, {departure_date}")

        # Check cache first
        cache_key = self._make_cache_key(search_params)
        if self.use_cache:
            cached = await cache_get(cache_key)
            if cached:
                logger.debug(f"Cache hit for {cache_key}")
                try:
                    if isinstance(cached, str):
                        cached = json.loads(cached)
                    return FlightSearchResult(**cached)
                except Exception as e:
                    logger.warning(f"Failed to parse cached flight data: {e}")

        # Get access token
        token = await self.get_access_token()

        # Build request body
        origin_destinations = [
            {
                "id": "1",
                "originLocationCode": origin,
                "destinationLocationCode": destination,
                "departureDateTimeRange": {"date": departure_date},
            }
        ]

        if return_date:
            origin_destinations.append({
                "id": "2",
                "originLocationCode": destination,
                "destinationLocationCode": origin,
                "departureDateTimeRange": {"date": return_date},
            })

        travelers = [{"id": str(i + 1), "travelerType": "ADULT"} for i in range(adults)]

        request_body = {
            "currencyCode": "USD",
            "originDestinations": origin_destinations,
            "travelers": travelers,
            "sources": ["GDS"],
            "searchCriteria": {
                "maxFlightOffers": max_offers,
                "flightFilters": {
                    "cabinRestrictions": [
                        {
                            "cabin": cabin_class,
                            "coverage": "MOST_SEGMENTS",
                            "originDestinationIds": ["1"] + (["2"] if return_date else []),
                        }
                    ],
                },
            },
        }

        if nonstop_only:
            request_body["searchCriteria"]["flightFilters"]["connectionRestriction"] = {
                "maxNumberOfConnections": 0
            }

        # Make API request
        try:
            response = await self.client.post(
                f"{self.base_url}/v2/shopping/flight-offers",
                json=request_body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"Amadeus API error: {e.response.status_code} - {e.response.text[:500]}")
            raise
        except Exception as e:
            logger.error(f"Amadeus request failed: {e}")
            raise

        # Parse response
        offers_data = data.get("data", [])
        dictionaries = data.get("dictionaries", {})

        offers = [
            self._parse_offer(offer, dictionaries, return_date is not None)
            for offer in offers_data
        ]

        result = FlightSearchResult(
            offers=offers,
            search_params=search_params,
            dictionaries=dictionaries,
            is_mock=False,
        )

        # Cache result
        if self.use_cache and offers:
            try:
                await cache_set(
                    cache_key,
                    result.model_dump(mode="json"),
                    ex=CACHE_TTL_SECONDS,
                )
                logger.debug(f"Cached {cache_key} for {CACHE_TTL_SECONDS}s")
            except Exception as e:
                logger.warning(f"Failed to cache flight result: {e}")

        logger.info(f"Amadeus returned {len(offers)} flight offers")
        return result

    # -------------------------------------------------------------------------
    # Response Parsing
    # -------------------------------------------------------------------------

    def _parse_offer(
        self,
        offer: dict[str, Any],
        dictionaries: dict[str, Any],
        is_round_trip: bool,
    ) -> FlightOffer:
        """Parse Amadeus flight offer into normalized FlightOffer."""

        # Price
        price_info = offer.get("price", {})
        total_price = float(price_info.get("grandTotal", price_info.get("total", 0)))
        currency = price_info.get("currency", "USD")

        # Per adult price
        traveler_pricings = offer.get("travelerPricings", [])
        price_per_adult = None
        if traveler_pricings:
            adult_pricing = next(
                (tp for tp in traveler_pricings if tp.get("travelerType") == "ADULT"),
                traveler_pricings[0]
            )
            price_per_adult = float(adult_pricing.get("price", {}).get("total", 0))

        # Parse itineraries
        itineraries = offer.get("itineraries", [])

        outbound_segments = []
        outbound_duration = ""
        outbound_stops = 0

        return_segments = None
        return_duration = None
        return_stops = None

        if itineraries:
            # Outbound
            outbound = itineraries[0]
            outbound_duration = outbound.get("duration", "")
            outbound_segments = [
                self._parse_segment(seg, dictionaries)
                for seg in outbound.get("segments", [])
            ]
            outbound_stops = len(outbound_segments) - 1

            # Return (if round trip)
            if is_round_trip and len(itineraries) > 1:
                return_itin = itineraries[1]
                return_duration = return_itin.get("duration", "")
                return_segments = [
                    self._parse_segment(seg, dictionaries)
                    for seg in return_itin.get("segments", [])
                ]
                return_stops = len(return_segments) - 1

        # Validating carrier
        validating_carrier = offer.get("validatingAirlineCodes", [""])[0]

        # Booking class and fare type
        booking_class = None
        fare_type = None
        if traveler_pricings:
            fare_details = traveler_pricings[0].get("fareDetailsBySegment", [])
            if fare_details:
                booking_class = fare_details[0].get("class")
                fare_type = fare_details[0].get("fareBasis")

        # Seats available
        seats = offer.get("numberOfBookableSeats")

        return FlightOffer(
            id=offer.get("id", ""),
            source="amadeus",
            price=total_price,
            currency=currency,
            price_per_adult=price_per_adult,
            outbound_segments=outbound_segments,
            outbound_duration=outbound_duration,
            outbound_stops=outbound_stops,
            return_segments=return_segments,
            return_duration=return_duration,
            return_stops=return_stops,
            validating_carrier=validating_carrier,
            booking_class=booking_class,
            fare_type=fare_type,
            seats_available=seats,
            instant_ticketing=offer.get("instantTicketingRequired", False),
            is_mock=False,
        )

    def _parse_segment(
        self,
        segment: dict[str, Any],
        dictionaries: dict[str, Any],
    ) -> FlightSegment:
        """Parse a single flight segment."""

        departure = segment.get("departure", {})
        arrival = segment.get("arrival", {})
        operating = segment.get("operating", {})

        carrier_code = operating.get("carrierCode") or segment.get("carrierCode", "")

        # Get carrier name from dictionaries or fallback
        carriers = dictionaries.get("carriers", {})
        carrier_name = carriers.get(carrier_code) or AIRLINE_NAMES.get(carrier_code)

        # Get aircraft info
        aircraft_code = segment.get("aircraft", {}).get("code", "")
        aircraft_dict = dictionaries.get("aircraft", {})
        aircraft_name = aircraft_dict.get(aircraft_code, aircraft_code)

        return FlightSegment(
            departure_airport=departure.get("iataCode", ""),
            departure_time=departure.get("at", ""),
            arrival_airport=arrival.get("iataCode", ""),
            arrival_time=arrival.get("at", ""),
            carrier_code=carrier_code,
            carrier_name=carrier_name,
            flight_number=f"{carrier_code}{segment.get('number', '')}",
            aircraft=aircraft_name,
            duration=segment.get("duration", ""),
            stops=segment.get("numberOfStops", 0),
        )


# -----------------------------------------------------------------------------
# Convenience function
# -----------------------------------------------------------------------------


async def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str | None = None,
    adults: int = 1,
    cabin_class: str = "ECONOMY",
    **kwargs,
) -> FlightSearchResult:
    """
    Convenience function to search flights.

    Usage:
        results = await search_flights(
            origin="LAX",
            destination="JFK",
            departure_date="2026-02-14",
            return_date="2026-02-18",
            adults=1,
            cabin_class="ECONOMY",
        )
    """
    async with AmadeusClient() as client:
        if not client.is_configured():
            raise ValueError("Amadeus API credentials not configured")
        return await client.search_flights(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            adults=adults,
            cabin_class=cabin_class,
            **kwargs,
        )


# -----------------------------------------------------------------------------
# Hotel Types
# -----------------------------------------------------------------------------


class HotelOffer(BaseModel):
    """A hotel offer with price and details."""
    id: str
    hotel_id: str
    hotel_name: str
    hotel_rating: int | None = None  # 1-5 stars

    # Location
    city_code: str
    latitude: float | None = None
    longitude: float | None = None
    address: str | None = None
    distance_km: float | None = None

    # Room details
    room_type: str | None = None
    room_description: str | None = None
    bed_type: str | None = None
    guests: int = 2

    # Price
    price: float
    currency: str = "USD"
    price_per_night: float | None = None

    # Dates
    check_in: str
    check_out: str
    nights: int

    # Amenities
    amenities: list[str] = []

    # Booking
    cancellation_policy: str | None = None
    payment_type: str | None = None  # "GUARANTEE", "DEPOSIT", etc.

    # Source
    source: str = "amadeus"


class HotelSearchResult(BaseModel):
    """Hotel search results."""
    offers: list[HotelOffer]
    search_params: dict[str, Any]
    is_mock: bool = False


# -----------------------------------------------------------------------------
# Hotel Client
# -----------------------------------------------------------------------------


class AmadeusHotelClient:
    """Client for Amadeus Hotel Search API."""

    CACHE_PREFIX = "amadeus:hotels:"
    TOKEN_CACHE_KEY = "amadeus:token"
    HOTEL_CACHE_TTL = 10 * 60  # 10 minutes

    def __init__(
        self,
        api_key: str | None = None,
        api_secret: str | None = None,
        base_url: str | None = None,
        use_cache: bool = True,
    ):
        settings = get_settings()
        self.api_key = api_key or settings.AMADEUS_API_KEY
        self.api_secret = api_secret or settings.AMADEUS_API_SECRET
        self.base_url = base_url or settings.AMADEUS_BASE_URL
        self.use_cache = use_cache

        self._access_token: str | None = None
        self._token_expires_at: float = 0

        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"Accept": "application/json"},
        )

    async def close(self):
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_secret)

    async def get_access_token(self) -> str:
        """Get valid access token, refreshing if needed."""
        if self._access_token and time.time() < self._token_expires_at:
            return self._access_token

        if self.use_cache:
            cached_token = await cache_get(self.TOKEN_CACHE_KEY)
            if cached_token:
                self._access_token = cached_token if isinstance(cached_token, str) else cached_token.get("token")
                self._token_expires_at = time.time() + TOKEN_CACHE_TTL
                return self._access_token

        response = await self.client.post(
            f"{self.base_url}/v1/security/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": self.api_key,
                "client_secret": self.api_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        data = response.json()

        self._access_token = data["access_token"]
        expires_in = data.get("expires_in", 1800)
        self._token_expires_at = time.time() + expires_in - 60

        if self.use_cache:
            await cache_set(self.TOKEN_CACHE_KEY, self._access_token, ex=TOKEN_CACHE_TTL)

        return self._access_token

    def _make_cache_key(self, params: dict[str, Any]) -> str:
        param_str = json.dumps(params, sort_keys=True)
        hash_digest = hashlib.sha256(param_str.encode()).hexdigest()[:16]
        return f"{self.CACHE_PREFIX}{hash_digest}"

    async def search_hotels(
        self,
        city_code: str,
        check_in: str,  # YYYY-MM-DD
        check_out: str,  # YYYY-MM-DD
        adults: int = 2,
        rooms: int = 1,
        radius: int = 20,  # km
        ratings: list[int] | None = None,  # [3, 4, 5] for 3+ stars
        price_range: str | None = None,  # "100-300"
        max_offers: int = 20,
    ) -> HotelSearchResult:
        """
        Search for hotel offers by city.

        Uses Amadeus Hotel Offers Search API (v3).
        """
        city_code = city_code.upper().strip()

        search_params = {
            "city_code": city_code,
            "check_in": check_in,
            "check_out": check_out,
            "adults": adults,
            "rooms": rooms,
            "radius": radius,
            "ratings": ratings,
            "price_range": price_range,
            "max_offers": max_offers,
        }

        logger.info(f"Searching Amadeus hotels: {city_code}, {check_in} to {check_out}")

        # Check cache
        cache_key = self._make_cache_key(search_params)
        if self.use_cache:
            cached = await cache_get(cache_key)
            if cached:
                logger.debug(f"Hotel cache hit for {cache_key}")
                try:
                    if isinstance(cached, str):
                        cached = json.loads(cached)
                    return HotelSearchResult(**cached)
                except Exception as e:
                    logger.warning(f"Failed to parse cached hotel data: {e}")

        token = await self.get_access_token()

        # Build query params for Hotel Offers Search
        params: dict[str, Any] = {
            "cityCode": city_code,
            "checkInDate": check_in,
            "checkOutDate": check_out,
            "adults": adults,
            "roomQuantity": rooms,
            "radius": radius,
            "radiusUnit": "KM",
            "currency": "USD",
            "bestRateOnly": "true",
        }

        if ratings:
            params["ratings"] = ",".join(str(r) for r in ratings)

        if price_range:
            parts = price_range.split("-")
            if len(parts) == 2:
                params["priceRange"] = f"{parts[0]}-{parts[1]}"

        try:
            response = await self.client.get(
                f"{self.base_url}/v3/shopping/hotel-offers",
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            data = response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"Amadeus Hotel API error: {e.response.status_code} - {e.response.text[:500]}")
            raise
        except Exception as e:
            logger.error(f"Amadeus hotel request failed: {e}")
            raise

        # Parse response
        offers_data = data.get("data", [])
        offers = []

        # Calculate nights
        from datetime import datetime as dt
        check_in_dt = dt.strptime(check_in, "%Y-%m-%d")
        check_out_dt = dt.strptime(check_out, "%Y-%m-%d")
        nights = (check_out_dt - check_in_dt).days

        for hotel_data in offers_data[:max_offers]:
            hotel = hotel_data.get("hotel", {})
            hotel_offers = hotel_data.get("offers", [])

            if not hotel_offers:
                continue

            # Take first/best offer
            offer = hotel_offers[0]
            price_info = offer.get("price", {})
            room_info = offer.get("room", {})
            room_type_info = room_info.get("typeEstimated", {})

            total_price = float(price_info.get("total", 0))
            price_per_night = total_price / nights if nights > 0 else total_price

            # Extract amenities from hotel
            amenities = hotel.get("amenities", []) or []
            # Clean up amenity names
            amenities = [a.replace("_", " ").title() for a in amenities[:8]]

            # Build address
            address_parts = []
            if hotel.get("address"):
                addr = hotel["address"]
                if addr.get("lines"):
                    address_parts.extend(addr["lines"])
                if addr.get("cityName"):
                    address_parts.append(addr["cityName"])

            offers.append(HotelOffer(
                id=offer.get("id", ""),
                hotel_id=hotel.get("hotelId", ""),
                hotel_name=hotel.get("name", "Unknown Hotel"),
                hotel_rating=hotel.get("rating"),
                city_code=city_code,
                latitude=hotel.get("latitude"),
                longitude=hotel.get("longitude"),
                address=", ".join(address_parts) if address_parts else None,
                distance_km=hotel.get("distance", {}).get("value"),
                room_type=room_type_info.get("category"),
                room_description=room_info.get("description", {}).get("text"),
                bed_type=room_type_info.get("bedType"),
                guests=adults,
                price=total_price,
                currency=price_info.get("currency", "USD"),
                price_per_night=round(price_per_night, 2),
                check_in=check_in,
                check_out=check_out,
                nights=nights,
                amenities=amenities,
                cancellation_policy=offer.get("policies", {}).get("cancellation", {}).get("description", {}).get("text"),
                payment_type=offer.get("policies", {}).get("paymentType"),
                source="amadeus",
            ))

        result = HotelSearchResult(
            offers=offers,
            search_params=search_params,
            is_mock=False,
        )

        # Cache result
        if self.use_cache and offers:
            try:
                await cache_set(
                    cache_key,
                    result.model_dump(mode="json"),
                    ex=self.HOTEL_CACHE_TTL,
                )
            except Exception as e:
                logger.warning(f"Failed to cache hotel result: {e}")

        logger.info(f"Amadeus returned {len(offers)} hotel offers")
        return result


async def search_hotels(
    city_code: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    **kwargs,
) -> HotelSearchResult:
    """Convenience function to search hotels."""
    async with AmadeusHotelClient() as client:
        if not client.is_configured():
            raise ValueError("Amadeus API credentials not configured")
        return await client.search_hotels(
            city_code=city_code,
            check_in=check_in,
            check_out=check_out,
            adults=adults,
            **kwargs,
        )


# -----------------------------------------------------------------------------
# Duration formatting helper
# -----------------------------------------------------------------------------


def format_duration(iso_duration: str) -> str:
    """
    Convert ISO 8601 duration to human-readable format.

    Examples:
        PT2H30M -> 2h 30m
        PT14H5M -> 14h 5m
        PT45M -> 45m
    """
    if not iso_duration:
        return ""

    # Remove PT prefix
    duration = iso_duration.replace("PT", "")

    hours = 0
    minutes = 0

    if "H" in duration:
        h_part, duration = duration.split("H")
        hours = int(h_part)

    if "M" in duration:
        m_part = duration.replace("M", "")
        if m_part:
            minutes = int(m_part)

    if hours and minutes:
        return f"{hours}h {minutes}m"
    elif hours:
        return f"{hours}h"
    else:
        return f"{minutes}m"

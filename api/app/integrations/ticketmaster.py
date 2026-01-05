"""
Ticketmaster Discovery API Client

Documentation: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Optional

import httpx
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.redis import cache_get, cache_set

logger = logging.getLogger(__name__)

# Cache TTL: 15 minutes
CACHE_TTL_SECONDS = 15 * 60

# -----------------------------------------------------------------------------
# Types
# -----------------------------------------------------------------------------


class Venue(BaseModel):
    """Normalized venue information."""
    name: str
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PriceRange(BaseModel):
    """Event price range."""
    min: float | None = None
    max: float | None = None
    currency: str = "USD"


class Event(BaseModel):
    """Normalized event from Ticketmaster."""
    id: str
    name: str
    description: str | None = None

    # Date/time
    date: str  # ISO date: YYYY-MM-DD
    time: str | None = None  # HH:MM:SS
    datetime_utc: str | None = None  # Full ISO datetime
    timezone: str | None = None

    # Location
    venue: Venue | None = None

    # Classification
    genre: str | None = None
    subgenre: str | None = None
    segment: str | None = None  # e.g., "Sports", "Music", "Arts"

    # Media
    image_url: str | None = None

    # Pricing
    price_range: PriceRange | None = None

    # Purchase
    purchase_url: str
    status: str | None = None  # "onsale", "offsale", "cancelled", etc.

    # Provider info
    provider: str = "ticketmaster"
    provider_id: str


class EventSearchResult(BaseModel):
    """Search result with pagination info."""
    events: list[Event]
    total_count: int
    page: int
    page_size: int
    total_pages: int


# -----------------------------------------------------------------------------
# Client
# -----------------------------------------------------------------------------


class TicketmasterClient:
    """Client for Ticketmaster Discovery API."""

    BASE_URL = "https://app.ticketmaster.com/discovery/v2"
    CACHE_PREFIX = "tm:events:"

    def __init__(self, api_key: str | None = None, use_cache: bool = True):
        settings = get_settings()
        self.api_key = api_key or settings.TICKETMASTER_API_KEY
        self.use_cache = use_cache

        logger.info(f"TicketmasterClient init: api_key={'SET' if self.api_key else 'MISSING'}")

        if not self.api_key:
            raise ValueError("TICKETMASTER_API_KEY is required")

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

    def _make_cache_key(self, params: dict[str, Any]) -> str:
        """Generate a deterministic cache key from search parameters."""
        # Remove API key from cache key params
        cache_params = {k: v for k, v in sorted(params.items()) if k != "apikey"}
        param_str = json.dumps(cache_params, sort_keys=True)
        hash_digest = hashlib.md5(param_str.encode()).hexdigest()[:12]
        return f"{self.CACHE_PREFIX}{hash_digest}"

    # -------------------------------------------------------------------------
    # Public Methods
    # -------------------------------------------------------------------------

    async def search_events(
        self,
        keyword: str | None = None,
        city: str | None = None,
        state_code: str | None = None,
        country_code: str = "US",
        start_date: str | None = None,  # YYYY-MM-DD
        end_date: str | None = None,  # YYYY-MM-DD
        genre: str | None = None,
        segment: str | None = None,  # Music, Sports, Arts & Theatre, Film, Miscellaneous
        size: int = 20,
        page: int = 0,
        sort: str = "date,asc",
        lat: float | None = None,
        lon: float | None = None,
        radius: int | None = None,  # miles
    ) -> EventSearchResult:
        """
        Search for events.

        Args:
            keyword: Search term (artist, team, event name)
            city: City name
            state_code: State code (e.g., "CA", "NY")
            country_code: Country code (default "US")
            start_date: Start date filter (YYYY-MM-DD)
            end_date: End date filter (YYYY-MM-DD)
            genre: Genre filter (e.g., "Rock", "Pop", "Hip-Hop")
            segment: Segment filter (e.g., "Music", "Sports")
            size: Results per page (max 200)
            page: Page number (0-indexed)
            sort: Sort order ("date,asc", "date,desc", "relevance,desc")
            lat: Latitude for geo search
            lon: Longitude for geo search
            radius: Search radius in miles (requires lat/lon)

        Returns:
            EventSearchResult with normalized events
        """
        params: dict[str, Any] = {
            "apikey": self.api_key,
            "size": min(size, 200),
            "page": page,
            "sort": sort,
            "countryCode": country_code,
        }

        if keyword:
            params["keyword"] = keyword
        if city:
            params["city"] = city
        if state_code:
            params["stateCode"] = state_code
        if start_date:
            # Ticketmaster expects ISO format with time
            params["startDateTime"] = f"{start_date}T00:00:00Z"
        if end_date:
            params["endDateTime"] = f"{end_date}T23:59:59Z"
        if genre:
            params["classificationName"] = genre
        if segment:
            params["segmentName"] = segment
        if lat is not None and lon is not None:
            params["latlong"] = f"{lat},{lon}"
            if radius:
                params["radius"] = radius
                params["unit"] = "miles"

        logger.debug(f"Searching Ticketmaster: {params}")

        # Check cache first
        cache_key = self._make_cache_key(params)
        if self.use_cache:
            cached = await cache_get(cache_key)
            if cached:
                logger.debug(f"Cache hit for {cache_key}")
                try:
                    # cached is already parsed by upstash-redis
                    if isinstance(cached, str):
                        cached = json.loads(cached)
                    return EventSearchResult(**cached)
                except Exception as e:
                    logger.warning(f"Failed to parse cached data: {e}")

        # Cache miss - call API
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/events.json",
                params=params,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Ticketmaster API error: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Ticketmaster request failed: {e}")
            raise

        # Parse response
        embedded = data.get("_embedded", {})
        events_data = embedded.get("events", [])
        page_info = data.get("page", {})

        events = [self._parse_event(e) for e in events_data]

        result = EventSearchResult(
            events=events,
            total_count=page_info.get("totalElements", len(events)),
            page=page_info.get("number", 0),
            page_size=page_info.get("size", size),
            total_pages=page_info.get("totalPages", 1),
        )

        # Store in cache
        if self.use_cache:
            try:
                await cache_set(
                    cache_key,
                    result.model_dump(mode="json"),
                    ex=CACHE_TTL_SECONDS,
                )
                logger.debug(f"Cached {cache_key} for {CACHE_TTL_SECONDS}s")
            except Exception as e:
                logger.warning(f"Failed to cache result: {e}")

        return result

    async def get_event(self, event_id: str) -> Event:
        """Get a single event by ID."""
        params = {"apikey": self.api_key}

        response = await self.client.get(
            f"{self.BASE_URL}/events/{event_id}.json",
            params=params,
        )
        response.raise_for_status()
        data = response.json()

        return self._parse_event(data)

    # -------------------------------------------------------------------------
    # Parsing
    # -------------------------------------------------------------------------

    def _parse_event(self, data: dict[str, Any]) -> Event:
        """Parse Ticketmaster event into normalized Event."""

        # Basic info
        event_id = data.get("id", "")
        name = data.get("name", "Unknown Event")
        description = data.get("description") or data.get("info")

        # Date/time
        dates = data.get("dates", {})
        start = dates.get("start", {})

        date = start.get("localDate", "")
        time = start.get("localTime")
        datetime_utc = start.get("dateTime")
        timezone = dates.get("timezone")

        # Venue
        venue = None
        venues = data.get("_embedded", {}).get("venues", [])
        if venues:
            venue = self._parse_venue(venues[0])

        # Classification (genre, segment)
        genre = None
        subgenre = None
        segment = None
        classifications = data.get("classifications", [])
        if classifications:
            c = classifications[0]
            genre_obj = c.get("genre", {})
            genre = genre_obj.get("name") if genre_obj.get("name") != "Undefined" else None

            subgenre_obj = c.get("subGenre", {})
            subgenre = subgenre_obj.get("name") if subgenre_obj.get("name") != "Undefined" else None

            segment_obj = c.get("segment", {})
            segment = segment_obj.get("name") if segment_obj.get("name") != "Undefined" else None

        # Image - get the highest quality image
        image_url = None
        images = data.get("images", [])
        if images:
            # Prefer 16:9 ratio, largest width
            sorted_images = sorted(
                images,
                key=lambda x: (x.get("ratio") == "16_9", x.get("width", 0)),
                reverse=True,
            )
            image_url = sorted_images[0].get("url")

        # Price range
        price_range = None
        price_ranges = data.get("priceRanges", [])
        if price_ranges:
            pr = price_ranges[0]
            price_range = PriceRange(
                min=pr.get("min"),
                max=pr.get("max"),
                currency=pr.get("currency", "USD"),
            )

        # Purchase URL
        purchase_url = data.get("url", "")

        # Status
        status = dates.get("status", {}).get("code")

        return Event(
            id=f"tm_{event_id}",
            name=name,
            description=description,
            date=date,
            time=time,
            datetime_utc=datetime_utc,
            timezone=timezone,
            venue=venue,
            genre=genre,
            subgenre=subgenre,
            segment=segment,
            image_url=image_url,
            price_range=price_range,
            purchase_url=purchase_url,
            status=status,
            provider="ticketmaster",
            provider_id=event_id,
        )

    def _parse_venue(self, data: dict[str, Any]) -> Venue:
        """Parse venue data into normalized Venue."""
        address_obj = data.get("address", {})
        city_obj = data.get("city", {})
        state_obj = data.get("state", {})
        country_obj = data.get("country", {})
        location = data.get("location", {})

        return Venue(
            name=data.get("name", "Unknown Venue"),
            address=address_obj.get("line1"),
            city=city_obj.get("name"),
            state=state_obj.get("stateCode") or state_obj.get("name"),
            country=country_obj.get("countryCode") or country_obj.get("name"),
            postal_code=data.get("postalCode"),
            latitude=float(location["latitude"]) if location.get("latitude") else None,
            longitude=float(location["longitude"]) if location.get("longitude") else None,
        )


# -----------------------------------------------------------------------------
# Convenience function
# -----------------------------------------------------------------------------


async def search_events(
    keyword: str | None = None,
    city: str | None = None,
    state_code: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    **kwargs,
) -> EventSearchResult:
    """
    Convenience function to search events.

    Usage:
        results = await search_events(
            keyword="Taylor Swift",
            city="Los Angeles",
            start_date="2025-02-01",
            end_date="2025-02-28",
        )
    """
    async with TicketmasterClient() as client:
        return await client.search_events(
            keyword=keyword,
            city=city,
            state_code=state_code,
            start_date=start_date,
            end_date=end_date,
            **kwargs,
        )

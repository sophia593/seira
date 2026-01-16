"""
Tool Handlers

Implementation of tool functions called by Claude.
"""

from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timedelta
from typing import Any

from app.ai.tools.registry import register_tool
from app.ai.clients.gemini import GeminiResearcher, SearchType
from app.ai.metrics import gemini_rescue_metrics, research_web_metrics
from app.integrations.ticketmaster import TicketmasterClient, Event
from app.integrations.amadeus import AmadeusClient
from app.core.config import get_settings
from app.services import trip as trip_service
from app.services import user as user_service

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Airport code normalization (Amadeus needs 3-letter IATA codes)
# -----------------------------------------------------------------------------

AIRPORT_CODES = {
    "nyc": "JFK",
    "new york": "JFK",
    "la": "LAX",
    "los angeles": "LAX",
    "sf": "SFO",
    "san francisco": "SFO",
    "chicago": "ORD",
    "boston": "BOS",
    "miami": "MIA",
    "seattle": "SEA",
    "denver": "DEN",
    "atlanta": "ATL",
    "dallas": "DFW",
    "houston": "IAH",
    "phoenix": "PHX",
    "las vegas": "LAS",
    "vegas": "LAS",
    "orlando": "MCO",
    "dc": "DCA",
    "washington": "DCA",
    "philly": "PHL",
    "philadelphia": "PHL",
    "san diego": "SAN",
    "portland": "PDX",
    "minneapolis": "MSP",
    "detroit": "DTW",
    "tampa": "TPA",
    "austin": "AUS",
    "nashville": "BNA",
    "new orleans": "MSY",
    "nola": "MSY",
}


def normalize_airport(code: str) -> str:
    """Normalize airport code or city name to IATA code."""
    if not code:
        return code
    code_lower = code.lower().strip()
    # Check if it's a city name alias
    if code_lower in AIRPORT_CODES:
        return AIRPORT_CODES[code_lower]
    # Already a code, uppercase it
    return code.upper().strip()


# -----------------------------------------------------------------------------
# City name normalization (Ticketmaster needs full city names)
# -----------------------------------------------------------------------------

CITY_ALIASES = {
    "nyc": "New York",
    "ny": "New York",
    "la": "Los Angeles",
    "sf": "San Francisco",
    "dc": "Washington",
    "chi": "Chicago",
    "philly": "Philadelphia",
    "vegas": "Las Vegas",
    "nola": "New Orleans",
    "atl": "Atlanta",
    "bos": "Boston",
    "sea": "Seattle",
    "pdx": "Portland",
    "den": "Denver",
    "phx": "Phoenix",
    "mia": "Miami",
    "dfw": "Dallas",
    "hou": "Houston",
}


# -----------------------------------------------------------------------------
# Category to Segment mapping
# -----------------------------------------------------------------------------

CATEGORY_TO_SEGMENT = {
    "sports": "Sports",
    "music": "Music",
    "theater": "Arts & Theatre",
    "comedy": None,  # Don't filter by segment - use keyword search instead
    "family": "Miscellaneous",  # Family events are under Miscellaneous or Film
    "arts": "Arts & Theatre",
    "concert": "Music",
    "basketball": "Sports",
    "football": "Sports",
    "baseball": "Sports",
    "hockey": "Sports",
}

# Keywords to add for certain categories
CATEGORY_KEYWORDS = {
    "comedy": "comedy",
    "standup": "comedy",
    "family": "family",
}

# Genre to classification name mapping for music
GENRE_MAP = {
    "rock": "Rock",
    "hip-hop": "Hip-Hop/Rap",
    "hip hop": "Hip-Hop/Rap",
    "rap": "Hip-Hop/Rap",
    "country": "Country",
    "pop": "Pop",
    "edm": "Electronic",
    "electronic": "Electronic",
    "jazz": "Jazz",
    "classical": "Classical",
    "r&b": "R&B",
    "rnb": "R&B",
    "latin": "Latin",
    "metal": "Metal",
    "alternative": "Alternative",
    "indie": "Alternative",
}


def normalize_city(city: str | None) -> str | None:
    """Normalize city abbreviations to full names for Ticketmaster API."""
    if not city:
        return None
    # Check aliases first (case-insensitive)
    normalized = CITY_ALIASES.get(city.lower().strip())
    if normalized:
        return normalized
    # Return as-is if not an alias
    return city.strip()


# -----------------------------------------------------------------------------
# search_events
# -----------------------------------------------------------------------------


@register_tool("search_events")
async def search_events(
    input: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Search for live events using Ticketmaster API.
    Falls back to Gemini web search if no results found.
    """
    tool_start = time.time()
    query = input.get("query", "")
    city_raw = input.get("city")
    city = normalize_city(city_raw)  # Normalize "NYC" -> "New York" etc.
    state_code = input.get("state_code")  # Two-letter state code (OR, ME, etc.)
    date_from = input.get("date_from")
    date_to = input.get("date_to")
    category = input.get("category")
    genre = input.get("genre")  # Music genre filter

    # Normalize state_code
    if state_code:
        state_code = state_code.strip().upper()
        if len(state_code) != 2:
            state_code = None  # Invalid, ignore

    logger.info(
        f"[TIMING] search_events STARTED: query={query!r}, city={city!r}, state={state_code!r}, "
        f"dates={date_from} to {date_to}, category={category!r}, genre={genre!r}"
    )

    # Map category to Ticketmaster segment
    segment = CATEGORY_TO_SEGMENT.get(category) if category else None

    # Map genre to Ticketmaster classification name
    genre_name = GENRE_MAP.get(genre.lower()) if genre else None

    # For certain categories, enhance keyword search
    search_query = query
    if category and category.lower() in CATEGORY_KEYWORDS:
        category_keyword = CATEGORY_KEYWORDS[category.lower()]
        if search_query:
            search_query = f"{search_query} {category_keyword}"
        else:
            search_query = category_keyword

    # Try Ticketmaster first
    ticketmaster_failed = False
    ticketmaster_error = None
    result = None

    try:
        t0 = time.time()
        async with TicketmasterClient() as client:
            result = await client.search_events(
                keyword=search_query if search_query else None,
                city=city,
                state_code=state_code,
                start_date=date_from,
                end_date=date_to,
                segment=segment,
                genre=genre_name,
                size=100,  # Fetch more to get variety after deduping
            )
            logger.info(f"[TIMING] Ticketmaster API: {(time.time() - t0) * 1000:.1f}ms, returned {result.total_count} events")

    except Exception as e:
        logger.exception(f"[TIMING] Ticketmaster FAILED after {(time.time() - t0) * 1000:.1f}ms: {e}")
        ticketmaster_failed = True
        ticketmaster_error = str(e)

    # If Ticketmaster returned results, process and return them
    if result and result.total_count > 0:
        # Determine if this is a specific event search vs browsing
        is_specific_search = False
        if search_query:
            query_lower = search_query.lower().strip()
            for e in result.events[:10]:
                name_lower = e.name.lower()
                if query_lower in name_lower or name_lower.startswith(query_lower):
                    is_specific_search = True
                    break

        if is_specific_search:
            unique_events = result.events[:20]
            logger.info(f"Specific search detected, showing {len(unique_events)} dates")
        else:
            seen_names: set[str] = set()
            unique_events: list[Event] = []
            for e in result.events:
                normalized = re.sub(r'\s*\([^)]*\)\s*$', '', e.name.lower().strip())
                if normalized not in seen_names:
                    seen_names.add(normalized)
                    unique_events.append(e)
            logger.info(f"Browse search, deduped to {len(unique_events)} unique events")

        events = [_format_event(e) for e in unique_events]

        # =====================================================================
        # VERIFIED TICKETMASTER RESULTS
        # These are real, bookable events from Ticketmaster's database
        # =====================================================================
        logger.info(f"[TIMING] search_events COMPLETED (VERIFIED_EVENTS): {(time.time() - tool_start) * 1000:.1f}ms total, {len(unique_events)} events")
        return {
            "success": True,
            "result_type": "VERIFIED_EVENTS",
            "data_source": {
                "provider": "Ticketmaster",
                "reliability": "high",
                "description": "Official event listings with real-time availability and direct booking links",
            },
            "query": query,
            "filters": {
                "city": city,
                "state_code": state_code,
                "date_from": date_from,
                "date_to": date_to,
                "category": category,
                "genre": genre,
            },
            "summary": {
                "total_found": result.total_count,
                "showing": len(unique_events),
                "message": f"Found {result.total_count} verified events on Ticketmaster",
            },
            "events": events,
            "instructions_for_assistant": (
                "These are VERIFIED events from Ticketmaster. You can confidently present these to the user "
                "with dates, venues, and prices. The ticket_url links go directly to purchase pages. "
                "Help the user choose an event and proceed to flight search."
            ),
        }

    # =========================================================================
    # RESCUE: Ticketmaster returned 0 results or failed - try Gemini
    # =========================================================================
    trigger_reason = "api_failed" if ticketmaster_failed else "no_results"
    logger.info(
        f"[TIMING] GEMINI_RESCUE_TRIGGERED: reason={trigger_reason}, query={query!r}, "
        f"city={city!r}, after {(time.time() - tool_start) * 1000:.1f}ms"
    )

    try:
        t0 = time.time()
        researcher = GeminiResearcher()

        # Get current date for context
        from datetime import date
        today = date.today()
        today_str = today.strftime("%B %d, %Y")  # e.g., "January 06, 2026"
        year = today.year

        # Build a search query for Gemini
        gemini_query_parts = [query]
        if city:
            gemini_query_parts.append(city)
        if category:
            gemini_query_parts.append(category)
        if date_from:
            gemini_query_parts.append(date_from)
        else:
            gemini_query_parts.append(str(year))  # Add current year if no date specified

        gemini_query = f"{' '.join(gemini_query_parts)} tickets events schedule"

        gemini_result = await researcher.search_with_retry(
            query=gemini_query,
            context=(
                f"Today's date is {today_str}. "
                f"Find upcoming events, shows, concerts, or games for: {query}. "
                f"Include specific dates, venues, cities, and ticket price ranges if available. "
                f"Focus on events the user can actually attend and buy tickets for. "
                f"If the user asks about 'tonight' or 'this weekend', use today's date as reference."
            ),
            search_type=SearchType.EVENT_DETAILS,
            max_retries=2,
        )
        logger.info(f"[TIMING] Gemini search: {(time.time() - t0) * 1000:.1f}ms")

        answer_length = len(gemini_result.answer)
        source_count = len(gemini_result.sources)
        official_count = len(gemini_result.official_sources)

        # Detect graceful failures (Gemini returned error message instead of crashing)
        is_graceful_failure = source_count == 0 and answer_length < 200

        # Record metrics
        gemini_rescue_metrics.record_rescue(
            query=query,
            trigger_reason=trigger_reason,
            success=not is_graceful_failure,
            answer_length=answer_length,
            source_count=source_count,
            official_source_count=official_count,
            error="graceful_failure" if is_graceful_failure else None,
        )

        # Format sources with quality indicators
        sources = [
            {
                "title": s.title or "Source",
                "url": s.url,
                "domain": s.domain,
                "snippet": s.snippet,
                "is_official": s.is_official,
            }
            for s in gemini_result.sources
        ]

        # =====================================================================
        # WEB RESEARCH RESULTS (UNVERIFIED)
        # These are from web search and should be verified by the user
        # =====================================================================
        logger.info(f"[TIMING] search_events COMPLETED (WEB_RESEARCH): {(time.time() - tool_start) * 1000:.1f}ms total")
        return {
            "success": True,
            "result_type": "WEB_RESEARCH",
            "data_source": {
                "provider": "Google Search (via Gemini)",
                "reliability": "medium",
                "description": "Web search results - information may be outdated or incomplete",
            },
            "query": query,
            "filters": {
                "city": city,
                "state_code": state_code,
                "date_from": date_from,
                "date_to": date_to,
                "category": category,
                "genre": genre,
            },
            "summary": {
                "total_found": 0,
                "ticketmaster_searched": True,
                "message": "No events found on Ticketmaster. Found information from web search instead.",
            },
            "events": [],  # No structured events from web search
            "web_research": {
                "content": gemini_result.answer,
                "sources": sources,
                "source_count": len(sources),
            },
            "instructions_for_assistant": (
                "IMPORTANT: These are WEB RESEARCH results, NOT verified event listings. "
                "Present this information to the user but clearly state:\n"
                "1. This info comes from web search, not official ticketing\n"
                "2. Dates, prices, and availability should be verified on official sites\n"
                "3. Provide the source links so the user can verify\n"
                "4. Offer to help them search for tickets once they confirm the event details\n\n"
                "DO NOT present web research as if it were verified Ticketmaster events. "
                "Be helpful but honest about the data source limitations."
            ),
        }

    except Exception as e:
        logger.exception(f"[TIMING] Gemini FAILED after {(time.time() - t0) * 1000:.1f}ms: {e}")

        # Record failed rescue
        gemini_rescue_metrics.record_rescue(
            query=query,
            trigger_reason=trigger_reason,
            success=False,
            answer_length=0,
            source_count=0,
            official_source_count=0,
            error=str(e),
        )

        # =====================================================================
        # BOTH SOURCES FAILED
        # =====================================================================
        return {
            "success": False,
            "result_type": "ERROR",
            "error": {
                "message": ticketmaster_error or str(e),
                "ticketmaster_tried": True,
                "web_search_tried": True,
            },
            "query": query,
            "filters": {
                "city": city,
                "state_code": state_code,
                "date_from": date_from,
                "date_to": date_to,
                "category": category,
                "genre": genre,
            },
            "summary": {
                "total_found": 0,
                "message": "Could not find events from any source",
            },
            "events": [],
            "instructions_for_assistant": (
                "Both Ticketmaster and web search failed. Apologize to the user and suggest:\n"
                "1. Try a different search term or spelling\n"
                "2. Check if the event/artist name is correct\n"
                "3. Try broadening the search (remove city or date filters)\n"
                "4. Search directly on the venue or artist's official website"
            ),
        }


def _format_event(event: Event) -> dict[str, Any]:
    """Format Event model to tool response dict."""
    venue_name = event.venue.name if event.venue else None
    venue_city = event.venue.city if event.venue else None
    venue_state = event.venue.state if event.venue else None

    # Build location string
    location = venue_city
    if venue_state:
        location = f"{venue_city}, {venue_state}" if venue_city else venue_state

    # Format time for display
    time_display = None
    if event.time:
        try:
            t = datetime.strptime(event.time, "%H:%M:%S")
            time_display = t.strftime("%-I:%M %p")
        except ValueError:
            time_display = event.time

    return {
        "id": event.id,
        "name": event.name,
        "date": event.date,
        "time": time_display,
        "venue": venue_name,
        "city": location,
        "category": event.segment.lower() if event.segment else "entertainment",
        "subcategory": event.genre,
        "price_min": event.price_range.min if event.price_range else None,
        "price_max": event.price_range.max if event.price_range else None,
        "ticket_url": event.purchase_url,
        "image_url": event.image_url,
        "status": event.status,
    }


# -----------------------------------------------------------------------------
# search_flights
# -----------------------------------------------------------------------------


@register_tool("search_flights")
async def search_flights(
    input: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Search for flights using Amadeus API.
    Falls back to mock data if API key not configured.
    """
    origin = normalize_airport(input.get("origin", ""))
    destination = normalize_airport(input.get("destination", ""))
    departure_date = input.get("departure_date", "")
    return_date = input.get("return_date")
    cabin_class = input.get("cabin_class", "economy")
    passengers = input.get("passengers", 1)

    # Fetch user preferences to fill in defaults
    if user_id:
        try:
            prefs = await user_service.get_preferences_row(user_id)
            if prefs:
                # Use home_airport as default origin if not provided
                if not origin and prefs.get("home_airport"):
                    origin = prefs["home_airport"]
                    logger.info(f"Using user's home airport as origin: {origin}")
                # Use preferred cabin class if not explicitly specified
                if cabin_class == "economy" and prefs.get("cabin_class"):
                    cabin_class = prefs["cabin_class"]
                    logger.info(f"Using user's preferred cabin class: {cabin_class}")
        except Exception as e:
            logger.warning(f"Failed to fetch user preferences: {e}")

    logger.info(
        f"search_flights: {origin} -> {destination}, "
        f"depart={departure_date}, return={return_date}, "
        f"cabin={cabin_class}, pax={passengers}"
    )

    settings = get_settings()
    use_real_api = settings.AMADEUS_API_KEY and settings.AMADEUS_API_SECRET

    if use_real_api:
        # Try real Amadeus API
        try:
            t0 = time.time()
            async with AmadeusClient() as client:
                # Map cabin class to Amadeus format
                amadeus_cabin = cabin_class.upper().replace("_", " ")
                if amadeus_cabin == "PREMIUM ECONOMY":
                    amadeus_cabin = "PREMIUM_ECONOMY"

                result = await client.search_flights(
                    origin=origin.upper(),
                    destination=destination.upper(),
                    departure_date=departure_date,
                    return_date=return_date,
                    adults=passengers,
                    cabin_class=amadeus_cabin,
                    max_offers=10,
                )

            logger.info(f"[TIMING] Amadeus API: {(time.time() - t0) * 1000:.1f}ms, returned {len(result.offers)} offers")

            if result.offers:
                # Format real flight offers
                from app.integrations.amadeus import format_duration

                flights = []
                for offer in result.offers:
                    # Get outbound segments
                    outbound = offer.outbound_segments[0] if offer.outbound_segments else None
                    if not outbound:
                        continue

                    # Format departure time for display
                    dep_time = outbound.departure_time
                    arr_time = offer.outbound_segments[-1].arrival_time
                    try:
                        dep_dt = datetime.fromisoformat(dep_time.replace("Z", "+00:00"))
                        arr_dt = datetime.fromisoformat(arr_time.replace("Z", "+00:00"))
                        dep_time = dep_dt.strftime("%-I:%M %p")
                        arr_time = arr_dt.strftime("%-I:%M %p")
                    except Exception:
                        pass  # Keep original format

                    flights.append({
                        "id": offer.id,
                        "airline": outbound.carrier_name or outbound.carrier_code,
                        "airline_code": outbound.carrier_code,
                        "flight_number": outbound.flight_number,
                        "origin": outbound.departure_airport,
                        "destination": offer.outbound_segments[-1].arrival_airport,
                        "departure_date": departure_date,
                        "departure_time": dep_time,
                        "arrival_time": arr_time,
                        "duration": format_duration(offer.outbound_duration),
                        "stops": offer.outbound_stops,
                        "cabin_class": cabin_class,
                        "price": offer.price,
                        "currency": offer.currency,
                        "booking_url": f"https://www.google.com/flights?q={origin}+to+{destination}+{departure_date}",
                        "seats_available": offer.seats_available,
                        "is_mock": False,
                    })

                # Handle return flights if round trip
                return_flight_list = None
                if return_date and result.offers:
                    return_flight_list = []
                    for offer in result.offers:
                        if offer.return_segments:
                            ret = offer.return_segments[0]
                            # Format times
                            ret_dep_time = ret.departure_time
                            ret_arr_time = offer.return_segments[-1].arrival_time
                            try:
                                ret_dep_dt = datetime.fromisoformat(ret_dep_time.replace("Z", "+00:00"))
                                ret_arr_dt = datetime.fromisoformat(ret_arr_time.replace("Z", "+00:00"))
                                ret_dep_time = ret_dep_dt.strftime("%-I:%M %p")
                                ret_arr_time = ret_arr_dt.strftime("%-I:%M %p")
                            except Exception:
                                pass

                            return_flight_list.append({
                                "id": f"{offer.id}_return",
                                "airline": ret.carrier_name or ret.carrier_code,
                                "airline_code": ret.carrier_code,
                                "flight_number": ret.flight_number,
                                "origin": ret.departure_airport,
                                "destination": offer.return_segments[-1].arrival_airport,
                                "departure_date": return_date,
                                "departure_time": ret_dep_time,
                                "arrival_time": ret_arr_time,
                                "duration": format_duration(offer.return_duration) if offer.return_duration else "N/A",
                                "stops": offer.return_stops or 0,
                                "cabin_class": cabin_class,
                                "price": 0,  # Price included in total
                                "currency": offer.currency,
                                "booking_url": f"https://www.google.com/flights?q={destination}+to+{origin}+{return_date}",
                                "seats_available": None,
                                "is_mock": False,
                            })

                return {
                    "success": True,
                    "data_source": "amadeus",
                    "search": {
                        "origin": origin,
                        "destination": destination,
                        "departure_date": departure_date,
                        "return_date": return_date,
                        "cabin_class": cabin_class,
                        "passengers": passengers,
                    },
                    "outbound_flights": flights,
                    "return_flights": return_flight_list,
                    "instructions_for_assistant": (
                        "These are REAL flight prices from Amadeus. Prices are accurate as of now but may change. "
                        "The booking URLs go to Google Flights for easy comparison and booking."
                    ),
                }

        except Exception as e:
            logger.exception(f"Amadeus API failed, falling back to mock: {e}")
            # Fall through to mock data

    # Mock response (fallback or when API key not set)
    logger.info("Using mock flight data" + (" (Amadeus not configured)" if not use_real_api else " (Amadeus failed)"))

    outbound_flights = _generate_mock_flights(
        origin, destination, departure_date, cabin_class
    )

    return_flights = None
    if return_date:
        return_flights = _generate_mock_flights(
            destination, origin, return_date, cabin_class
        )

    return {
        "success": True,
        "data_source": "mock",
        "search": {
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "cabin_class": cabin_class,
            "passengers": passengers,
        },
        "outbound_flights": outbound_flights,
        "return_flights": return_flights,
        "instructions_for_assistant": (
            "IMPORTANT: These are MOCK/EXAMPLE flights, NOT real prices. "
            "Tell the user these are example flights to illustrate options. "
            "Recommend they check Google Flights or airline websites for actual prices."
        ),
    }


def _generate_mock_flights(
    origin: str,
    destination: str,
    date: str,
    cabin_class: str,
) -> list[dict[str, Any]]:
    """Generate mock flight data."""

    # Airport code mapping (simplified)
    airport_codes = {
        "los angeles": "LAX",
        "la": "LAX",
        "new york": "JFK",
        "nyc": "JFK",
        "chicago": "ORD",
        "san francisco": "SFO",
        "sf": "SFO",
        "boston": "BOS",
        "miami": "MIA",
        "seattle": "SEA",
        "denver": "DEN",
        "atlanta": "ATL",
    }

    origin_code = airport_codes.get(origin.lower(), origin.upper()[:3])
    dest_code = airport_codes.get(destination.lower(), destination.upper()[:3])

    # Base prices by cabin
    cabin_multipliers = {
        "economy": 1.0,
        "premium_economy": 1.6,
        "business": 3.5,
        "first": 6.0,
    }
    multiplier = cabin_multipliers.get(cabin_class, 1.0)

    airlines = [
        ("United", "UA"),
        ("American", "AA"),
        ("Delta", "DL"),
        ("Southwest", "WN"),
    ]

    flights = []
    base_times = [
        ("6:00 AM", "8:15 AM", "4h 15m"),
        ("8:30 AM", "10:45 AM", "4h 15m"),
        ("11:00 AM", "1:15 PM", "4h 15m"),
        ("2:30 PM", "4:45 PM", "4h 15m"),
        ("5:00 PM", "7:15 PM", "4h 15m"),
    ]

    for i, (airline_name, airline_code) in enumerate(airlines):
        if i >= len(base_times):
            break

        dep_time, arr_time, duration = base_times[i]
        base_price = 180 + (i * 35)
        price = int(base_price * multiplier)

        flights.append({
            "id": f"flt_{airline_code}_{i}",
            "airline": airline_name,
            "airline_code": airline_code,
            "flight_number": f"{airline_code}{1000 + i * 123}",
            "origin": origin_code,
            "destination": dest_code,
            "departure_date": date,
            "departure_time": dep_time,
            "arrival_time": arr_time,
            "duration": duration,
            "stops": 0,
            "cabin_class": cabin_class,
            "price": price,
            "currency": "USD",
            "booking_url": f"https://www.{airline_name.lower()}.com/book",
            "seats_available": 5 + i,
            "is_mock": True,
        })

    return flights


# -----------------------------------------------------------------------------
# save_trip
# -----------------------------------------------------------------------------


@register_tool("save_trip")
async def save_trip(
    input: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Save a trip to the user's account in Supabase.
    Requires email verification.
    """
    if not user_id:
        return {
            "success": False,
            "error": "sign in to save this trip to your account",
        }

    # Note: Email verification is enforced on the frontend.
    # The frontend checks isEmailVerified before allowing the save action.

    title = input.get("title", "Untitled Trip")
    event = input.get("event", {})
    outbound_flight = input.get("outbound_flight", {})
    return_flight = input.get("return_flight", {})
    estimated_total = input.get("estimated_total")
    notes = input.get("notes")

    logger.info(f"save_trip: title={title}, user_id={user_id}")

    try:
        # Build trip data from input
        trip_kwargs = {
            "notes": notes,
            "status": "draft",
        }

        # Extract event details
        if event:
            trip_kwargs["event_name"] = event.get("name")
            trip_kwargs["event_date"] = event.get("date")
            trip_kwargs["event_time"] = event.get("time")
            trip_kwargs["event_venue"] = event.get("venue")
            trip_kwargs["event_purchase_url"] = event.get("ticket_url") or event.get("url")
            trip_kwargs["event_price_estimate"] = event.get("price_min")
            trip_kwargs["event_provider"] = "ticketmaster"
            trip_kwargs["event_provider_id"] = event.get("id")
            # Extract city from event
            city = event.get("city", "")
            if city:
                trip_kwargs["destination_city"] = city

        # Extract outbound flight details
        if outbound_flight:
            trip_kwargs["flight_origin"] = outbound_flight.get("origin")
            trip_kwargs["flight_destination"] = outbound_flight.get("destination")
            trip_kwargs["flight_outbound_date"] = outbound_flight.get("departure_date")
            trip_kwargs["flight_outbound_time"] = outbound_flight.get("departure_time")
            trip_kwargs["flight_carrier"] = outbound_flight.get("airline")
            trip_kwargs["flight_price"] = outbound_flight.get("price")
            trip_kwargs["flight_purchase_url"] = outbound_flight.get("booking_url")

        # Extract return flight details (append to notes for now since schema has single flight)
        if return_flight:
            return_info = (
                f"Return flight: {return_flight.get('airline')} "
                f"{return_flight.get('departure_date')} {return_flight.get('departure_time')} "
                f"${return_flight.get('price', 'N/A')}"
            )
            if trip_kwargs.get("notes"):
                trip_kwargs["notes"] += f"\n\n{return_info}"
            else:
                trip_kwargs["notes"] = return_info
            # Add return flight price to total
            if return_flight.get("price") and trip_kwargs.get("flight_price"):
                trip_kwargs["flight_price"] += return_flight.get("price", 0)

        # Set estimated total
        if estimated_total:
            trip_kwargs["estimated_total"] = estimated_total

        # Create trip in database
        trip = await trip_service.create_trip(
            user_id=user_id,
            title=title,
            **trip_kwargs,
        )

        logger.info(f"Trip saved successfully: id={trip.get('id')}")

        return {
            "success": True,
            "message": f"Trip '{title}' saved successfully! You can view it in My Trips.",
            "trip": {
                "id": trip.get("id"),
                "title": trip.get("title"),
                "status": trip.get("status"),
                "destination_city": trip.get("destination_city"),
                "event_name": trip.get("event_name"),
                "event_date": trip.get("event_date"),
                "estimated_total": trip.get("estimated_total"),
            },
        }

    except Exception as e:
        logger.exception(f"Failed to save trip: {e}")
        return {
            "success": False,
            "error": "couldn't save your trip right now — please try again",
        }


# -----------------------------------------------------------------------------
# research_web
# -----------------------------------------------------------------------------


@register_tool("research_web")
async def research_web(
    input: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Search the web for current information using Gemini with Search Grounding.

    Use cases:
    - Get current ticket prices
    - Find venue details and tips
    - Restaurant recommendations
    - Hotel/accommodation options
    - Nightlife and bars
    - Travel tips
    - Event updates and news
    """
    query = input.get("query", "")
    context = input.get("context")
    search_type_str = input.get("search_type")

    if not query:
        return {
            "success": False,
            "error": "Query is required",
        }

    # Parse search_type if provided
    search_type = None
    if search_type_str:
        try:
            search_type = SearchType(search_type_str)
        except ValueError:
            logger.warning(f"Invalid search_type: {search_type_str}, will auto-detect")

    logger.info(f"research_web: query={query!r}, context={context!r}, search_type={search_type_str!r}")

    try:
        researcher = GeminiResearcher()
        result = await researcher.search_with_retry(query, context=context, search_type=search_type, max_retries=2)

        source_count = len(result.sources)
        official_count = len(result.official_sources)

        # Detect graceful failures (Gemini returned error message instead of crashing)
        is_graceful_failure = source_count == 0 and len(result.answer) < 200

        # Record metrics
        research_web_metrics.record_call(
            query=query,
            search_type=result.search_type.value,
            success=not is_graceful_failure,
            source_count=source_count,
            official_source_count=official_count,
            error="graceful_failure" if is_graceful_failure else None,
        )

        # Format sources for response with quality indicators
        sources = [
            {
                "title": s.title,
                "url": s.url,
                "domain": s.domain,
                "snippet": s.snippet,
                "is_official": s.is_official,
            }
            for s in result.sources
        ]

        return {
            "success": True,
            "query": query,
            "enhanced_query": result.enhanced_query,
            "search_type": result.search_type.value,
            "answer": result.answer,
            "sources": sources,
            "source_count": source_count,
            "official_source_count": official_count,
            "has_official_sources": result.has_official_sources,
        }

    except Exception as e:
        logger.exception(f"Web research failed: {e}")

        # Record failed call
        research_web_metrics.record_call(
            query=query,
            search_type="unknown",
            success=False,
            source_count=0,
            official_source_count=0,
            error=str(e),
        )

        return {
            "success": False,
            "error": "couldn't complete the search — try a different query",
            "query": query,
        }

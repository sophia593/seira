"""
Tool Handlers

Implementation of tool functions called by Claude.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta
from typing import Any

from app.ai.tools.registry import register_tool
from app.ai.clients.gemini import GeminiResearcher
from app.integrations.ticketmaster import TicketmasterClient, Event
from app.services import trip as trip_service
from app.services import user as user_service

logger = logging.getLogger(__name__)


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
    query = input.get("query", "")
    city_raw = input.get("city")
    city = normalize_city(city_raw)  # Normalize "NYC" -> "New York" etc.
    date_from = input.get("date_from")
    date_to = input.get("date_to")
    category = input.get("category")

    logger.info(
        f"search_events CALLED: query={query!r}, city_raw={city_raw!r}, city={city!r}, "
        f"dates={date_from} to {date_to}, category={category!r}"
    )
    logger.info(f"search_events raw input: {input}")

    # Map category to Ticketmaster segment
    segment = CATEGORY_TO_SEGMENT.get(category) if category else None

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
        logger.info(f"Creating TicketmasterClient...")
        async with TicketmasterClient() as client:
            logger.info(
                f"Calling Ticketmaster API: keyword={search_query!r}, city={city!r}, "
                f"start_date={date_from}, end_date={date_to}, segment={segment!r}"
            )
            result = await client.search_events(
                keyword=search_query if search_query else None,
                city=city,
                start_date=date_from,
                end_date=date_to,
                segment=segment,
                size=100,  # Fetch more to get variety after deduping
            )
            logger.info(f"Ticketmaster returned {result.total_count} events")

    except Exception as e:
        logger.exception(f"Ticketmaster search failed: {e}")
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
                "date_from": date_from,
                "date_to": date_to,
                "category": category,
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
    logger.info(f"Ticketmaster returned 0 results, trying Gemini rescue search")

    try:
        researcher = GeminiResearcher()

        # Build a search query for Gemini
        gemini_query_parts = [query]
        if city:
            gemini_query_parts.append(city)
        if category:
            gemini_query_parts.append(category)
        if date_from:
            gemini_query_parts.append(date_from)

        gemini_query = f"{' '.join(gemini_query_parts)} tickets events schedule 2025"

        gemini_result = await researcher.search(
            query=gemini_query,
            context=(
                f"Find upcoming events, shows, concerts, or games for: {query}. "
                f"Include specific dates, venues, cities, and ticket price ranges if available. "
                f"Focus on events the user can actually attend and buy tickets for."
            ),
        )

        logger.info(f"Gemini rescue returned {len(gemini_result.answer)} chars")

        # Format sources with more detail
        sources = [
            {
                "title": s.title or "Source",
                "url": s.url,
                "snippet": s.snippet,
            }
            for s in gemini_result.sources
        ]

        # =====================================================================
        # WEB RESEARCH RESULTS (UNVERIFIED)
        # These are from web search and should be verified by the user
        # =====================================================================
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
                "date_from": date_from,
                "date_to": date_to,
                "category": category,
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
        logger.exception(f"Gemini rescue search also failed: {e}")

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
                "date_from": date_from,
                "date_to": date_to,
                "category": category,
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
    Search for flights.

    TODO: Integrate with real flight APIs (Duffel, Amadeus, etc.)
    """
    origin = input.get("origin", "")
    destination = input.get("destination", "")
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

    # Mock response for MVP
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
    """
    if not user_id:
        return {
            "success": False,
            "error": "User must be logged in to save trips",
        }

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
            "error": f"Failed to save trip: {str(e)}",
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
    - Research travel information
    - Get event updates and news
    """
    query = input.get("query", "")
    context = input.get("context")

    if not query:
        return {
            "success": False,
            "error": "Query is required",
        }

    logger.info(f"research_web: query={query!r}, context={context!r}")

    try:
        researcher = GeminiResearcher()
        result = await researcher.search(query, context=context)

        # Format sources for response
        sources = [
            {
                "title": s.title,
                "url": s.url,
                "snippet": s.snippet,
            }
            for s in result.sources
        ]

        return {
            "success": True,
            "query": query,
            "answer": result.answer,
            "sources": sources,
            "source_count": len(sources),
        }

    except Exception as e:
        logger.exception(f"Web research failed: {e}")
        return {
            "success": False,
            "error": f"Research failed: {str(e)}",
            "query": query,
        }

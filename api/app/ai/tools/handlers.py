"""
Tool Handlers

Implementation of tool functions called by Claude.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from app.ai.tools.registry import register_tool
from app.integrations.ticketmaster import TicketmasterClient, Event

logger = logging.getLogger(__name__)


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
    """
    query = input.get("query", "")
    city = input.get("city")
    date_from = input.get("date_from")
    date_to = input.get("date_to")
    category = input.get("category")

    logger.info(
        f"search_events: query={query}, city={city}, "
        f"dates={date_from} to {date_to}, category={category}"
    )

    # Map category to Ticketmaster segment
    segment = CATEGORY_TO_SEGMENT.get(category) if category else None

    # For certain categories, enhance keyword search
    if category and category.lower() in CATEGORY_KEYWORDS:
        category_keyword = CATEGORY_KEYWORDS[category.lower()]
        if query:
            query = f"{query} {category_keyword}"
        else:
            query = category_keyword

    try:
        async with TicketmasterClient() as client:
            result = await client.search_events(
                keyword=query if query else None,
                city=city,
                start_date=date_from,
                end_date=date_to,
                segment=segment,
                size=20,
            )

        # Convert Event models to dicts for tool response
        events = [_format_event(e) for e in result.events]

        return {
            "success": True,
            "query": query,
            "filters": {
                "city": city,
                "date_from": date_from,
                "date_to": date_to,
                "category": category,
            },
            "count": result.total_count,
            "events": events,
        }

    except Exception as e:
        logger.exception(f"Ticketmaster search failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "query": query,
            "filters": {
                "city": city,
                "date_from": date_from,
                "date_to": date_to,
                "category": category,
            },
            "count": 0,
            "events": [],
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
    Save a trip to the user's account.

    TODO: Actually save to Supabase trips table
    """
    if not user_id:
        return {
            "success": False,
            "error": "User must be logged in to save trips",
        }

    title = input.get("title", "Untitled Trip")
    event = input.get("event", {})
    outbound_flight = input.get("outbound_flight")
    return_flight = input.get("return_flight")
    estimated_total = input.get("estimated_total")
    notes = input.get("notes")

    logger.info(f"save_trip: title={title}, user_id={user_id}")

    # TODO: Actually save to database
    # For MVP, just return success with the trip data

    trip_data = {
        "id": f"trip_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "user_id": user_id,
        "title": title,
        "event": event,
        "outbound_flight": outbound_flight,
        "return_flight": return_flight,
        "estimated_total": estimated_total,
        "notes": notes,
        "status": "draft",
        "created_at": datetime.now().isoformat(),
    }

    return {
        "success": True,
        "message": f"Trip '{title}' saved successfully!",
        "trip": trip_data,
    }

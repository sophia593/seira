"""
Tool Handlers

Implementation of tool functions called by Claude.
For MVP, these return mock data. Real API integrations will be added later.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from app.ai.tools.registry import register_tool

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# search_events
# -----------------------------------------------------------------------------


@register_tool("search_events")
async def search_events(
    input: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Search for live events.

    TODO: Integrate with real event APIs (SeatGeek, Ticketmaster, etc.)
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

    # Mock response for MVP
    # In production, this would call SeatGeek/Ticketmaster APIs

    mock_events = _generate_mock_events(query, city, date_from, date_to)

    return {
        "success": True,
        "query": query,
        "filters": {
            "city": city,
            "date_from": date_from,
            "date_to": date_to,
            "category": category,
        },
        "count": len(mock_events),
        "events": mock_events,
    }


def _generate_mock_events(
    query: str,
    city: str | None,
    date_from: str | None,
    date_to: str | None,
) -> list[dict[str, Any]]:
    """Generate mock event data based on query."""

    # Determine event type from query
    query_lower = query.lower()

    if any(team in query_lower for team in ["lakers", "celtics", "warriors", "knicks", "bulls"]):
        return _mock_nba_events(query, city)
    elif any(artist in query_lower for artist in ["taylor swift", "beyonce", "drake", "coldplay"]):
        return _mock_concert_events(query, city)
    else:
        # Generic events
        return _mock_generic_events(query, city)


def _mock_nba_events(query: str, city: str | None) -> list[dict[str, Any]]:
    """Generate mock NBA game events."""
    base_date = datetime.now() + timedelta(days=14)

    team_name = query.title()
    opponents = ["Celtics", "Warriors", "Heat", "Nuggets"]
    venues = {
        "Lakers": ("Crypto.com Arena", "Los Angeles"),
        "Celtics": ("TD Garden", "Boston"),
        "Warriors": ("Chase Center", "San Francisco"),
        "Knicks": ("Madison Square Garden", "New York"),
        "Bulls": ("United Center", "Chicago"),
    }

    # Get venue for the team
    venue, venue_city = venues.get(team_name.split()[0], ("Arena", city or "Unknown"))

    events = []
    for i, opponent in enumerate(opponents):
        if opponent.lower() in query.lower():
            continue

        event_date = base_date + timedelta(days=i * 4)
        events.append({
            "id": f"evt_{team_name.lower()}_{i}",
            "name": f"{team_name} vs {opponent}",
            "date": event_date.strftime("%Y-%m-%d"),
            "time": "7:30 PM",
            "venue": venue,
            "city": venue_city,
            "category": "sports",
            "subcategory": "NBA",
            "price_min": 85 + (i * 20),
            "price_max": 450 + (i * 50),
            "ticket_url": f"https://www.ticketmaster.com/event/{team_name.lower()}-{i}",
            "image_url": None,
        })

    return events[:4]


def _mock_concert_events(query: str, city: str | None) -> list[dict[str, Any]]:
    """Generate mock concert events."""
    base_date = datetime.now() + timedelta(days=30)

    artist = query.title()
    venues = [
        ("SoFi Stadium", "Los Angeles"),
        ("Madison Square Garden", "New York"),
        ("United Center", "Chicago"),
        ("Chase Center", "San Francisco"),
    ]

    events = []
    for i, (venue, venue_city) in enumerate(venues):
        if city and city.lower() not in venue_city.lower():
            continue

        event_date = base_date + timedelta(days=i * 7)
        events.append({
            "id": f"evt_{artist.lower().replace(' ', '_')}_{i}",
            "name": f"{artist} - The Eras Tour",
            "date": event_date.strftime("%Y-%m-%d"),
            "time": "7:00 PM",
            "venue": venue,
            "city": venue_city,
            "category": "music",
            "subcategory": "Concert",
            "price_min": 150 + (i * 25),
            "price_max": 850 + (i * 100),
            "ticket_url": f"https://www.ticketmaster.com/event/{artist.lower().replace(' ', '-')}-{i}",
            "image_url": None,
        })

    return events[:4] if events else _mock_generic_events(query, city)


def _mock_generic_events(query: str, city: str | None) -> list[dict[str, Any]]:
    """Generate generic mock events."""
    base_date = datetime.now() + timedelta(days=7)

    events = []
    for i in range(3):
        event_date = base_date + timedelta(days=i * 5)
        events.append({
            "id": f"evt_generic_{i}",
            "name": f"{query.title()} Event {i + 1}",
            "date": event_date.strftime("%Y-%m-%d"),
            "time": "8:00 PM",
            "venue": "Local Venue",
            "city": city or "Various",
            "category": "entertainment",
            "price_min": 50,
            "price_max": 200,
            "ticket_url": "https://www.ticketmaster.com",
            "image_url": None,
        })

    return events


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

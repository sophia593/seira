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
    if category and category.lower() in CATEGORY_KEYWORDS:
        category_keyword = CATEGORY_KEYWORDS[category.lower()]
        if query:
            query = f"{query} {category_keyword}"
        else:
            query = category_keyword

    try:
        logger.info(f"Creating TicketmasterClient...")
        async with TicketmasterClient() as client:
            logger.info(
                f"Calling Ticketmaster API: keyword={query!r}, city={city!r}, "
                f"start_date={date_from}, end_date={date_to}, segment={segment!r}"
            )
            result = await client.search_events(
                keyword=query if query else None,
                city=city,
                start_date=date_from,
                end_date=date_to,
                segment=segment,
                size=20,
            )
            logger.info(f"Ticketmaster returned {result.total_count} events")

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

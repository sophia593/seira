"""
Smart Package

This is THE differentiation from Google/Ticketmaster.

When user asks about events, we don't just show events.
We show the FULL TRIP PICTURE:
- Event + price
- Estimated flight cost (from their home city)
- Estimated hotel cost (1 night near venue)
- Total trip estimate
- Timing analysis ("flight lands 5 hours before game")
- One-click "plan this trip" action

User thinks: "Wow, I would have spent 30 minutes figuring all this out"

This is what a travel agent does. Google doesn't.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Flight cost estimates by route (will be replaced by real API later)
# -----------------------------------------------------------------------------

# Rough estimates for common routes (one-way, economy)
FLIGHT_ESTIMATES = {
    # From major hubs to LA
    ("SFO", "LAX"): 120,
    ("ORD", "LAX"): 180,
    ("JFK", "LAX"): 250,
    ("BOS", "LAX"): 260,
    ("SEA", "LAX"): 150,
    ("DEN", "LAX"): 140,
    ("ATL", "LAX"): 200,
    ("DFW", "LAX"): 160,
    ("MIA", "LAX"): 220,

    # From major hubs to NYC
    ("LAX", "JFK"): 250,
    ("SFO", "JFK"): 280,
    ("ORD", "JFK"): 150,
    ("BOS", "JFK"): 100,
    ("MIA", "JFK"): 140,
    ("ATL", "JFK"): 130,
    ("DFW", "JFK"): 180,

    # From major hubs to Chicago
    ("LAX", "ORD"): 180,
    ("JFK", "ORD"): 150,
    ("SFO", "ORD"): 170,
    ("DEN", "ORD"): 120,
    ("ATL", "ORD"): 110,

    # From major hubs to Miami
    ("JFK", "MIA"): 140,
    ("ORD", "MIA"): 150,
    ("LAX", "MIA"): 220,
    ("ATL", "MIA"): 100,

    # From major hubs to Vegas
    ("LAX", "LAS"): 80,
    ("SFO", "LAS"): 100,
    ("SEA", "LAS"): 120,
    ("DEN", "LAS"): 90,
    ("ORD", "LAS"): 150,
    ("JFK", "LAS"): 200,
}

# Default estimate when route not in table
DEFAULT_FLIGHT_ESTIMATE = 200

# Hotel estimates by city tier (per night)
HOTEL_ESTIMATES = {
    "tier1": {"budget": 120, "mid": 200, "nice": 350},  # NYC, SF, LA
    "tier2": {"budget": 90, "mid": 150, "nice": 280},   # Chicago, Miami, Boston
    "tier3": {"budget": 70, "mid": 120, "nice": 200},   # Other cities
}

TIER1_CITIES = {"new york", "nyc", "san francisco", "los angeles", "la"}
TIER2_CITIES = {"chicago", "miami", "boston", "seattle", "denver", "washington", "dc"}


# City to airport mapping
CITY_TO_AIRPORT = {
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
    "dallas": "DFW",
    "las vegas": "LAS",
    "vegas": "LAS",
    "phoenix": "PHX",
    "philadelphia": "PHL",
    "houston": "IAH",
    "minneapolis": "MSP",
    "detroit": "DTW",
    "orlando": "MCO",
    "tampa": "TPA",
    "austin": "AUS",
    "nashville": "BNA",
    "new orleans": "MSY",
}


def _get_airport(city: str) -> str:
    """Get airport code for a city."""
    if not city:
        return ""
    city_lower = city.lower().strip()
    # Check if it's already an airport code
    if len(city_lower) == 3 and city_lower.isalpha():
        return city_lower.upper()
    return CITY_TO_AIRPORT.get(city_lower, "")


def _estimate_flight_cost(origin: str, destination: str) -> Optional[int]:
    """Estimate one-way flight cost."""
    orig = _get_airport(origin)
    dest = _get_airport(destination)

    if not orig or not dest:
        return None

    if orig == dest:
        return 0  # Local - no flight needed

    # Check both directions in table
    cost = FLIGHT_ESTIMATES.get((orig, dest))
    if cost:
        return cost

    cost = FLIGHT_ESTIMATES.get((dest, orig))
    if cost:
        return cost

    return DEFAULT_FLIGHT_ESTIMATE


def _estimate_hotel_cost(city: str, tier: str = "mid") -> int:
    """Estimate hotel cost per night."""
    city_lower = (city or "").lower().strip()

    if city_lower in TIER1_CITIES:
        return HOTEL_ESTIMATES["tier1"].get(tier, 200)
    elif city_lower in TIER2_CITIES:
        return HOTEL_ESTIMATES["tier2"].get(tier, 150)
    else:
        return HOTEL_ESTIMATES["tier3"].get(tier, 120)


def _is_same_city(city1: str, city2: str) -> bool:
    """Check if two cities are the same (handling aliases)."""
    if not city1 or not city2:
        return False

    c1 = city1.lower().strip()
    c2 = city2.lower().strip()

    if c1 == c2:
        return True

    # Check aliases
    aliases = [
        {"los angeles", "la"},
        {"new york", "nyc"},
        {"san francisco", "sf"},
        {"las vegas", "vegas"},
    ]

    for alias_set in aliases:
        if c1 in alias_set and c2 in alias_set:
            return True

    return False


def _parse_event_time(event: Dict[str, Any]) -> Optional[int]:
    """Extract hour from event time (24h format)."""
    time_str = event.get("time") or ""
    if not time_str:
        return None

    time_str = time_str.upper().strip()

    # Handle "7:30 PM" format
    is_pm = "PM" in time_str
    time_str = time_str.replace("PM", "").replace("AM", "").strip()

    try:
        parts = time_str.split(":")
        hour = int(parts[0])
        if is_pm and hour < 12:
            hour += 12
        return hour
    except:
        return None


def build_smart_package(
    event: Dict[str, Any],
    user_home_city: Optional[str] = None,
    user_home_airport: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build a smart package for a single event.

    Returns:
    {
        "event": {...},
        "is_local": bool,
        "flight_estimate": {
            "origin": "SFO",
            "destination": "LAX",
            "one_way": 120,
            "round_trip": 240,
            "note": "Prices vary, this is a typical fare"
        },
        "hotel_estimate": {
            "per_night": 180,
            "suggested_nights": 1,
            "total": 180,
            "note": "Mid-range hotel near venue"
        },
        "total_estimate": {
            "tickets": 150,
            "flights": 240,
            "hotel": 180,
            "total": 570,
            "range": "$500-650"
        },
        "timing": {
            "event_time": "7:30 PM",
            "suggested_arrival": "Same day morning flight",
            "buffer_hours": 6,
            "note": "Plenty of time to check in and grab dinner"
        },
        "value_statement": "Complete trip for ~$570 — I can help you book each piece."
    }
    """
    event_city = event.get("city") or ""
    event_venue = event.get("venue") or event.get("venue_name") or ""
    event_time = event.get("time") or ""
    event_price = event.get("price_min") or event.get("min_price")

    # Determine origin
    origin = user_home_airport or user_home_city or ""

    # Check if local trip
    is_local = False
    if origin and event_city:
        is_local = _is_same_city(origin, event_city)

    result = {
        "event": {
            "name": event.get("name"),
            "date": event.get("date"),
            "time": event_time,
            "venue": event_venue,
            "city": event_city,
            "price": event_price,
        },
        "is_local": is_local,
        "flight_estimate": None,
        "hotel_estimate": None,
        "total_estimate": None,
        "timing": None,
        "value_statement": None,
    }

    # If no origin known, can't estimate flights
    if not origin:
        result["value_statement"] = "Tell me where you're coming from and I'll estimate the full trip cost."
        return result

    # Local trip - no flights needed
    if is_local:
        result["value_statement"] = f"You're local — just tickets at ${event_price or '??'}. Want parking tips or dinner recommendations?"
        return result

    # Estimate flights
    flight_one_way = _estimate_flight_cost(origin, event_city)
    flight_round_trip = (flight_one_way * 2) if flight_one_way else None

    origin_code = _get_airport(origin) or origin.upper()[:3]
    dest_code = _get_airport(event_city) or event_city.upper()[:3]

    result["flight_estimate"] = {
        "origin": origin_code,
        "destination": dest_code,
        "one_way": flight_one_way,
        "round_trip": flight_round_trip,
        "note": "Typical fare — actual prices vary by date",
    }

    # Estimate hotel (1 night for most events)
    hotel_per_night = _estimate_hotel_cost(event_city, "mid")
    suggested_nights = 1

    # If late event, might need 2 nights
    event_hour = _parse_event_time(event)
    if event_hour and event_hour >= 20:  # 8 PM or later
        suggested_nights = 1  # Could stay same night, fly out next morning

    result["hotel_estimate"] = {
        "per_night": hotel_per_night,
        "suggested_nights": suggested_nights,
        "total": hotel_per_night * suggested_nights,
        "note": f"Mid-range hotel near {event_venue or 'venue'}",
    }

    # Calculate total
    ticket_cost = float(event_price) if event_price else 0
    flight_cost = flight_round_trip or 0
    hotel_cost = hotel_per_night * suggested_nights
    total = ticket_cost + flight_cost + hotel_cost

    # Calculate range (±15%)
    low = int(total * 0.85)
    high = int(total * 1.15)

    result["total_estimate"] = {
        "tickets": ticket_cost,
        "flights": flight_cost,
        "hotel": hotel_cost,
        "total": total,
        "range": f"${low}-{high}",
    }

    # Timing analysis
    timing_note = ""
    if event_hour:
        if event_hour >= 19:  # 7 PM or later
            timing_note = "Evening event — fly in same day morning, plenty of time to settle in"
            buffer = event_hour - 10  # Assuming 10am arrival
        elif event_hour >= 13:  # 1 PM or later
            timing_note = "Afternoon event — fly in same day or night before"
            buffer = event_hour - 10
        else:
            timing_note = "Early event — I'd fly in the night before"
            buffer = 0

        result["timing"] = {
            "event_time": event_time,
            "suggested_arrival": "Same day morning" if event_hour >= 15 else "Night before",
            "buffer_hours": buffer if buffer > 0 else None,
            "note": timing_note,
        }

    # Value statement
    if total > 0:
        result["value_statement"] = (
            f"Complete trip: ~${int(total)} ({result['total_estimate']['range']}). "
            f"Tickets ${int(ticket_cost)}, flights ~${int(flight_cost)}, hotel ~${int(hotel_cost)}. "
            f"Want me to find actual flights and hotels?"
        )

    return result


def build_smart_packages_for_events(
    events: List[Dict[str, Any]],
    user_home_city: Optional[str] = None,
    user_home_airport: Optional[str] = None,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    """Build smart packages for multiple events."""
    packages = []
    for event in events[:limit]:
        pkg = build_smart_package(event, user_home_city, user_home_airport)
        packages.append(pkg)
    return packages


def format_smart_package_for_chat(package: Dict[str, Any]) -> str:
    """Format a smart package as chat text."""
    lines = []

    event = package.get("event", {})
    name = event.get("name") or "Event"
    date = event.get("date") or ""
    time = event.get("time") or ""
    venue = event.get("venue") or ""
    city = event.get("city") or ""

    # Header
    lines.append(f"**{name}**")
    if date or time:
        lines.append(f"{date} {time} @ {venue}, {city}".strip())
    lines.append("")

    # Local trip
    if package.get("is_local"):
        lines.append(package.get("value_statement", ""))
        return "\n".join(lines)

    # Full trip breakdown
    total = package.get("total_estimate", {})
    if total:
        lines.append("**Trip estimate:**")
        if total.get("tickets"):
            lines.append(f"- Tickets: ${int(total['tickets'])}")
        if total.get("flights"):
            flight = package.get("flight_estimate", {})
            lines.append(f"- Flights ({flight.get('origin', '?')} → {flight.get('destination', '?')} round-trip): ~${int(total['flights'])}")
        if total.get("hotel"):
            hotel = package.get("hotel_estimate", {})
            lines.append(f"- Hotel ({hotel.get('suggested_nights', 1)} night): ~${int(total['hotel'])}")
        lines.append(f"- **Total: ~${int(total['total'])}** ({total.get('range', '')})")
        lines.append("")

    # Timing
    timing = package.get("timing", {})
    if timing and timing.get("note"):
        lines.append(f"*{timing['note']}*")
        lines.append("")

    # CTA
    lines.append("Want me to find actual flights and hotels for this?")

    return "\n".join(lines)


def get_comparison_insight(packages: List[Dict[str, Any]]) -> Optional[str]:
    """Generate insight comparing multiple packages."""
    if len(packages) < 2:
        return None

    totals = []
    for pkg in packages:
        total = pkg.get("total_estimate", {}).get("total")
        if total:
            totals.append(total)

    if len(totals) < 2:
        return None

    cheapest = min(totals)
    most_expensive = max(totals)
    diff = most_expensive - cheapest

    if diff > 100:
        return f"Trip costs range from ${int(cheapest)} to ${int(most_expensive)} — the timing/matchup drives the price difference."

    return None

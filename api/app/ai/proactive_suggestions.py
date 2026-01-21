"""
Proactive Suggestions

Seira doesn't wait for you to ask. She knows what comes next
and offers it naturally — like a friend who's been to that city before.

Key moments:
1. User picks an event → Offer parking/dinner/transit
2. User picks evening event → Suggest dinner beforehand
3. User picks flights → Connect timing to event
4. User going to new city → Share neighborhood tips
5. Weekend event → Warn about crowds, suggest reservations

What makes it smart, not annoying:
- Relevant to what they just did
- Specific ("5 min walk") not vague ("nearby")
- One suggestion, not a list
- Easy to ignore
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Venue Knowledge (expandable - later from Supabase)
# -----------------------------------------------------------------------------

# Quick tips for major venues (fallback when no web research)
VENUE_TIPS = {
    "crypto.com arena": {
        "city": "los angeles",
        "neighborhood": "downtown LA",
        "parking_note": "Parking is $30-50 in the official lots. Uber drop-off is at Figueroa entrance.",
        "food_nearby": "STK and The Palm are right next to the arena — great for pre-game dinner.",
        "transit_note": "Take Metro to Pico station, 5 min walk.",
        "vibe": "LA Live area has tons of bars and restaurants, gets busy on game nights.",
    },
    "madison square garden": {
        "city": "new york",
        "neighborhood": "Midtown Manhattan",
        "parking_note": "Don't drive — parking is brutal and expensive. Take the subway.",
        "food_nearby": "Lots of options in K-Town (32nd St) or Hell's Kitchen, both 10 min walk.",
        "transit_note": "Right above Penn Station — any subway to 34th St works.",
        "vibe": "The Garden is iconic but the immediate area is chaotic. Eat before you arrive.",
    },
    "td garden": {
        "city": "boston",
        "neighborhood": "North Station",
        "parking_note": "Parking garages nearby are $40-60. Subway is easier.",
        "food_nearby": "The area right around the arena isn't great for food. Head to North End (10 min walk) for amazing Italian.",
        "transit_note": "Right above North Station — Green and Orange lines.",
        "vibe": "Great arena, boring immediate surroundings. North End is the move.",
    },
    "united center": {
        "city": "chicago",
        "neighborhood": "Near West Side",
        "parking_note": "Lots of parking lots around the arena, $20-40.",
        "food_nearby": "Not much walking distance — eat in West Loop before (15 min Uber).",
        "transit_note": "Take the Blue Line to Illinois Medical District, then walk or Uber.",
        "vibe": "The arena's kind of in the middle of nowhere. Plan to Uber or drive.",
    },
    "chase center": {
        "city": "san francisco",
        "neighborhood": "Mission Bay",
        "parking_note": "Parking is expensive ($40-60). Ferry from East Bay is fun if you're coming from Oakland.",
        "food_nearby": "Mission Bay is new — Spark Social has food trucks, or head to Mission district (15 min).",
        "transit_note": "Muni T-line goes right there, or ferry from Oakland.",
        "vibe": "Nice new arena, waterfront views. Area is still developing.",
    },
    "ball arena": {
        "city": "denver",
        "neighborhood": "Downtown Denver",
        "parking_note": "Street parking or lots nearby, $15-30.",
        "food_nearby": "LoDo (Lower Downtown) is walking distance — tons of breweries and restaurants.",
        "transit_note": "Light rail to Pepsi Center station.",
        "vibe": "Great location, easy to walk around before/after.",
    },
}

# City tips for first-time visitors
CITY_TIPS = {
    "los angeles": "LA is spread out — you'll want to Uber or drive everywhere. Give yourself extra time for traffic.",
    "new york": "Subway is your friend. Don't drive in Manhattan. Everything's walkable once you're in a neighborhood.",
    "boston": "Compact and walkable. The T (subway) covers most tourist areas. North End has the best food.",
    "chicago": "Downtown is walkable, but the arena's a bit out there. Uber or drive to United Center.",
    "san francisco": "Hilly and compact. Uber or walk. Parking is a nightmare.",
    "nashville": "Broadway (honky-tonks) is the main strip. Arena is right downtown, easy walk to everything.",
    "austin": "Everything's spread out but downtown is walkable. Uber to get around. Great food scene.",
    "miami": "You'll need a car or Uber. Beach is separate from downtown. Traffic can be rough.",
    "denver": "Downtown is easy. High altitude — take it easy on the drinking if you just flew in.",
    "seattle": "Rainy but walkable downtown. Pike Place is worth visiting. Arena is south of downtown.",
}


# -----------------------------------------------------------------------------
# Suggestion Types
# -----------------------------------------------------------------------------

def get_event_selection_suggestion(
    event: Dict[str, Any],
    user_home_city: Optional[str] = None,
    visited_cities: List[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Generate suggestion when user selects an event.

    Returns suggestion with:
    - type: "parking" | "dinner" | "transit" | "neighborhood"
    - message: The actual suggestion text
    - follow_up: Optional question to ask
    """
    visited_cities = visited_cities or []

    venue_name = (event.get("venue") or event.get("venue_name") or "").lower()
    event_city = (event.get("city") or "").lower()
    event_time = event.get("time") or ""

    # Check if this is a new city for them
    is_new_city = event_city and event_city not in [c.lower() for c in visited_cities]

    # Check if evening event
    is_evening = False
    if event_time:
        try:
            hour = _extract_hour(event_time)
            if hour and hour >= 17:  # 5 PM or later
                is_evening = True
        except:
            pass

    # Try to get venue-specific tips
    venue_tips = None
    for known_venue, tips in VENUE_TIPS.items():
        if known_venue in venue_name or venue_name in known_venue:
            venue_tips = tips
            break

    suggestions = []

    # New city tip (highest priority for first-timers)
    if is_new_city and event_city in CITY_TIPS:
        suggestions.append({
            "type": "neighborhood",
            "priority": 1,
            "message": f"First time in {event_city.title()}? {CITY_TIPS[event_city]}",
            "follow_up": None,
        })

    # Venue-specific suggestions
    if venue_tips:
        if is_evening and venue_tips.get("food_nearby"):
            suggestions.append({
                "type": "dinner",
                "priority": 2,
                "message": f"For dinner before the game: {venue_tips['food_nearby']}",
                "follow_up": "Want me to look up more options or help with reservations?",
            })

        if venue_tips.get("parking_note"):
            suggestions.append({
                "type": "parking",
                "priority": 3,
                "message": venue_tips["parking_note"],
                "follow_up": "Want the transit details instead?",
            })

        if venue_tips.get("vibe"):
            suggestions.append({
                "type": "neighborhood",
                "priority": 4,
                "message": venue_tips["vibe"],
                "follow_up": None,
            })

    # Generic evening event suggestion
    if is_evening and not any(s["type"] == "dinner" for s in suggestions):
        suggestions.append({
            "type": "dinner",
            "priority": 2,
            "message": f"Evening event at {event_time} — you'll probably want dinner before. Want me to find good spots near the venue?",
            "follow_up": None,
        })

    # Generic parking/transit offer
    if not any(s["type"] in ["parking", "transit"] for s in suggestions):
        suggestions.append({
            "type": "parking",
            "priority": 5,
            "message": f"Want me to look up parking or transit options for {venue_name or 'the venue'}?",
            "follow_up": None,
        })

    # Return highest priority suggestion
    if suggestions:
        suggestions.sort(key=lambda x: x["priority"])
        return suggestions[0]

    return None


def get_flight_selection_suggestion(
    event: Dict[str, Any],
    flight: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Generate suggestion when user selects flights.

    Connects flight timing to event timing.
    """
    event_time = event.get("time") or ""
    event_venue = event.get("venue") or event.get("venue_name") or "the venue"
    arrival_time = flight.get("arrival_time") or ""

    if not event_time or not arrival_time:
        return None

    try:
        event_hour = _extract_hour(event_time)
        arrival_hour = _extract_hour(arrival_time)

        if not event_hour or not arrival_hour:
            return None

        buffer_hours = event_hour - arrival_hour

        if buffer_hours >= 5:
            return {
                "type": "timing",
                "message": f"You land at {arrival_time}, game's at {event_time} — plenty of time. You could grab dinner near {event_venue} before.",
                "follow_up": "Want me to find a good pre-game spot?",
            }
        elif buffer_hours >= 3:
            return {
                "type": "timing",
                "message": f"You land at {arrival_time}, game's at {event_time} — good timing. If you want to eat first, I'd head straight to the arena area.",
                "follow_up": "Want quick food options near the venue?",
            }
        elif buffer_hours >= 1:
            return {
                "type": "timing",
                "message": f"You land at {arrival_time}, game's at {event_time} — a bit tight. I'd Uber straight to the arena to be safe.",
                "follow_up": None,
            }
        else:
            return {
                "type": "warning",
                "message": f"Heads up: You land at {arrival_time} and the game's at {event_time}. That's cutting it close — any delays and you might miss the start.",
                "follow_up": "Want me to look for an earlier flight?",
            }

    except Exception as e:
        logger.debug(f"Could not calculate timing: {e}")
        return None


def get_local_trip_suggestion(
    event: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Generate suggestion for local trips (no flights needed).
    """
    venue_name = (event.get("venue") or event.get("venue_name") or "").lower()
    event_time = event.get("time") or ""

    # Check for venue-specific tips
    venue_tips = None
    for known_venue, tips in VENUE_TIPS.items():
        if known_venue in venue_name or venue_name in known_venue:
            venue_tips = tips
            break

    if venue_tips:
        if venue_tips.get("parking_note"):
            return {
                "type": "parking",
                "message": f"Since you're driving: {venue_tips['parking_note']}",
                "follow_up": "Or want transit options?",
            }

    # Generic local suggestion
    return {
        "type": "logistics",
        "message": "Nice — no flights needed. Want me to look up parking or the best way to get there?",
        "follow_up": None,
    }


def get_weekend_suggestion(
    event: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Generate suggestion for weekend events (crowds, reservations).
    """
    event_date = event.get("date") or ""
    event_name = event.get("name") or "the event"

    if not event_date:
        return None

    try:
        # Check if weekend
        dt = datetime.strptime(event_date[:10], "%Y-%m-%d")
        if dt.weekday() >= 5:  # Saturday or Sunday
            return {
                "type": "reservation",
                "message": f"Weekend event means the area will be busy. If you want a good dinner spot before, I'd book a reservation now.",
                "follow_up": "Want me to find places that take reservations?",
            }
    except:
        pass

    return None


# -----------------------------------------------------------------------------
# Main Suggestion Builder
# -----------------------------------------------------------------------------

def get_proactive_suggestion(
    trigger: str,
    event: Dict[str, Any] = None,
    flight: Dict[str, Any] = None,
    user_context: Dict[str, Any] = None,
) -> Optional[Dict[str, Any]]:
    """
    Get a proactive suggestion based on the trigger.

    Triggers:
    - "event_selected": User just picked an event
    - "flights_selected": User just picked flights
    - "local_trip": User confirmed they're local
    - "weekend_event": Event is on a weekend

    Returns:
    {
        "type": "dinner" | "parking" | "transit" | "timing" | "neighborhood" | "warning",
        "message": "The suggestion text",
        "follow_up": "Optional follow-up question" | None,
    }
    """
    user_context = user_context or {}
    event = event or {}
    flight = flight or {}

    if trigger == "event_selected":
        return get_event_selection_suggestion(
            event=event,
            user_home_city=user_context.get("home_city"),
            visited_cities=user_context.get("visited_cities", []),
        )

    elif trigger == "flights_selected":
        return get_flight_selection_suggestion(event=event, flight=flight)

    elif trigger == "local_trip":
        return get_local_trip_suggestion(event=event)

    elif trigger == "weekend_event":
        return get_weekend_suggestion(event=event)

    return None


def format_suggestion_for_chat(suggestion: Dict[str, Any]) -> str:
    """Format a suggestion as natural chat text."""
    if not suggestion:
        return ""

    lines = [suggestion.get("message", "")]

    if suggestion.get("follow_up"):
        lines.append("")
        lines.append(suggestion["follow_up"])

    return "\n".join(lines)


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def _extract_hour(time_str: str) -> Optional[int]:
    """Extract hour from various time formats."""
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
        elif not is_pm and hour == 12:
            hour = 0
        return hour
    except:
        return None


# -----------------------------------------------------------------------------
# Prompt Context
# -----------------------------------------------------------------------------

def build_proactive_context(
    event: Dict[str, Any] = None,
    user_context: Dict[str, Any] = None,
) -> Optional[str]:
    """
    Build context for system prompt about proactive suggestions.

    This tells Claude what to suggest based on the current state.
    """
    if not event:
        return None

    lines = ["## Proactive Suggestion Opportunity", ""]

    venue_name = (event.get("venue") or event.get("venue_name") or "").lower()
    event_city = (event.get("city") or "").lower()
    event_time = event.get("time") or ""

    # Check for venue tips
    venue_tips = None
    for known_venue, tips in VENUE_TIPS.items():
        if known_venue in venue_name:
            venue_tips = tips
            break

    if venue_tips:
        lines.append(f"**Venue knowledge available for {venue_name}:**")
        if venue_tips.get("parking_note"):
            lines.append(f"- Parking: {venue_tips['parking_note']}")
        if venue_tips.get("food_nearby"):
            lines.append(f"- Food: {venue_tips['food_nearby']}")
        if venue_tips.get("transit_note"):
            lines.append(f"- Transit: {venue_tips['transit_note']}")
        lines.append("")

    if event_city in CITY_TIPS:
        visited = (user_context or {}).get("visited_cities", [])
        if event_city not in [c.lower() for c in visited]:
            lines.append(f"**First time in {event_city.title()}:** {CITY_TIPS[event_city]}")
            lines.append("")

    # Evening event
    if event_time:
        try:
            hour = _extract_hour(event_time)
            if hour and hour >= 17:
                lines.append("**Evening event:** Proactively offer dinner suggestions.")
        except:
            pass

    lines.append("Weave one suggestion naturally into your response — don't list multiple options.")

    return "\n".join(lines) if len(lines) > 3 else None

"""
Next Actions

Provides contextual suggestions that anticipate user needs.
- 4 primary options (always visible, clean)
- "More..." expands to additional options
- Never pushy, always helpful
- Context-aware based on trip progress
"""

from __future__ import annotations

from typing import Any, Dict, List
from datetime import datetime, timezone

from app.ai.trip_progress import extract_progress_from_context, TripProgress


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_next_actions(
    conversation_context: Dict[str, Any] | None,
    event_city: str | None = None,
    event_time: str | None = None,
    is_driving_city: bool = False,
) -> Dict[str, Any]:
    """
    Build contextual next actions based on where we are in the trip.

    Returns:
        {
            "primary": [...],      # 4 main options (always shown)
            "more": [...],         # Additional options (expandable)
            "chat_text": "...",    # Text version for chat
        }
    """
    ctx = dict(conversation_context or {})
    trip = extract_progress_from_context(ctx)

    primary: List[Dict[str, str]] = []
    more: List[Dict[str, str]] = []

    # Driving cities where parking matters
    DRIVING_CITIES = ["los angeles", "la", "dallas", "houston", "phoenix", "atlanta", "denver", "miami"]
    city_lower = (event_city or "").lower()
    needs_parking = is_driving_city or any(c in city_lower for c in DRIVING_CITIES)

    # Is this an evening event? (restaurants make sense)
    is_evening = False
    if event_time:
        try:
            hour = int(event_time.split(":")[0])
            is_evening = hour >= 17  # 5pm or later
        except:
            is_evening = True  # Assume evening if we can't parse

    # === BUILD PRIMARY OPTIONS ===

    # If no event yet, help them find one
    if not trip.event_selected:
        primary = [
            {"label": "Find events this weekend", "value": "Find events this weekend"},
            {"label": "Search by artist/team", "value": "I want to see "},
            {"label": "Search by city", "value": "Show events in "},
            {"label": "Browse popular events", "value": "What are some popular upcoming events?"},
        ]
        return _format_response(primary, [], trip)

    # If we need to know where they're coming from
    if not trip.origin_known and not trip.is_local:
        primary = [
            {"label": "I'll fly there", "value": "I'm flying from "},
            {"label": "I'm local", "value": "I'm local, don't need flights"},
            {"label": "Road trip", "value": "I'm driving there"},
            {"label": "Still deciding", "value": "Not sure yet how I'm getting there"},
        ]
        return _format_response(primary, [], trip)

    # If we need flights
    if trip.needs_flights() and not trip.flights_selected:
        primary = [
            {"label": "Show flight options", "value": "Show me flight options"},
            {"label": "Morning flights", "value": "Show morning flights only"},
            {"label": "Nonstop only", "value": "Show nonstop flights only"},
            {"label": "Budget options", "value": "Show the cheapest flight options"},
        ]
        return _format_response(primary, [], trip)

    # === EVENT SELECTED + TRAVEL SORTED ===
    # Now we anticipate: Stay, Get there, Eat & drink

    # Primary: the essentials
    if not trip.hotels_researched:
        primary.append({
            "label": "Stay (hotels + Airbnb)",
            "value": f"Find places to stay near the venue — best experience, not crazy expensive"
        })

    if needs_parking:
        primary.append({
            "label": "Getting there (parking/transit)",
            "value": "How should I get to the venue? Parking, rideshare, or transit options"
        })
    else:
        primary.append({
            "label": "Getting there",
            "value": "What's the best way to get to the venue?"
        })

    if is_evening:
        primary.append({
            "label": "Dinner nearby",
            "value": "Find great restaurants near the venue for dinner before the event"
        })
    else:
        primary.append({
            "label": "Food & drinks nearby",
            "value": "Find good food and drink options near the venue"
        })

    # 4th primary slot: Save if ready, otherwise "More options"
    if trip.is_complete():
        primary.append({
            "label": "Save this trip",
            "value": "Save this trip"
        })
    else:
        primary.append({
            "label": "More options",
            "value": "Show me more options"
        })

    # Trim to 4
    primary = primary[:4]

    # === MORE OPTIONS ===
    more = [
        {"label": "Best time to arrive", "value": "What time should I arrive at the venue?"},
        {"label": "What to wear", "value": "What should I wear to this event?"},
        {"label": "After the event", "value": "What should we do after the event?"},
        {"label": "Share itinerary", "value": "Summarize my trip so I can share it"},
        {"label": "Neighborhood tips", "value": "Tell me about the area around the venue"},
        {"label": "Weather forecast", "value": "What's the weather looking like for the event?"},
    ]

    return _format_response(primary, more, trip)


def _format_response(
    primary: List[Dict[str, str]],
    more: List[Dict[str, str]],
    trip: TripProgress,
) -> Dict[str, Any]:
    """Format the final response."""

    # Chat text version
    chat_lines = []
    if primary:
        for i, action in enumerate(primary[:4], start=1):
            chat_lines.append(f"{i}. {action['label']}")

    chat_text = "\n".join(chat_lines) if chat_lines else ""

    return {
        "primary": primary[:4],
        "more": more[:6],
        "chat_text": chat_text,
        "trip_complete": trip.is_complete(),
        "progress_summary": trip.summary_for_user(),
    }


def build_guidance(conversation_context: Dict[str, Any] | None) -> Dict[str, Any]:
    """
    Backward-compatible wrapper.
    """
    result = build_next_actions(conversation_context)
    return {
        "progress_summary": result["progress_summary"],
        "next_step": "",  # Deprecated, use primary actions instead
        "next_actions": result["primary"],
        "more_actions": result["more"],
        "chat_options_text": result["chat_text"],
    }

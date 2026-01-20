"""
Seira Guidance System

Determines what Seira should do next and how proactive to be.

Behavior philosophy:
- Act, don't wait
- Search automatically when we have enough info
- Pause only before things that cost money (booking flights, hotels, saving trip)
- Always keep the user moving forward
"""

from __future__ import annotations
from typing import Any, Dict, List
from app.ai.trip_progress import extract_progress_from_context, TripProgress


class GuidanceAction:
    """Possible actions Seira can take."""

    # Automatic actions (just do it)
    SEARCH_EVENTS = "search_events"
    SEARCH_FLIGHTS = "search_flights"
    RESEARCH_HOTELS = "research_hotels"
    RESEARCH_VENUE = "research_venue"

    # Pause actions (confirm first)
    CONFIRM_SAVE_TRIP = "confirm_save_trip"

    # Ask actions (need info)
    ASK_ORIGIN = "ask_origin"
    ASK_EVENT_PREFERENCE = "ask_event_preference"


def get_proactive_behavior(
    conversation_context: Dict[str, Any] | None,
    user_preferences: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Determines what Seira should do automatically vs ask about.

    Returns:
        - auto_action: action to take immediately (or None)
        - auto_action_params: parameters for the auto action
        - should_pause: whether to confirm before proceeding
        - pause_reason: why we're pausing (for the prompt)
        - next_actions: UI suggestions for the user
        - guidance_for_ai: instructions for the prompt
    """
    trip = extract_progress_from_context(conversation_context)
    prefs = user_preferences or {}
    home_airport = prefs.get("home_airport")

    result = {
        "auto_action": None,
        "auto_action_params": {},
        "should_pause": False,
        "pause_reason": None,
        "next_actions": [],
        "guidance_for_ai": "",
    }

    # === State: No event selected ===
    if not trip.event_selected:
        result["guidance_for_ai"] = (
            "User hasn't selected an event yet. Help them find one. "
            "If they mention anything searchable, search immediately — don't ask clarifying questions. "
            "Show top 3-5 results with reasons why each is a good option."
        )
        result["next_actions"] = [
            {"label": "Find events this weekend", "value": "Find events this weekend"},
            {"label": "Search by artist or team", "value": "I want to see "},
        ]
        return result

    # === State: Event selected, need origin ===
    if not trip.origin_known and not trip.is_local:
        # If we know their home airport from preferences, use it automatically
        if home_airport:
            result["auto_action"] = GuidanceAction.SEARCH_FLIGHTS
            result["auto_action_params"] = {"origin": home_airport}
            result["guidance_for_ai"] = (
                f"User selected an event. Their home airport is {home_airport}. "
                f"Search for flights automatically and present options. "
                f"Say something like: 'I'll find flights from {home_airport} — here's what's available.'"
            )
        else:
            result["auto_action"] = GuidanceAction.ASK_ORIGIN
            result["guidance_for_ai"] = (
                "User selected an event but we don't know where they're traveling from. "
                "Ask ONE question: where they're flying from, or if they're local. "
                "Be direct: 'Where are you flying from? Or are you local to [city]?'"
            )
            result["next_actions"] = [
                {"label": "I'm flying from...", "value": "I'm flying from "},
                {"label": "I'm local", "value": "I'm local, no flights needed"},
            ]
        return result

    # === State: Origin known, need flights ===
    if trip.needs_flights() and not trip.flights_selected:
        # If we just learned the origin, search automatically
        if trip.origin_city:
            result["auto_action"] = GuidanceAction.SEARCH_FLIGHTS
            result["auto_action_params"] = {"origin": trip.origin_city}
            result["guidance_for_ai"] = (
                f"User is flying from {trip.origin_city}. "
                f"Search for flights automatically and present the best options. "
                f"Show 3-5 flights, highlight the one that works best with the event timing. "
                f"After showing options, wait for them to pick — this involves money."
            )
        result["next_actions"] = [
            {"label": "Show me flights", "value": "Show me flight options"},
            {"label": "Nonstop only", "value": "Show nonstop flights only"},
        ]
        return result

    # === State: Flights selected (or not needed), trip is completable ===
    if trip.is_complete():
        result["should_pause"] = True
        result["pause_reason"] = "Trip is ready to save — confirm with user first"
        result["guidance_for_ai"] = (
            "The trip has everything needed. Before saving: "
            "1. Summarize what we have (event, flights, total cost estimate). "
            "2. Ask if they want to save, OR offer to look up hotels/restaurants first. "
            "3. Don't save until they confirm. "
            "Example: 'Here's your trip: [event] on [date], flights from [city] (~$X total). "
            "Want me to save this, or should I look up hotels first?'"
        )
        result["next_actions"] = [
            {"label": "Save this trip", "value": "Save this trip"},
            {"label": "Find hotels first", "value": "Find hotels near the venue"},
            {"label": "Restaurant suggestions", "value": "Find restaurants near the venue"},
        ]
        return result

    # === State: Local user, no flights needed ===
    if trip.is_local and trip.event_selected:
        result["guidance_for_ai"] = (
            "User is local — no flights needed. "
            "Offer helpful next steps: parking tips, dinner spots, or just save the trip. "
            "Be proactive: 'Since you're local, you're all set. Want me to find parking info or good dinner spots near the venue?'"
        )
        result["next_actions"] = [
            {"label": "Save this trip", "value": "Save this trip"},
            {"label": "Parking tips", "value": "How's parking at the venue?"},
            {"label": "Dinner spots nearby", "value": "Find restaurants near the venue"},
        ]
        return result

    # === Fallback ===
    result["guidance_for_ai"] = "Continue helping the user with their trip."
    result["next_actions"] = [{"label": "Continue", "value": "What's next?"}]
    return result


def build_guidance(conversation_context: Dict[str, Any] | None) -> Dict[str, Any]:
    """
    Simple wrapper for backward compatibility.
    Returns progress summary, next step, and UI actions.
    """
    trip = extract_progress_from_context(conversation_context)
    behavior = get_proactive_behavior(conversation_context)

    return {
        "progress_summary": trip.summary_for_user(),
        "next_step": trip.next_step(),
        "next_actions": behavior["next_actions"],
        "guidance_for_ai": behavior["guidance_for_ai"],
    }

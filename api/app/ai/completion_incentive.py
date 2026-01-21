"""
Completion Incentive

Solves: "Users start trips but don't save them"

Psychology at play:
1. Progress visualization - Show how close they are (80% complete!)
2. Effort investment - "You've already found the perfect event and flights"
3. Loss aversion - "Don't lose this plan" / "Prices may change"
4. Simplicity - "Just one tap to save"
5. Value summary - Show total value of work done

Key moments to nudge:
- After selecting an event (30% → show what's next)
- After selecting flights (70% → "almost there!")
- After viewing hotels (90% → "ready to save!")
- If user seems to be leaving (100% → "don't lose this")
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class TripProgress:
    """Track what's been done in trip planning."""

    # Core progress
    event_selected: bool = False
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    event_price: Optional[float] = None

    origin_known: bool = False
    origin_city: Optional[str] = None
    is_local: bool = False

    flights_selected: bool = False
    flight_price: Optional[float] = None

    hotels_viewed: bool = False
    hotel_suggestion: Optional[str] = None
    hotel_price: Optional[float] = None

    trip_saved: bool = False

    # Timestamps for urgency
    started_at: Optional[str] = None
    last_action_at: Optional[str] = None

    def progress_percent(self) -> int:
        """Calculate completion percentage."""
        points = 0
        max_points = 100

        # Event selected: 30 points
        if self.event_selected:
            points += 30

        # Origin/local known: 20 points
        if self.origin_known or self.is_local:
            points += 20

        # Flights selected (or local): 30 points
        if self.flights_selected or self.is_local:
            points += 30

        # Hotels viewed: 10 points (optional but nice)
        if self.hotels_viewed:
            points += 10

        # If saved, 100%
        if self.trip_saved:
            return 100

        return min(points, 90)  # Cap at 90% until saved

    def total_value(self) -> Optional[float]:
        """Calculate total trip value so far."""
        total = 0.0
        if self.event_price:
            total += self.event_price
        if self.flight_price:
            total += self.flight_price
        if self.hotel_price:
            total += self.hotel_price
        return total if total > 0 else None

    def what_we_have(self) -> List[str]:
        """List what's been accomplished."""
        items = []
        if self.event_selected:
            items.append(f"Event: {self.event_name or 'Selected'}")
        if self.is_local:
            items.append("Travel: Local (no flights needed)")
        elif self.flights_selected:
            items.append(f"Flights: From {self.origin_city or 'selected'}")
        elif self.origin_known:
            items.append(f"Origin: {self.origin_city}")
        if self.hotels_viewed:
            items.append(f"Hotel ideas: {self.hotel_suggestion or 'Researched'}")
        return items

    def what_we_need(self) -> List[str]:
        """List what's still needed."""
        items = []
        if not self.event_selected:
            items.append("Pick an event")
        elif not self.origin_known and not self.is_local:
            items.append("Where you're traveling from")
        elif not self.flights_selected and not self.is_local:
            items.append("Select flights")
        if not self.trip_saved and self.progress_percent() >= 50:
            items.append("Save to your trips")
        return items


def build_progress_from_context(context: Dict[str, Any]) -> TripProgress:
    """Build TripProgress from conversation context."""
    progress = TripProgress()

    # Event
    event = context.get("selected_event") or context.get("event")
    if event:
        progress.event_selected = True
        progress.event_name = event.get("name")
        progress.event_date = event.get("date")
        progress.event_price = event.get("price_min") or event.get("price")

    # Origin
    if context.get("origin_city") or context.get("home_airport"):
        progress.origin_known = True
        progress.origin_city = context.get("origin_city") or context.get("home_airport")

    if context.get("is_local"):
        progress.is_local = True
        progress.origin_known = True

    # Flights
    if context.get("selected_flights") or context.get("outbound_flight"):
        progress.flights_selected = True
        outbound = context.get("outbound_flight") or {}
        ret = context.get("return_flight") or {}
        progress.flight_price = (outbound.get("price") or 0) + (ret.get("price") or 0)

    # Hotels
    if context.get("hotel_suggestions") or context.get("hotels_viewed"):
        progress.hotels_viewed = True
        progress.hotel_suggestion = context.get("hotel_name")
        progress.hotel_price = context.get("hotel_price")

    # Saved
    if context.get("trip_saved"):
        progress.trip_saved = True

    # Timestamps
    progress.started_at = context.get("started_at")
    progress.last_action_at = context.get("last_action_at")

    return progress


# -----------------------------------------------------------------------------
# Nudge Messages
# -----------------------------------------------------------------------------

def get_progress_nudge(progress: TripProgress) -> Optional[Dict[str, Any]]:
    """
    Get contextual nudge based on progress.

    Returns:
    {
        "type": "progress" | "effort" | "urgency" | "value" | "completion",
        "message": "...",
        "cta": "Save this trip",
        "progress_percent": 70,
    }
    """
    pct = progress.progress_percent()

    # Already saved - celebrate!
    if progress.trip_saved:
        return {
            "type": "completion",
            "message": "Trip saved! You're all set.",
            "cta": None,
            "progress_percent": 100,
        }

    # Just started (event only)
    if pct <= 30:
        return {
            "type": "progress",
            "message": f"Good start! {pct}% planned.",
            "sub_message": "Next: Tell me where you're traveling from.",
            "cta": None,
            "progress_percent": pct,
        }

    # Have origin, need flights
    if pct > 30 and pct <= 50:
        return {
            "type": "progress",
            "message": f"{pct}% there — let's find your flights.",
            "sub_message": None,
            "cta": "Find flights",
            "progress_percent": pct,
        }

    # Have flights, could save
    if pct > 50 and pct <= 70:
        value = progress.total_value()
        value_msg = f" (~${int(value)} total)" if value else ""
        return {
            "type": "effort",
            "message": f"Nice! {pct}% complete{value_msg}.",
            "sub_message": "You've done the hard part — want to save this trip?",
            "cta": "Save trip",
            "progress_percent": pct,
        }

    # Almost complete
    if pct > 70 and pct < 90:
        have = progress.what_we_have()
        return {
            "type": "value",
            "message": f"Almost there! {pct}% complete.",
            "sub_message": f"You've got: {', '.join(have[:2])}. Save it before prices change.",
            "cta": "Save trip",
            "progress_percent": pct,
        }

    # Ready to save
    if pct >= 90:
        value = progress.total_value()
        return {
            "type": "urgency",
            "message": "Your trip is ready!",
            "sub_message": f"~${int(value)} trip planned. Save it so you don't lose this." if value else "Save it so you don't lose this.",
            "cta": "Save trip",
            "progress_percent": pct,
        }

    return None


def get_abandonment_nudge(progress: TripProgress) -> Optional[Dict[str, Any]]:
    """
    Get nudge when user seems to be leaving without saving.

    Use when:
    - User says "bye", "thanks", "later"
    - Session is ending
    - User is switching topics
    """
    if progress.trip_saved:
        return None

    pct = progress.progress_percent()

    if pct < 30:
        return None  # Not enough invested

    value = progress.total_value()
    have = progress.what_we_have()

    if pct >= 70:
        # High investment - strong nudge
        return {
            "type": "loss_aversion",
            "message": "Wait — don't lose this trip!",
            "sub_message": f"You've planned {', '.join(have[:2])}. Save it in one tap.",
            "cta": "Save before I go",
            "progress_percent": pct,
            "urgency": "high",
        }

    if pct >= 50:
        # Medium investment - gentle nudge
        return {
            "type": "reminder",
            "message": "Want to save your progress?",
            "sub_message": "I can save what we've planned so you can pick up later.",
            "cta": "Save progress",
            "progress_percent": pct,
            "urgency": "medium",
        }

    return None


def get_value_summary(progress: TripProgress) -> Optional[Dict[str, Any]]:
    """
    Get a summary of value created.

    Shows user what they'd lose if they don't save.
    """
    if progress.progress_percent() < 30:
        return None

    have = progress.what_we_have()
    value = progress.total_value()

    # Estimate time saved
    time_saved_minutes = 0
    if progress.event_selected:
        time_saved_minutes += 10
    if progress.flights_selected:
        time_saved_minutes += 20
    if progress.hotels_viewed:
        time_saved_minutes += 15

    time_saved = None
    if time_saved_minutes >= 15:
        time_saved = f"~{time_saved_minutes} min"

    return {
        "items_planned": have,
        "total_value": value,
        "time_saved": time_saved,
        "progress_percent": progress.progress_percent(),
    }


# -----------------------------------------------------------------------------
# Prompt Injection
# -----------------------------------------------------------------------------

def build_completion_context(progress: TripProgress) -> Optional[str]:
    """
    Build context string for system prompt to encourage completion.
    """
    pct = progress.progress_percent()

    if pct < 30 or progress.trip_saved:
        return None

    lines = ["## Trip Completion Status", ""]
    lines.append(f"**Progress: {pct}%**")

    have = progress.what_we_have()
    if have:
        lines.append(f"Completed: {', '.join(have)}")

    need = progress.what_we_need()
    if need:
        lines.append(f"Remaining: {', '.join(need)}")

    lines.append("")

    if pct >= 70:
        lines.append("**Encourage saving:** The user has done most of the work. Gently suggest saving before prices change or they lose the plan.")
    elif pct >= 50:
        lines.append("**Show progress:** Mention they're halfway there. Offer to help with the next step.")

    value = progress.total_value()
    if value:
        lines.append(f"Trip value so far: ~${int(value)}")

    return "\n".join(lines)


# -----------------------------------------------------------------------------
# Chat Formatters
# -----------------------------------------------------------------------------

def format_progress_bar(percent: int) -> str:
    """Create a simple text progress bar."""
    filled = int(percent / 10)
    empty = 10 - filled
    bar = "█" * filled + "░" * empty
    return f"[{bar}] {percent}%"


def format_nudge_for_chat(nudge: Dict[str, Any]) -> str:
    """Format a nudge as chat text."""
    lines = []

    # Progress bar for visual
    pct = nudge.get("progress_percent", 0)
    if pct > 0:
        lines.append(format_progress_bar(pct))

    # Main message
    lines.append(f"**{nudge.get('message', '')}**")

    # Sub message
    if nudge.get("sub_message"):
        lines.append(nudge["sub_message"])

    # CTA
    if nudge.get("cta"):
        lines.append(f"\n→ {nudge['cta']}")

    return "\n".join(lines)


def format_value_summary_for_chat(summary: Dict[str, Any]) -> str:
    """Format value summary as chat text."""
    lines = []

    pct = summary.get("progress_percent", 0)
    lines.append(format_progress_bar(pct))
    lines.append("")

    lines.append("**What we've planned:**")
    for item in summary.get("items_planned", []):
        lines.append(f"✓ {item}")

    value = summary.get("total_value")
    if value:
        lines.append(f"\n**Trip total:** ~${int(value)}")

    time_saved = summary.get("time_saved")
    if time_saved:
        lines.append(f"**Time saved:** {time_saved} of research")

    lines.append("\n→ Save this trip")

    return "\n".join(lines)

"""
Aha Moments

Creates moments where users feel the magic of having a concierge:
- "Wait, it already did that?"
- "It thought of everything"
- "This would have taken me an hour"

The aha moment isn't one feature — it's the feeling that Seira is
genuinely helpful in a way that saves time and reduces stress.

Key moments:
1. Trip summary - seeing everything come together
2. Connections shown - "flight lands 3 hours before, hotel is 5 min walk"
3. Proactive completeness - nothing forgotten
4. Time saved - "here's what would have taken you an hour"
5. Problems prevented - "good thing we caught that"
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import re


# -----------------------------------------------------------------------------
# Trip Summary (The Big Aha Moment)
# -----------------------------------------------------------------------------

@dataclass
class TripSummary:
    """A complete trip summary that creates the 'aha' moment."""

    # Core info
    title: str
    destination_city: str

    # Event
    event_name: str
    event_date: str
    event_time: str
    event_venue: str
    event_price: Optional[str] = None
    ticket_url: Optional[str] = None

    # Travel
    origin_city: Optional[str] = None
    outbound_flight: Optional[Dict[str, Any]] = None
    return_flight: Optional[Dict[str, Any]] = None
    is_local: bool = False

    # Accommodation
    hotel_name: Optional[str] = None
    hotel_price: Optional[str] = None
    hotel_distance: Optional[str] = None  # "5 min walk from venue"

    # Extras
    dinner_suggestion: Optional[str] = None
    parking_info: Optional[str] = None

    # Computed insights
    timeline: List[Dict[str, str]] = field(default_factory=list)
    connections: List[str] = field(default_factory=list)  # How things fit together
    warnings: List[str] = field(default_factory=list)
    tips: List[str] = field(default_factory=list)

    # Totals
    estimated_total: Optional[float] = None
    breakdown: Dict[str, float] = field(default_factory=dict)

    # Meta
    time_saved_estimate: Optional[str] = None  # "~45 minutes of searching"
    completeness_score: int = 0  # 0-100


def build_trip_summary(
    event: Dict[str, Any],
    outbound_flight: Dict[str, Any] = None,
    return_flight: Dict[str, Any] = None,
    hotel: Dict[str, Any] = None,
    origin_city: str = None,
    is_local: bool = False,
    extras: Dict[str, Any] = None,
) -> TripSummary:
    """
    Build a complete trip summary from components.

    This is where the magic happens — we connect all the pieces
    and show how they fit together.
    """
    extras = extras or {}

    # Extract event details
    event_name = event.get("name", "Event")
    event_date = event.get("date", "")
    event_time = event.get("time", "")
    event_venue = event.get("venue", "")
    event_city = event.get("city", "")
    event_price = event.get("price_min") or event.get("price")

    # Build title
    title = f"{event_name}"
    if event_date:
        # Format date nicely
        try:
            dt = datetime.strptime(event_date[:10], "%Y-%m-%d")
            date_nice = dt.strftime("%b %d")
            title = f"{event_name} — {date_nice}"
        except:
            title = f"{event_name} — {event_date}"

    summary = TripSummary(
        title=title,
        destination_city=event_city,
        event_name=event_name,
        event_date=event_date,
        event_time=event_time,
        event_venue=event_venue,
        event_price=f"${event_price}" if event_price else None,
        ticket_url=event.get("ticket_url") or event.get("url"),
        origin_city=origin_city,
        is_local=is_local,
    )

    # Add flights
    if outbound_flight:
        summary.outbound_flight = outbound_flight
    if return_flight:
        summary.return_flight = return_flight

    # Add hotel
    if hotel:
        summary.hotel_name = hotel.get("name")
        summary.hotel_price = f"${hotel.get('price')}/night" if hotel.get("price") else hotel.get("price_range")
        summary.hotel_distance = hotel.get("distance_to_venue")

    # Add extras
    summary.dinner_suggestion = extras.get("dinner")
    summary.parking_info = extras.get("parking")

    # Build timeline
    summary.timeline = _build_timeline(summary)

    # Find connections (how things fit together)
    summary.connections = _find_connections(summary)

    # Calculate totals
    summary.breakdown, summary.estimated_total = _calculate_totals(summary)

    # Calculate completeness
    summary.completeness_score = _calculate_completeness(summary)

    # Estimate time saved
    summary.time_saved_estimate = _estimate_time_saved(summary)

    # Add tips
    summary.tips = _generate_tips(summary)

    return summary


def _build_timeline(summary: TripSummary) -> List[Dict[str, str]]:
    """Build a chronological timeline of the trip."""
    timeline = []

    # Outbound flight
    if summary.outbound_flight:
        flight = summary.outbound_flight
        dep_time = flight.get("departure_time", "")
        arr_time = flight.get("arrival_time", "")
        airline = flight.get("airline", "")

        timeline.append({
            "type": "flight",
            "icon": "plane",
            "title": f"Fly to {summary.destination_city}",
            "subtitle": f"{airline} • Depart {dep_time}, arrive {arr_time}",
            "time": dep_time,
        })
    elif summary.is_local:
        timeline.append({
            "type": "local",
            "icon": "pin",
            "title": "You're local",
            "subtitle": "No flight needed",
            "time": "",
        })

    # Hotel check-in (if hotel)
    if summary.hotel_name:
        timeline.append({
            "type": "hotel",
            "icon": "hotel",
            "title": f"Check in: {summary.hotel_name}",
            "subtitle": summary.hotel_distance or "",
            "time": "3:00 PM",  # Standard check-in
        })

    # Dinner (if suggested and evening event)
    if summary.dinner_suggestion and summary.event_time:
        try:
            event_hour = int(summary.event_time.split(":")[0])
            if event_hour >= 17:  # Evening event
                timeline.append({
                    "type": "dinner",
                    "icon": "utensils",
                    "title": "Dinner",
                    "subtitle": summary.dinner_suggestion,
                    "time": f"{event_hour - 2}:00 PM",
                })
        except:
            pass

    # The event
    timeline.append({
        "type": "event",
        "icon": "ticket",
        "title": summary.event_name,
        "subtitle": f"{summary.event_venue}",
        "time": summary.event_time,
    })

    # Return flight
    if summary.return_flight:
        flight = summary.return_flight
        dep_time = flight.get("departure_time", "")
        airline = flight.get("airline", "")

        timeline.append({
            "type": "flight",
            "icon": "plane",
            "title": f"Fly home",
            "subtitle": f"{airline} • Depart {dep_time}",
            "time": dep_time,
        })

    return timeline


def _find_connections(summary: TripSummary) -> List[str]:
    """
    Find and articulate how the pieces fit together.

    This is key to the aha moment — showing the user that
    everything works together, not just a list of bookings.
    """
    connections = []

    # Flight → Event timing
    if summary.outbound_flight and summary.event_time:
        arrival = summary.outbound_flight.get("arrival_time", "")
        if arrival:
            # Calculate buffer
            try:
                # Simple hour extraction
                arr_hour = _extract_hour(arrival)
                event_hour = _extract_hour(summary.event_time)

                if arr_hour and event_hour:
                    buffer = event_hour - arr_hour
                    if buffer >= 4:
                        connections.append(f"Flight lands {buffer} hours before the event — plenty of time to check in and grab dinner")
                    elif buffer >= 2:
                        connections.append(f"Flight lands {buffer} hours before — enough time to get to the venue")
            except:
                pass

    # Hotel → Venue distance
    if summary.hotel_distance:
        connections.append(f"Hotel is {summary.hotel_distance} — easy walk to the event")

    # Dinner → Event timing
    if summary.dinner_suggestion and summary.event_time:
        connections.append(f"Dinner spot is near the venue — perfect pre-event meal")

    # Return flight → Event end
    if summary.return_flight and summary.event_time:
        # Check if next day return
        connections.append("Flying back the next day — no rush after the event")

    # Local trip simplicity
    if summary.is_local and not summary.outbound_flight:
        connections.append("No flights to worry about — just show up and enjoy")

    return connections


def _calculate_totals(summary: TripSummary) -> tuple[Dict[str, float], Optional[float]]:
    """Calculate cost breakdown and total."""
    breakdown = {}

    # Event tickets
    if summary.event_price:
        try:
            price = float(summary.event_price.replace("$", "").replace(",", ""))
            breakdown["Tickets"] = price
        except:
            pass

    # Outbound flight
    if summary.outbound_flight:
        price = summary.outbound_flight.get("price")
        if price:
            try:
                breakdown["Outbound flight"] = float(price)
            except:
                pass

    # Return flight
    if summary.return_flight:
        price = summary.return_flight.get("price")
        if price:
            try:
                breakdown["Return flight"] = float(price)
            except:
                pass

    # Hotel (estimate 1 night)
    if summary.hotel_price:
        try:
            # Extract number from "$200/night" or "~$200"
            price_match = re.search(r'\$?(\d+)', summary.hotel_price)
            if price_match:
                breakdown["Hotel (1 night)"] = float(price_match.group(1))
        except:
            pass

    total = sum(breakdown.values()) if breakdown else None

    return breakdown, total


def _calculate_completeness(summary: TripSummary) -> int:
    """
    Calculate how complete the trip plan is (0-100).

    Used to show progress and prompt for missing pieces.
    """
    score = 0

    # Event (required) - 30 points
    if summary.event_name and summary.event_date:
        score += 30

    # Travel sorted - 30 points
    if summary.is_local:
        score += 30
    elif summary.outbound_flight:
        score += 20
        if summary.return_flight:
            score += 10

    # Accommodation - 20 points
    if summary.hotel_name or summary.is_local:
        score += 20

    # Extras - 20 points
    if summary.dinner_suggestion:
        score += 10
    if summary.parking_info or summary.is_local:
        score += 10

    return min(score, 100)


def _estimate_time_saved(summary: TripSummary) -> str:
    """
    Estimate how much time Seira saved the user.

    This creates the aha moment: "this would have taken me forever"
    """
    minutes = 0

    # Event search: 10-15 min
    if summary.event_name:
        minutes += 12

    # Flight search: 20-30 min
    if summary.outbound_flight:
        minutes += 25
    if summary.return_flight:
        minutes += 10

    # Hotel research: 15-20 min
    if summary.hotel_name:
        minutes += 18

    # Restaurant research: 10 min
    if summary.dinner_suggestion:
        minutes += 10

    # Parking/logistics: 5-10 min
    if summary.parking_info:
        minutes += 8

    # Coordination/comparison: 10-15 min
    if minutes > 30:
        minutes += 12

    if minutes < 15:
        return None
    elif minutes < 30:
        return "~20 minutes of searching"
    elif minutes < 45:
        return "~30 minutes of searching"
    elif minutes < 60:
        return "~45 minutes of searching"
    else:
        return f"~{minutes // 15 * 15} minutes of searching"


def _generate_tips(summary: TripSummary) -> List[str]:
    """Generate helpful tips based on the trip."""
    tips = []

    # Evening event tip
    if summary.event_time:
        try:
            hour = _extract_hour(summary.event_time)
            if hour and hour >= 19:
                tips.append("Late start — grab dinner before, not after")
        except:
            pass

    # Flight tip
    if summary.outbound_flight:
        tips.append("Check in online 24 hours before to pick your seat")

    # Hotel tip
    if summary.hotel_name:
        tips.append("Call ahead to request early check-in if your flight arrives early")

    return tips[:2]  # Max 2 tips


def _extract_hour(time_str: str) -> Optional[int]:
    """Extract hour from various time formats."""
    if not time_str:
        return None

    time_str = time_str.upper().strip()

    # Handle "7:30 PM" format
    is_pm = "PM" in time_str
    time_str = time_str.replace("PM", "").replace("AM", "").strip()

    match = re.match(r'(\d{1,2})', time_str)
    if match:
        hour = int(match.group(1))
        if is_pm and hour < 12:
            hour += 12
        return hour

    return None


# -----------------------------------------------------------------------------
# Formatting for Response
# -----------------------------------------------------------------------------

def format_trip_summary_for_chat(summary: TripSummary) -> str:
    """
    Format the trip summary as chat text.

    This is THE aha moment — seeing everything come together.
    """
    lines = []

    # Header
    lines.append(f"## {summary.title}")
    lines.append("")

    # Quick overview with connections
    if summary.connections:
        lines.append("**Here's how it all fits together:**")
        for conn in summary.connections[:3]:
            lines.append(f"- {conn}")
        lines.append("")

    # Timeline
    lines.append("**Your trip:**")
    for item in summary.timeline:
        title = item.get("title", "")
        subtitle = item.get("subtitle", "")
        time = item.get("time", "")

        if time and subtitle:
            lines.append(f"- **{time}** — {title} ({subtitle})")
        elif subtitle:
            lines.append(f"- {title} — {subtitle}")
        else:
            lines.append(f"- {title}")
    lines.append("")

    # Cost breakdown
    if summary.breakdown:
        lines.append("**Cost breakdown:**")
        for item, cost in summary.breakdown.items():
            lines.append(f"- {item}: ${cost:,.0f}")
        if summary.estimated_total:
            lines.append(f"**Total: ~${summary.estimated_total:,.0f}**")
        lines.append("")

    # Tips
    if summary.tips:
        lines.append("**Tips:**")
        for tip in summary.tips:
            lines.append(f"- {tip}")
        lines.append("")

    # Time saved (the aha moment)
    if summary.time_saved_estimate:
        lines.append(f"*Saved you {summary.time_saved_estimate}*")
        lines.append("")

    # Completeness
    if summary.completeness_score < 100:
        missing = []
        if not summary.outbound_flight and not summary.is_local:
            missing.append("flights")
        if not summary.hotel_name and not summary.is_local:
            missing.append("hotel")
        if missing:
            lines.append(f"Still need: {', '.join(missing)}")
    else:
        lines.append("**Trip complete — ready to book!**")

    return "\n".join(lines)


def format_trip_summary_for_api(summary: TripSummary) -> Dict[str, Any]:
    """Format trip summary as structured data for frontend."""
    return {
        "title": summary.title,
        "destination_city": summary.destination_city,

        "event": {
            "name": summary.event_name,
            "date": summary.event_date,
            "time": summary.event_time,
            "venue": summary.event_venue,
            "price": summary.event_price,
            "ticket_url": summary.ticket_url,
        },

        "travel": {
            "origin_city": summary.origin_city,
            "is_local": summary.is_local,
            "outbound_flight": summary.outbound_flight,
            "return_flight": summary.return_flight,
        },

        "accommodation": {
            "hotel_name": summary.hotel_name,
            "hotel_price": summary.hotel_price,
            "hotel_distance": summary.hotel_distance,
        } if summary.hotel_name else None,

        "extras": {
            "dinner_suggestion": summary.dinner_suggestion,
            "parking_info": summary.parking_info,
        },

        "timeline": summary.timeline,
        "connections": summary.connections,
        "warnings": summary.warnings,
        "tips": summary.tips,

        "cost": {
            "breakdown": summary.breakdown,
            "total": summary.estimated_total,
        },

        "meta": {
            "completeness_score": summary.completeness_score,
            "time_saved_estimate": summary.time_saved_estimate,
        },
    }


# -----------------------------------------------------------------------------
# Aha Moment Triggers
# -----------------------------------------------------------------------------

def get_aha_moment(
    trigger: str,
    context: Dict[str, Any] = None,
) -> Optional[Dict[str, str]]:
    """
    Get an 'aha moment' message for specific triggers.

    These are small delights throughout the experience that
    make users feel the magic.

    Triggers:
    - "auto_origin": Used their home airport automatically
    - "auto_preferences": Applied their preferences
    - "found_favorite": Found their favorite team/artist
    - "problem_prevented": Caught a timing issue
    - "trip_complete": Everything is ready
    - "time_saved": Showing time saved
    """
    context = context or {}

    moments = {
        "auto_origin": {
            "type": "subtle",
            "message": f"(Using {context.get('airport', 'your home airport')} as departure)",
        },
        "auto_preferences": {
            "type": "subtle",
            "message": f"(Searching {context.get('cabin_class', 'your preferred cabin')})",
        },
        "found_favorite": {
            "type": "highlight",
            "message": f"Your {context.get('team', 'team')} are playing!",
        },
        "problem_prevented": {
            "type": "save",
            "message": f"Good thing we caught that — {context.get('issue', 'could have been a problem')}",
        },
        "trip_complete": {
            "type": "celebration",
            "message": "Everything's set. You're going to have a great time!",
        },
        "time_saved": {
            "type": "value",
            "message": f"That would've taken you {context.get('time', '30+ minutes')} to figure out",
        },
        "connections_made": {
            "type": "smart",
            "message": "Flight, hotel, and dinner all lined up perfectly",
        },
    }

    return moments.get(trigger)


def should_show_trip_summary(trip_progress: Dict[str, Any]) -> bool:
    """
    Determine if we should show the trip summary.

    Show it when:
    - User just completed a major step (picked flights)
    - User asks to see their trip
    - User is about to save
    - Trip is complete
    """
    if not trip_progress:
        return False

    # Has event and either flights or is local
    has_event = trip_progress.get("event_selected", False)
    has_travel = trip_progress.get("flights_selected", False) or trip_progress.get("is_local", False)

    return has_event and has_travel

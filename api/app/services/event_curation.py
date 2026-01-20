"""
Event Curation Service

Filters, ranks, and curates event results to feel intentional rather than dumped.
Implements: Search → Filter → Rank → Present (top 3-5) → Explain why
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def _parse_date(date_str: str | None) -> datetime | None:
    """Parse date string to datetime."""
    if not date_str:
        return None
    try:
        # Handle YYYY-MM-DD format
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        pass
    try:
        # Handle ISO format
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def _days_from_now(dt: datetime | None) -> float:
    """Calculate days from now to the given datetime."""
    if not dt:
        return 10_000.0
    now = datetime.now(timezone.utc)
    return max(0.0, (dt - now).total_seconds() / 86400)


def _is_weekend(dt: datetime | None) -> bool:
    """Check if datetime falls on a weekend (Fri/Sat/Sun)."""
    if not dt:
        return False
    return dt.weekday() in (4, 5, 6)


def _is_evening(time_str: str | None) -> bool:
    """Check if time is evening (after 5pm)."""
    if not time_str:
        return False
    try:
        # Handle "7:30 PM" format
        if "PM" in time_str.upper() or "AM" in time_str.upper():
            t = datetime.strptime(time_str.upper().replace(" ", ""), "%I:%M%p")
            return t.hour >= 17 or t.hour < 2  # 5pm onwards or late night
        # Handle "19:30:00" format
        t = datetime.strptime(time_str.split(":")[0], "%H")
        return t.hour >= 17 or t.hour < 2
    except Exception:
        return False


def _dedupe_key(event: dict[str, Any]) -> tuple[str, str]:
    """Generate deduplication key for an event."""
    name = (event.get("name") or "").strip().lower()
    date = event.get("date") or ""
    return (name, date)


def curate_events(
    events: list[dict[str, Any]],
    user_city: str | None = None,
    max_results: int = 5,
) -> list[dict[str, Any]]:
    """
    Filter, dedupe, rank, and return top events.

    Ranking criteria:
    - Soonest upcoming events (within reason)
    - Weekend/evening events get a boost
    - Events in user's city (if known) get a boost
    - Avoid duplicate events
    """
    if not events:
        return []

    # 1) Dedupe by name + date
    seen: set[tuple[str, str]] = set()
    unique: list[dict[str, Any]] = []
    for ev in events:
        key = _dedupe_key(ev)
        if key in seen:
            continue
        seen.add(key)
        unique.append(ev)

    # 2) Score each event
    scored: list[tuple[float, dict[str, Any]]] = []
    user_city_lower = user_city.strip().lower() if user_city else None

    for ev in unique:
        dt = _parse_date(ev.get("date"))
        days = _days_from_now(dt)
        event_city = (ev.get("city") or "").split(",")[0].strip().lower()

        # Calculate score components
        score = 0.0

        # Time proximity: closer = better (max 10 points)
        # Events 0-60 days out get highest scores
        if days <= 60:
            score += max(0.0, 10.0 - (days / 6))  # 10 points at 0 days, ~0 at 60 days
        else:
            score += max(0.0, 5.0 - (days / 30))  # Gradual decline for far-future

        # Weekend bonus (2 points)
        if _is_weekend(dt):
            score += 2.0

        # Evening bonus (1 point)
        if _is_evening(ev.get("time")):
            score += 1.0

        # User's city bonus (3 points) - strong preference
        if user_city_lower and event_city and user_city_lower in event_city:
            score += 3.0

        # Price availability bonus (0.5 points) - has pricing info
        if ev.get("price_min") is not None:
            score += 0.5

        scored.append((score, ev))

    # 3) Sort by score descending and take top results
    scored.sort(key=lambda x: x[0], reverse=True)
    return [ev for _, ev in scored[:max_results]]


def explain_selection(event: dict[str, Any], user_city: str | None = None) -> list[str]:
    """
    Generate short reasons explaining why this event was selected.
    Makes results feel curated rather than random.
    """
    reasons: list[str] = []

    dt = _parse_date(event.get("date"))
    event_city = (event.get("city") or "").split(",")[0].strip()
    user_city_lower = user_city.strip().lower() if user_city else None
    event_city_lower = event_city.lower()

    if dt:
        days = _days_from_now(dt)
        if days <= 7:
            reasons.append("This week")
        elif days <= 14:
            reasons.append("Coming up soon")
        elif days <= 30:
            reasons.append("This month")

        if _is_weekend(dt):
            reasons.append("Weekend")

    if _is_evening(event.get("time")):
        reasons.append("Evening show")

    if user_city_lower and event_city_lower and user_city_lower in event_city_lower:
        reasons.append(f"In {event_city}")

    if event.get("price_min") is not None:
        price = event["price_min"]
        if price < 50:
            reasons.append("Budget-friendly")
        elif price < 150:
            reasons.append("Mid-range pricing")

    # Default if no specific reasons
    if not reasons:
        if event_city:
            reasons.append(f"In {event_city}")
        else:
            reasons.append("Good match")

    return reasons


def add_curation_metadata(
    events: list[dict[str, Any]],
    user_city: str | None = None,
) -> list[dict[str, Any]]:
    """
    Add curation metadata (why_selected) to each event.
    """
    curated = []
    for ev in events:
        ev_copy = ev.copy()
        ev_copy["why_selected"] = explain_selection(ev, user_city)
        curated.append(ev_copy)
    return curated

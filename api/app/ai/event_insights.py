"""
Event Insights

Surfaces context that helps users make decisions.
Only uses keyword-based and date-based detection — no hardcoded rivalry data.

For rivalries and team-specific insights: query from Supabase (future).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import re


@dataclass
class EventInsight:
    """A single insight about an event."""
    tag: str              # Short label: "🏆 Championship"
    explanation: str      # One sentence
    priority: int         # Higher = more important
    category: str         # "timing", "experience"


# -----------------------------------------------------------------------------
# Holidays (this is fine to keep — it's date math, not sports data)
# -----------------------------------------------------------------------------

US_HOLIDAYS_2025_2027 = {
    "2025-01-01": "New Year's Day",
    "2025-02-14": "Valentine's Day",
    "2025-05-26": "Memorial Day",
    "2025-07-04": "July 4th",
    "2025-09-01": "Labor Day",
    "2025-11-27": "Thanksgiving",
    "2025-12-25": "Christmas",
    "2025-12-31": "New Year's Eve",
    "2026-01-01": "New Year's Day",
    "2026-02-14": "Valentine's Day",
    "2026-05-25": "Memorial Day",
    "2026-07-04": "July 4th",
    "2026-09-07": "Labor Day",
    "2026-11-26": "Thanksgiving",
    "2026-12-25": "Christmas",
    "2026-12-31": "New Year's Eve",
    "2027-01-01": "New Year's Day",
    "2027-02-14": "Valentine's Day",
    "2027-05-31": "Memorial Day",
    "2027-07-04": "July 4th",
    "2027-09-06": "Labor Day",
    "2027-11-25": "Thanksgiving",
    "2027-12-25": "Christmas",
    "2027-12-31": "New Year's Eve",
}


# -----------------------------------------------------------------------------
# Keyword-Based Insights (no manual data needed)
# -----------------------------------------------------------------------------

def _normalize(text: str) -> str:
    return re.sub(r'[^a-z0-9\s]', '', (text or '').lower()).strip()


def _check_name_keywords(event_name: str) -> Optional[EventInsight]:
    """Check for keywords that signal something special."""
    normalized = _normalize(event_name)

    # Finals / Championships
    if "final" in normalized or "championship" in normalized or "title" in normalized:
        return EventInsight(
            tag="🏆 Championship",
            explanation="Championship event — peak stakes, electric atmosphere.",
            priority=95,
            category="experience",
        )

    # Playoffs
    if "playoff" in normalized or "postseason" in normalized:
        return EventInsight(
            tag="🔥 Playoffs",
            explanation="Playoff intensity — every moment matters.",
            priority=90,
            category="experience",
        )

    # All-Star
    if "all star" in normalized or "all-star" in normalized or "allstar" in normalized:
        return EventInsight(
            tag="⭐ All-Star",
            explanation="All-Star event — best players, festive atmosphere.",
            priority=85,
            category="experience",
        )

    # Opening night / Premiere
    if "opening night" in normalized or "premiere" in normalized or "season opener" in normalized:
        return EventInsight(
            tag="✨ Opening Night",
            explanation="Opening night — first performance, special energy.",
            priority=85,
            category="timing",
        )

    # Farewell / Final tour
    if "farewell" in normalized or "final tour" in normalized or "last show" in normalized or "goodbye" in normalized:
        return EventInsight(
            tag="👋 Farewell",
            explanation="Farewell performance — last chance to see them.",
            priority=95,
            category="timing",
        )

    # Reunion
    if "reunion" in normalized:
        return EventInsight(
            tag="🎉 Reunion",
            explanation="Reunion show — rare chance to see them back together.",
            priority=85,
            category="experience",
        )

    # Sold out (if in name)
    if "sold out" in normalized:
        return EventInsight(
            tag="🎟️ High demand",
            explanation="High demand — resale prices may be elevated.",
            priority=70,
            category="experience",
        )

    # Derby / Classic (for horse racing, special games)
    if "derby" in normalized or "classic" in normalized:
        return EventInsight(
            tag="🏇 Classic event",
            explanation="Signature event — tradition and atmosphere.",
            priority=80,
            category="experience",
        )

    return None


def _check_timing_insight(event_date: str) -> Optional[EventInsight]:
    """Check for timing-related insights (holidays, weekends)."""
    if not event_date:
        return None

    date_str = event_date[:10] if len(event_date) >= 10 else event_date

    # Check holidays
    holiday = US_HOLIDAYS_2025_2027.get(date_str)
    if holiday:
        if holiday == "Valentine's Day":
            return EventInsight(
                tag="💕 Valentine's Day",
                explanation="Valentine's Day — popular date night, book dinner early.",
                priority=85,
                category="timing",
            )
        elif holiday in ["Christmas", "Thanksgiving", "New Year's Eve", "New Year's Day"]:
            return EventInsight(
                tag=f"🎄 {holiday}",
                explanation=f"{holiday} — special atmosphere, higher demand.",
                priority=85,
                category="timing",
            )
        elif holiday == "July 4th":
            return EventInsight(
                tag="🎆 July 4th",
                explanation="Independence Day — expect fireworks and festivities.",
                priority=80,
                category="timing",
            )
        else:
            return EventInsight(
                tag=f"📅 {holiday}",
                explanation=f"Holiday event — may affect travel and availability.",
                priority=60,
                category="timing",
            )

    # Check for weekend
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        if dt.weekday() == 4:  # Friday
            return EventInsight(
                tag="🌙 Friday night",
                explanation="Friday night — great energy, book dinner ahead.",
                priority=40,
                category="timing",
            )
        elif dt.weekday() == 5:  # Saturday
            return EventInsight(
                tag="🎉 Saturday",
                explanation="Saturday event — peak atmosphere.",
                priority=45,
                category="timing",
            )
    except:
        pass

    return None


# -----------------------------------------------------------------------------
# Main Function
# -----------------------------------------------------------------------------

def get_event_insights(
    event_name: str,
    event_date: str = None,
    max_insights: int = 2,
) -> List[EventInsight]:
    """
    Get insights for an event based on keywords and dates.

    For rivalry detection and team-specific insights, query Supabase (future).
    """
    insights: List[EventInsight] = []

    # Check name keywords
    kw_insight = _check_name_keywords(event_name)
    if kw_insight:
        insights.append(kw_insight)

    # Check timing
    timing_insight = _check_timing_insight(event_date)
    if timing_insight:
        insights.append(timing_insight)

    # Sort by priority and limit
    insights.sort(key=lambda x: x.priority, reverse=True)

    # Dedupe by category
    seen_categories = set()
    deduped = []
    for insight in insights:
        if insight.category not in seen_categories:
            deduped.append(insight)
            seen_categories.add(insight.category)

    return deduped[:max_insights]


def format_insights_for_response(insights: List[EventInsight]) -> Dict[str, Any]:
    """Format insights for API response."""
    if not insights:
        return {"tags": [], "explanation": None, "has_insights": False}

    tags = [i.tag for i in insights]
    explanation = insights[0].explanation if insights else None

    return {
        "tags": tags,
        "explanation": explanation,
        "has_insights": True,
    }


def enrich_events_with_insights(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Add insights to a list of events."""
    for event in events:
        insights = get_event_insights(
            event_name=event.get("name", ""),
            event_date=event.get("date") or event.get("dateTime"),
        )
        event["insights"] = format_insights_for_response(insights)

    return events

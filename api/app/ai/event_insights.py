"""
Event Insights

Surfaces context that helps users make decisions:
- Rivalry games, playoff implications, historic matchups
- Artist tour context, festival headliner status
- Theater: long-running shows, limited runs, Tony winners
- Timing: last home game, opening night, holiday games
- Practical: venue tips (from web research)

Philosophy:
- Add insight when it's genuinely useful
- Don't state the obvious
- Don't be annoying — one insight per event max
- Tags are short, explanations are one sentence
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
import re


# -----------------------------------------------------------------------------
# Data: Sports Rivalries (lightweight)
# -----------------------------------------------------------------------------

# Format: team -> list of rivals
NBA_RIVALRIES = {
    "lakers": ["celtics", "clippers", "warriors"],
    "celtics": ["lakers", "76ers", "heat"],
    "warriors": ["lakers", "cavaliers", "clippers"],
    "bulls": ["pistons", "cavaliers", "heat"],
    "heat": ["celtics", "bulls", "knicks"],
    "knicks": ["nets", "heat", "pacers"],
    "nets": ["knicks", "76ers"],
    "76ers": ["celtics", "nets", "knicks"],
    "mavericks": ["spurs", "rockets"],
    "spurs": ["mavericks", "lakers", "rockets"],
    "rockets": ["mavericks", "spurs"],
    "clippers": ["lakers", "warriors"],
    "cavaliers": ["warriors", "bulls"],
    "pistons": ["bulls", "pacers"],
    "suns": ["lakers", "spurs"],
}

NFL_RIVALRIES = {
    "cowboys": ["eagles", "commanders", "giants", "49ers"],
    "eagles": ["cowboys", "giants", "commanders"],
    "giants": ["eagles", "cowboys", "commanders"],
    "commanders": ["cowboys", "eagles", "giants"],
    "packers": ["bears", "vikings", "lions"],
    "bears": ["packers", "vikings", "lions"],
    "vikings": ["packers", "bears", "lions"],
    "lions": ["packers", "bears", "vikings"],
    "49ers": ["seahawks", "rams", "cowboys"],
    "seahawks": ["49ers", "rams"],
    "rams": ["49ers", "seahawks"],
    "patriots": ["jets", "dolphins", "bills"],
    "jets": ["patriots", "dolphins", "giants"],
    "chiefs": ["raiders", "broncos", "chargers"],
    "raiders": ["chiefs", "broncos", "chargers"],
    "broncos": ["chiefs", "raiders", "chargers"],
    "steelers": ["ravens", "browns", "bengals"],
    "ravens": ["steelers", "browns", "bengals"],
    "browns": ["steelers", "ravens", "bengals"],
}

MLB_RIVALRIES = {
    "yankees": ["red sox", "mets", "dodgers"],
    "red sox": ["yankees", "rays"],
    "dodgers": ["giants", "padres", "yankees"],
    "giants": ["dodgers", "athletics", "padres"],
    "cubs": ["cardinals", "white sox", "brewers"],
    "cardinals": ["cubs", "brewers", "reds"],
    "white sox": ["cubs", "twins"],
    "mets": ["yankees", "phillies", "braves"],
    "phillies": ["mets", "braves"],
    "braves": ["mets", "phillies"],
    "astros": ["rangers", "dodgers"],
    "rangers": ["astros"],
}

NHL_RIVALRIES = {
    "rangers": ["islanders", "devils", "flyers"],
    "islanders": ["rangers", "devils"],
    "devils": ["rangers", "islanders", "flyers"],
    "flyers": ["penguins", "rangers", "devils"],
    "penguins": ["flyers", "capitals", "blue jackets"],
    "capitals": ["penguins", "rangers"],
    "bruins": ["canadiens", "maple leafs"],
    "canadiens": ["bruins", "maple leafs"],
    "maple leafs": ["bruins", "canadiens", "senators"],
    "blackhawks": ["red wings", "blues", "wild"],
    "red wings": ["blackhawks", "avalanche"],
    "avalanche": ["red wings", "wild"],
    "kings": ["ducks", "sharks"],
    "ducks": ["kings", "sharks"],
    "sharks": ["kings", "ducks", "golden knights"],
    "golden knights": ["sharks", "avalanche"],
}


# -----------------------------------------------------------------------------
# Data: Notable Music Context
# -----------------------------------------------------------------------------

# Artists known for exceptional live shows
EXCEPTIONAL_LIVE_PERFORMERS = [
    "beyonce", "taylor swift", "bruce springsteen", "foo fighters",
    "the rolling stones", "paul mccartney", "elton john", "adele",
    "bruno mars", "lady gaga", "kendrick lamar", "radiohead",
    "phish", "grateful dead", "dead & company", "pearl jam",
    "metallica", "iron maiden", "tool", "rammstein",
]

# Festival headliner context
MAJOR_FESTIVALS = ["coachella", "lollapalooza", "bonnaroo", "acl", "governors ball", "outside lands", "austin city limits"]


# -----------------------------------------------------------------------------
# Data: Theater Context
# -----------------------------------------------------------------------------

# Long-running Broadway shows (still running, iconic)
LONG_RUNNING_SHOWS = [
    "phantom of the opera", "the lion king", "wicked", "chicago",
    "hamilton", "the book of mormon", "hadestown", "mousetrap",
]

# Tony winners / critically acclaimed
TONY_WINNERS = [
    "hamilton", "dear evan hansen", "hadestown", "the band's visit",
    "a strange loop", "kimberly akimbo", "stereophonic",
]


# -----------------------------------------------------------------------------
# Data: Holidays & Special Dates
# -----------------------------------------------------------------------------

US_HOLIDAYS_2025_2027 = {
    # 2025
    "2025-01-01": "New Year's Day",
    "2025-01-20": "MLK Day",
    "2025-02-14": "Valentine's Day",
    "2025-05-26": "Memorial Day",
    "2025-07-04": "July 4th",
    "2025-09-01": "Labor Day",
    "2025-11-27": "Thanksgiving",
    "2025-12-25": "Christmas",
    "2025-12-31": "New Year's Eve",
    # 2026
    "2026-01-01": "New Year's Day",
    "2026-01-19": "MLK Day",
    "2026-02-14": "Valentine's Day",
    "2026-05-25": "Memorial Day",
    "2026-07-04": "July 4th",
    "2026-09-07": "Labor Day",
    "2026-11-26": "Thanksgiving",
    "2026-12-25": "Christmas",
    "2026-12-31": "New Year's Eve",
    # 2027
    "2027-01-01": "New Year's Day",
    "2027-01-18": "MLK Day",
    "2027-02-14": "Valentine's Day",
    "2027-05-31": "Memorial Day",
    "2027-07-04": "July 4th",
    "2027-09-06": "Labor Day",
    "2027-11-25": "Thanksgiving",
    "2027-12-25": "Christmas",
    "2027-12-31": "New Year's Eve",
}


# -----------------------------------------------------------------------------
# Insight Detection
# -----------------------------------------------------------------------------

@dataclass
class EventInsight:
    """A single insight about an event."""
    tag: str              # Short label: "🔥 Rivalry", "🎭 Tony Winner"
    explanation: str      # One sentence: "Lakers vs Celtics is a historic rivalry — expect high energy."
    priority: int         # Higher = more important (show first)
    category: str         # "rivalry", "timing", "experience", "practical"


def _normalize(text: str) -> str:
    """Lowercase, strip punctuation for matching."""
    return re.sub(r'[^a-z0-9\s]', '', (text or '').lower()).strip()


def _extract_teams_from_name(event_name: str) -> Tuple[Optional[str], Optional[str]]:
    """Try to extract two team names from an event like 'Lakers vs Celtics'."""
    normalized = _normalize(event_name)

    # Common patterns: "X vs Y", "X at Y", "X v Y"
    patterns = [
        r'(\w+)\s+(?:vs?|at|@)\s+(\w+)',
        r'(\w+)\s+versus\s+(\w+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, normalized)
        if match:
            return match.group(1), match.group(2)

    return None, None


def _is_rivalry(team1: str, team2: str, rivalry_dict: Dict[str, List[str]]) -> bool:
    """Check if two teams are rivals."""
    t1 = _normalize(team1)
    t2 = _normalize(team2)

    rivals_of_t1 = rivalry_dict.get(t1, [])
    rivals_of_t2 = rivalry_dict.get(t2, [])

    return t2 in rivals_of_t1 or t1 in rivals_of_t2


def _check_sports_rivalry(event_name: str, category: str) -> Optional[EventInsight]:
    """Check if this is a rivalry game."""
    team1, team2 = _extract_teams_from_name(event_name)
    if not team1 or not team2:
        return None

    # Check each league
    rivalry_dicts = [
        (NBA_RIVALRIES, "NBA"),
        (NFL_RIVALRIES, "NFL"),
        (MLB_RIVALRIES, "MLB"),
        (NHL_RIVALRIES, "NHL"),
    ]

    for rivalry_dict, league in rivalry_dicts:
        if _is_rivalry(team1, team2, rivalry_dict):
            return EventInsight(
                tag="🔥 Rivalry",
                explanation=f"{team1.title()} vs {team2.title()} is a historic rivalry — expect high energy and higher demand.",
                priority=90,
                category="rivalry",
            )

    return None


def _check_music_insight(event_name: str, artist_name: str = None) -> Optional[EventInsight]:
    """Check for music-related insights."""
    normalized = _normalize(event_name)
    artist = _normalize(artist_name) if artist_name else normalized

    # Check for exceptional live performers
    for performer in EXCEPTIONAL_LIVE_PERFORMERS:
        if performer in artist or performer in normalized:
            return EventInsight(
                tag="🎤 Must-see live",
                explanation=f"Known for incredible live performances — worth every penny.",
                priority=80,
                category="experience",
            )

    # Check for festival headliner
    for festival in MAJOR_FESTIVALS:
        if festival in normalized:
            if "headliner" in normalized or "headline" in normalized:
                return EventInsight(
                    tag="⭐ Headliner",
                    explanation="Headlining set — longest performance, biggest production.",
                    priority=75,
                    category="experience",
                )

    return None


def _check_theater_insight(event_name: str) -> Optional[EventInsight]:
    """Check for theater-related insights."""
    normalized = _normalize(event_name)

    # Check Tony winners first (higher priority)
    for show in TONY_WINNERS:
        if show in normalized:
            return EventInsight(
                tag="🏆 Tony Winner",
                explanation="Tony Award winner — critically acclaimed production.",
                priority=85,
                category="experience",
            )

    # Check long-running shows
    for show in LONG_RUNNING_SHOWS:
        if show in normalized:
            return EventInsight(
                tag="🎭 Broadway classic",
                explanation="Long-running hit — polished production, reliably great.",
                priority=70,
                category="experience",
            )

    return None


def _check_timing_insight(event_date: str, event_name: str) -> Optional[EventInsight]:
    """Check for timing-related insights (holidays, special dates)."""
    if not event_date:
        return None

    # Normalize date to YYYY-MM-DD
    date_str = event_date[:10] if len(event_date) >= 10 else event_date

    # Check holidays
    holiday = US_HOLIDAYS_2025_2027.get(date_str)
    if holiday:
        if holiday == "Valentine's Day":
            return EventInsight(
                tag="💕 Valentine's Day",
                explanation="Valentine's Day game — popular date night, book dinner early.",
                priority=85,
                category="timing",
            )
        elif holiday in ["Christmas", "Thanksgiving", "New Year's Eve", "New Year's Day"]:
            return EventInsight(
                tag=f"🎄 {holiday}",
                explanation=f"{holiday} event — special atmosphere, higher demand.",
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
                explanation=f"Holiday event ({holiday}) — may affect travel and availability.",
                priority=60,
                category="timing",
            )

    # Check for weekend (Fri/Sat)
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        if dt.weekday() == 4:  # Friday
            return EventInsight(
                tag="🌙 Friday night",
                explanation="Friday night — great energy, but book dinner ahead.",
                priority=40,
                category="timing",
            )
        elif dt.weekday() == 5:  # Saturday
            return EventInsight(
                tag="🎉 Saturday",
                explanation="Saturday event — peak atmosphere, higher prices.",
                priority=45,
                category="timing",
            )
    except:
        pass

    return None


def _check_name_keywords(event_name: str) -> Optional[EventInsight]:
    """Check for keywords in event name that signal something special."""
    normalized = _normalize(event_name)

    # Finals / Championships
    if "final" in normalized or "championship" in normalized:
        return EventInsight(
            tag="🏆 Championship",
            explanation="Championship/finals event — peak stakes, electric atmosphere.",
            priority=95,
            category="experience",
        )

    # Playoffs
    if "playoff" in normalized or "postseason" in normalized:
        return EventInsight(
            tag="🔥 Playoff game",
            explanation="Playoff intensity — every moment matters.",
            priority=90,
            category="experience",
        )

    # Opening night
    if "opening night" in normalized or "premiere" in normalized:
        return EventInsight(
            tag="✨ Opening Night",
            explanation="Opening night — first performance, special energy, often includes extras.",
            priority=85,
            category="timing",
        )

    # Farewell / Last
    if "farewell" in normalized or "final tour" in normalized or "last show" in normalized:
        return EventInsight(
            tag="👋 Farewell",
            explanation="Farewell performance — last chance to see them, high demand.",
            priority=95,
            category="timing",
        )

    # Sold out (if somehow in name)
    if "sold out" in normalized:
        return EventInsight(
            tag="🎟️ High demand",
            explanation="High demand event — resale prices may be elevated.",
            priority=70,
            category="practical",
        )

    return None


# -----------------------------------------------------------------------------
# Main Function
# -----------------------------------------------------------------------------

def get_event_insights(
    event_name: str,
    event_date: str = None,
    category: str = None,
    venue: str = None,
    artist: str = None,
    max_insights: int = 2,
) -> List[EventInsight]:
    """
    Get insights for an event.

    Returns up to max_insights insights, sorted by priority.
    Most events get 0-1 insights. Only truly special events get 2.

    Args:
        event_name: "Lakers vs Celtics" or "Taylor Swift" or "Hamilton"
        event_date: "2026-02-14" or ISO datetime
        category: "sports", "music", "theater" (helps narrow checks)
        venue: Venue name (for practical insights later)
        artist: Artist name if different from event_name
        max_insights: Cap on insights (default 2, to avoid being annoying)

    Returns:
        List of EventInsight, sorted by priority descending
    """
    insights: List[EventInsight] = []

    # Always check name keywords (finals, playoffs, farewell, etc.)
    kw_insight = _check_name_keywords(event_name)
    if kw_insight:
        insights.append(kw_insight)

    # Check timing
    timing_insight = _check_timing_insight(event_date, event_name)
    if timing_insight:
        insights.append(timing_insight)

    # Category-specific checks
    cat_lower = _normalize(category) if category else ""

    if cat_lower in ["sports", ""] or not category:
        rivalry = _check_sports_rivalry(event_name, category)
        if rivalry:
            insights.append(rivalry)

    if cat_lower in ["music", "concert", ""] or not category:
        music = _check_music_insight(event_name, artist)
        if music:
            insights.append(music)

    if cat_lower in ["theater", "theatre", "broadway", "arts", ""] or not category:
        theater = _check_theater_insight(event_name)
        if theater:
            insights.append(theater)

    # Sort by priority (highest first) and limit
    insights.sort(key=lambda x: x.priority, reverse=True)

    # Dedupe by category (only one per category)
    seen_categories = set()
    deduped = []
    for insight in insights:
        if insight.category not in seen_categories:
            deduped.append(insight)
            seen_categories.add(insight.category)

    return deduped[:max_insights]


def format_insights_for_response(insights: List[EventInsight]) -> Dict[str, Any]:
    """
    Format insights for API response.

    Returns:
        {
            "tags": ["🔥 Rivalry", "💕 Valentine's Day"],
            "explanation": "Lakers vs Celtics is a historic rivalry...",
            "has_insights": True
        }
    """
    if not insights:
        return {"tags": [], "explanation": None, "has_insights": False}

    tags = [i.tag for i in insights]

    # Use the highest priority insight's explanation
    explanation = insights[0].explanation if insights else None

    return {
        "tags": tags,
        "explanation": explanation,
        "has_insights": True,
    }


def enrich_events_with_insights(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Add insights to a list of events.

    Modifies events in place, adding:
        event["insights"] = {"tags": [...], "explanation": "...", "has_insights": bool}

    Returns the same list for chaining.
    """
    for event in events:
        insights = get_event_insights(
            event_name=event.get("name", ""),
            event_date=event.get("date") or event.get("dateTime"),
            category=event.get("category") or event.get("segment"),
            venue=event.get("venue"),
        )
        event["insights"] = format_insights_for_response(insights)

    return events

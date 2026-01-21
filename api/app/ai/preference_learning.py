"""
Preference Learning

Solves: "No reason to return - nothing learned about user preferences over time"

Seira gets smarter the more you use her:
- Remembers your favorite teams, artists, venues
- Learns your home city from context
- Tracks budget patterns
- Notes travel style (direct flights, specific airlines)
- Remembers cities you've visited

This creates a reason to return: "Seira knows me"

Data sources:
1. Explicit: User sets preferences in settings
2. Implicit: Learned from conversations and saved trips
3. Behavioral: What they search for, click on, save

Storage: Supabase user_learned_preferences table
"""

from __future__ import annotations

import logging
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Known entities for extraction
# -----------------------------------------------------------------------------

# Sports teams (expand as needed)
NBA_TEAMS = {
    "lakers", "celtics", "warriors", "bulls", "knicks", "nets", "heat", "suns",
    "mavericks", "mavs", "spurs", "clippers", "nuggets", "76ers", "sixers",
    "bucks", "raptors", "hawks", "cavaliers", "cavs", "thunder", "timberwolves",
    "pelicans", "grizzlies", "kings", "blazers", "jazz", "pacers", "pistons",
    "hornets", "wizards", "magic", "rockets",
}

NFL_TEAMS = {
    "chiefs", "eagles", "49ers", "niners", "cowboys", "bills", "ravens", "bengals",
    "lions", "dolphins", "jets", "patriots", "pats", "packers", "bears", "vikings",
    "commanders", "giants", "saints", "falcons", "buccaneers", "bucs", "panthers",
    "seahawks", "rams", "cardinals", "chargers", "raiders", "broncos", "texans",
    "colts", "jaguars", "titans", "steelers", "browns",
}

MLB_TEAMS = {
    "yankees", "dodgers", "red sox", "cubs", "mets", "phillies", "braves",
    "astros", "rangers", "padres", "giants", "angels", "mariners", "twins",
    "guardians", "tigers", "orioles", "rays", "blue jays", "white sox",
    "cardinals", "brewers", "reds", "pirates", "nationals", "marlins",
    "rockies", "diamondbacks", "athletics", "royals",
}

NHL_TEAMS = {
    "bruins", "rangers", "maple leafs", "leafs", "canadiens", "habs", "blackhawks",
    "red wings", "penguins", "flyers", "capitals", "caps", "lightning", "panthers",
    "hurricanes", "devils", "islanders", "blue jackets", "sabres", "senators",
    "oilers", "flames", "canucks", "jets", "wild", "avalanche", "stars", "blues",
    "predators", "coyotes", "golden knights", "knights", "kraken", "sharks", "kings", "ducks",
}

ALL_TEAMS = NBA_TEAMS | NFL_TEAMS | MLB_TEAMS | NHL_TEAMS

# Major cities
MAJOR_CITIES = {
    "new york", "nyc", "los angeles", "la", "chicago", "houston", "phoenix",
    "philadelphia", "san antonio", "san diego", "dallas", "san jose",
    "austin", "jacksonville", "fort worth", "columbus", "charlotte",
    "san francisco", "sf", "indianapolis", "seattle", "denver", "boston",
    "nashville", "detroit", "portland", "las vegas", "vegas", "memphis",
    "louisville", "baltimore", "milwaukee", "albuquerque", "tucson", "fresno",
    "sacramento", "atlanta", "miami", "oakland", "minneapolis", "tulsa",
    "cleveland", "pittsburgh", "st. louis", "st louis",
}

# Budget indicators
BUDGET_PATTERNS = {
    "cheap": "budget",
    "budget": "budget",
    "affordable": "budget",
    "inexpensive": "budget",
    "moderate": "moderate",
    "mid-range": "moderate",
    "nice": "premium",
    "premium": "premium",
    "luxury": "premium",
    "expensive": "premium",
    "best seats": "premium",
    "vip": "premium",
    "splurge": "premium",
}

# Travel style indicators
TRAVEL_STYLE_PATTERNS = {
    "direct": "prefers_direct",
    "nonstop": "prefers_direct",
    "no layovers": "prefers_direct",
    "early flight": "prefers_morning",
    "morning flight": "prefers_morning",
    "red eye": "prefers_redeye",
    "late flight": "prefers_evening",
    "evening flight": "prefers_evening",
    "aisle": "seat_aisle",
    "window": "seat_window",
    "business class": "cabin_business",
    "first class": "cabin_first",
}


# -----------------------------------------------------------------------------
# Preference Extraction
# -----------------------------------------------------------------------------

def extract_preferences_from_message(
    message: str,
    role: str = "user",
) -> Dict[str, Any]:
    """
    Extract preferences from a single message.

    Returns dict with:
    - teams: List of team names mentioned
    - artists: List of artist names mentioned (if detectable)
    - cities: List of cities mentioned
    - budget_style: "budget" | "moderate" | "premium" | None
    - travel_preferences: List of travel style indicators
    - home_city_hint: City that might be their home (from "I'm from...", "I live in...")
    """
    if role != "user":
        return {}

    text = message.lower()
    extracted = {
        "teams": [],
        "cities": [],
        "budget_style": None,
        "travel_preferences": [],
        "home_city_hint": None,
        "event_types": [],
    }

    # Extract teams
    for team in ALL_TEAMS:
        if team in text:
            extracted["teams"].append(team)

    # Extract cities
    for city in MAJOR_CITIES:
        if city in text:
            extracted["cities"].append(city)

    # Check for home city hints
    home_patterns = [
        r"i(?:'m| am) from ([a-z\s]+)",
        r"i live in ([a-z\s]+)",
        r"flying from ([a-z\s]+)",
        r"coming from ([a-z\s]+)",
        r"based in ([a-z\s]+)",
        r"my home (?:city |town |is )?([a-z\s]+)",
    ]
    for pattern in home_patterns:
        match = re.search(pattern, text)
        if match:
            potential_city = match.group(1).strip()
            # Check if it's a known city
            for city in MAJOR_CITIES:
                if city in potential_city or potential_city in city:
                    extracted["home_city_hint"] = city
                    break

    # Extract budget style
    for keyword, style in BUDGET_PATTERNS.items():
        if keyword in text:
            extracted["budget_style"] = style
            break

    # Extract travel preferences
    for keyword, pref in TRAVEL_STYLE_PATTERNS.items():
        if keyword in text:
            extracted["travel_preferences"].append(pref)

    # Extract event type preferences
    if any(word in text for word in ["concert", "show", "tour", "music", "band"]):
        extracted["event_types"].append("music")
    if any(word in text for word in ["game", "match", "sports", "basketball", "football", "baseball", "hockey"]):
        extracted["event_types"].append("sports")
    if any(word in text for word in ["play", "musical", "broadway", "theater", "theatre"]):
        extracted["event_types"].append("theater")
    if any(word in text for word in ["comedy", "standup", "stand-up", "comedian"]):
        extracted["event_types"].append("comedy")

    return extracted


def extract_preferences_from_conversation(
    messages: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Extract preferences from a full conversation.

    Aggregates all user messages and finds patterns.
    """
    all_teams: List[str] = []
    all_cities: List[str] = []
    all_event_types: List[str] = []
    all_travel_prefs: List[str] = []
    budget_mentions: List[str] = []
    home_hints: List[str] = []

    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")

        if role == "user" and content:
            extracted = extract_preferences_from_message(content, role)
            all_teams.extend(extracted.get("teams", []))
            all_cities.extend(extracted.get("cities", []))
            all_event_types.extend(extracted.get("event_types", []))
            all_travel_prefs.extend(extracted.get("travel_preferences", []))

            if extracted.get("budget_style"):
                budget_mentions.append(extracted["budget_style"])
            if extracted.get("home_city_hint"):
                home_hints.append(extracted["home_city_hint"])

    # Find most common values
    team_counts = Counter(all_teams)
    city_counts = Counter(all_cities)
    event_type_counts = Counter(all_event_types)
    travel_pref_counts = Counter(all_travel_prefs)
    budget_counts = Counter(budget_mentions)
    home_counts = Counter(home_hints)

    return {
        "favorite_teams": [t for t, _ in team_counts.most_common(5)],
        "interested_cities": [c for c, _ in city_counts.most_common(5)],
        "preferred_event_types": [e for e, _ in event_type_counts.most_common(3)],
        "travel_preferences": [p for p, _ in travel_pref_counts.most_common(3)],
        "budget_style": budget_counts.most_common(1)[0][0] if budget_counts else None,
        "likely_home_city": home_counts.most_common(1)[0][0] if home_counts else None,
    }


def extract_preferences_from_saved_trip(
    trip: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Extract preferences from a saved trip.

    What they actually booked tells us a lot.
    """
    extracted = {
        "visited_cities": [],
        "event_types": [],
        "venues": [],
        "budget_data": None,
        "travel_patterns": [],
    }

    # City they traveled to
    dest_city = trip.get("destination_city")
    if dest_city:
        extracted["visited_cities"].append(dest_city.lower())

    # Event type
    event_name = (trip.get("event_name") or "").lower()
    if any(word in event_name for word in ["vs", "game", "match"]):
        extracted["event_types"].append("sports")
    elif any(word in event_name for word in ["concert", "tour"]):
        extracted["event_types"].append("music")
    elif any(word in event_name for word in ["play", "musical"]):
        extracted["event_types"].append("theater")

    # Venue
    venue = trip.get("event_venue")
    if venue:
        extracted["venues"].append(venue)

    # Budget from actual spend
    total = trip.get("estimated_total")
    if total:
        extracted["budget_data"] = float(total)

    # Flight patterns
    carrier = trip.get("flight_carrier")
    if carrier:
        extracted["travel_patterns"].append(f"airline:{carrier}")

    return extracted


# -----------------------------------------------------------------------------
# Preference Storage (Supabase)
# -----------------------------------------------------------------------------

async def save_learned_preferences(
    user_id: str,
    preferences: Dict[str, Any],
) -> bool:
    """
    Save/update learned preferences to Supabase.

    Table: user_learned_preferences
    - user_id (uuid, FK to auth.users)
    - favorite_teams (text[])
    - favorite_artists (text[])
    - interested_cities (text[])
    - visited_cities (text[])
    - preferred_event_types (text[])
    - budget_style (text)
    - average_trip_spend (numeric)
    - travel_preferences (jsonb)
    - likely_home_city (text)
    - preferred_airlines (text[])
    - updated_at (timestamp)
    """
    try:
        from app.core.database import get_supabase
        sb = get_supabase()

        # Merge with existing preferences
        existing = await get_learned_preferences(user_id)

        merged = _merge_preferences(existing, preferences)
        merged["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Upsert
        result = sb.table("user_learned_preferences").upsert({
            "user_id": user_id,
            **merged,
        }).execute()

        return bool(result.data)

    except Exception as e:
        logger.warning(f"Failed to save learned preferences for {user_id}: {e}")
        return False


async def get_learned_preferences(user_id: str) -> Dict[str, Any]:
    """Get learned preferences from Supabase."""
    try:
        from app.core.database import get_supabase
        sb = get_supabase()

        result = sb.table("user_learned_preferences").select("*").eq("user_id", user_id).limit(1).execute()

        if result.data:
            return result.data[0]
        return {}

    except Exception as e:
        logger.debug(f"Could not fetch learned preferences for {user_id}: {e}")
        return {}


def _merge_preferences(
    existing: Dict[str, Any],
    new: Dict[str, Any],
) -> Dict[str, Any]:
    """Merge new preferences with existing, keeping most relevant."""
    merged = dict(existing)

    # Merge lists (unique, keep recent)
    list_fields = [
        "favorite_teams", "favorite_artists", "interested_cities",
        "visited_cities", "preferred_event_types", "preferred_airlines",
    ]

    for field in list_fields:
        existing_list = existing.get(field) or []
        new_list = new.get(field) or []
        # New items go first (more recent), then existing
        combined = list(dict.fromkeys(new_list + existing_list))  # Preserves order, removes dupes
        merged[field] = combined[:10]  # Keep top 10

    # Override simple fields if new value exists
    simple_fields = ["budget_style", "likely_home_city"]
    for field in simple_fields:
        if new.get(field):
            merged[field] = new[field]

    # Average budget (rolling average)
    if new.get("average_trip_spend"):
        old_avg = existing.get("average_trip_spend")
        if old_avg:
            merged["average_trip_spend"] = (old_avg + new["average_trip_spend"]) / 2
        else:
            merged["average_trip_spend"] = new["average_trip_spend"]

    # Merge travel preferences (jsonb)
    existing_travel = existing.get("travel_preferences") or {}
    new_travel = new.get("travel_preferences") or {}
    if isinstance(new_travel, list):
        # Convert list to dict
        new_travel = {p: True for p in new_travel}
    merged["travel_preferences"] = {**existing_travel, **new_travel}

    return merged


# -----------------------------------------------------------------------------
# Learning Triggers
# -----------------------------------------------------------------------------

async def learn_from_conversation(
    user_id: str,
    messages: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Learn preferences from a conversation and save them.

    Call this at end of conversation or periodically.
    Returns what was learned.
    """
    if not user_id or not messages:
        return {}

    extracted = extract_preferences_from_conversation(messages)

    # Only save if we learned something meaningful
    if any([
        extracted.get("favorite_teams"),
        extracted.get("likely_home_city"),
        extracted.get("budget_style"),
        extracted.get("preferred_event_types"),
    ]):
        await save_learned_preferences(user_id, extracted)
        logger.info(f"Learned preferences for user {user_id}: {list(extracted.keys())}")

    return extracted


async def learn_from_saved_trip(
    user_id: str,
    trip: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Learn preferences from a saved trip.

    Call this after save_trip succeeds.
    """
    if not user_id or not trip:
        return {}

    extracted = extract_preferences_from_saved_trip(trip)

    # Map to storage format
    to_save = {
        "visited_cities": extracted.get("visited_cities", []),
        "preferred_event_types": extracted.get("event_types", []),
    }

    if extracted.get("budget_data"):
        to_save["average_trip_spend"] = extracted["budget_data"]

    if extracted.get("travel_patterns"):
        # Extract airline preferences
        airlines = [p.split(":")[1] for p in extracted["travel_patterns"] if p.startswith("airline:")]
        if airlines:
            to_save["preferred_airlines"] = airlines

    await save_learned_preferences(user_id, to_save)
    logger.info(f"Learned from trip for user {user_id}")

    return to_save


# -----------------------------------------------------------------------------
# Preference Usage (for prompts/personalization)
# -----------------------------------------------------------------------------

def build_learned_context(preferences: Dict[str, Any]) -> Optional[str]:
    """
    Build context string from learned preferences for system prompt.
    """
    if not preferences:
        return None

    lines = ["## What You've Learned About This User", ""]
    has_content = False

    # Favorite teams
    teams = preferences.get("favorite_teams")
    if teams:
        lines.append(f"**Favorite teams:** {', '.join(teams[:3])}")
        lines.append("Prioritize these in search results. No need to announce it.")
        has_content = True

    # Visited cities
    visited = preferences.get("visited_cities")
    if visited:
        lines.append(f"**Cities visited:** {', '.join(visited[:5])}")
        lines.append("Can reference casually: 'heading back to LA?'")
        has_content = True

    # Likely home city
    home = preferences.get("likely_home_city")
    if home:
        lines.append(f"**Likely home city:** {home}")
        lines.append("Use as default origin if not set in preferences.")
        has_content = True

    # Event type preferences
    event_types = preferences.get("preferred_event_types")
    if event_types:
        lines.append(f"**Usually interested in:** {', '.join(event_types)}")
        has_content = True

    # Budget style
    budget = preferences.get("budget_style")
    if budget:
        lines.append(f"**Budget style:** {budget}")
        if budget == "budget":
            lines.append("Prioritize value options.")
        elif budget == "premium":
            lines.append("Can suggest premium options without hesitation.")
        has_content = True

    # Average spend
    avg_spend = preferences.get("average_trip_spend")
    if avg_spend:
        lines.append(f"**Typical trip spend:** ~${int(avg_spend)}")
        has_content = True

    if not has_content:
        return None

    lines.append("")
    lines.append("Use this knowledge naturally — don't announce 'I learned that you like...'")

    return "\n".join(lines)


def get_personalized_suggestions(preferences: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Generate personalized quick suggestions based on learned preferences.

    These become the "suggested prompts" in the UI.
    """
    suggestions = []

    # Team games
    teams = preferences.get("favorite_teams", [])
    for team in teams[:2]:
        suggestions.append({
            "label": f"{team.title()} games",
            "query": f"Find me {team.title()} games",
            "reason": "favorite_team",
        })

    # Visited cities (return trips)
    visited = preferences.get("visited_cities", [])
    for city in visited[:1]:
        suggestions.append({
            "label": f"Events in {city.title()}",
            "query": f"What's happening in {city.title()} this month?",
            "reason": "visited_city",
        })

    # Event type suggestions
    event_types = preferences.get("preferred_event_types", [])
    type_labels = {
        "sports": ("Sports this weekend", "Sports events this weekend"),
        "music": ("Concerts nearby", "Concerts near me this month"),
        "theater": ("Broadway shows", "Theater shows coming up"),
        "comedy": ("Comedy shows", "Stand-up comedy near me"),
    }
    for etype in event_types[:1]:
        if etype in type_labels:
            label, query = type_labels[etype]
            suggestions.append({
                "label": label,
                "query": query,
                "reason": "preferred_type",
            })

    return suggestions[:4]  # Max 4 suggestions

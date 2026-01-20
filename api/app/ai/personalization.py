"""
Personalization

Makes Seira feel like she knows you:
- Remembers favorite teams, artists, genres
- Knows your home city, preferred airports
- Tracks what you've booked before
- Tailors suggestions based on history
- Uses your name naturally (not robotically)

Data comes from:
1. User preferences (explicit - they set it)
2. Trip history (implicit - what they've booked)
3. Conversation patterns (implicit - what they ask about)

Philosophy:
- Personal, not creepy
- Helpful, not showy ("I remember you like...")
- Natural, not robotic
- Use info when relevant, don't force it
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Set
from collections import Counter


# -----------------------------------------------------------------------------
# User Profile
# -----------------------------------------------------------------------------

@dataclass
class UserProfile:
    """Everything we know about a user."""

    # Identity
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None

    # Explicit preferences (user-set)
    home_city: Optional[str] = None
    home_airport: Optional[str] = None
    preferred_airlines: List[str] = field(default_factory=list)
    seat_preference: Optional[str] = None  # "aisle", "window", "no preference"
    cabin_class: Optional[str] = None  # "economy", "premium_economy", "business", "first"
    budget_range: Optional[str] = None  # "budget", "moderate", "premium", "no limit"

    # Implicit preferences (learned from history)
    favorite_teams: List[str] = field(default_factory=list)
    favorite_artists: List[str] = field(default_factory=list)
    favorite_genres: List[str] = field(default_factory=list)
    favorite_venues: List[str] = field(default_factory=list)
    visited_cities: List[str] = field(default_factory=list)

    # Trip history summary
    total_trips: int = 0
    last_trip_date: Optional[str] = None
    most_visited_city: Optional[str] = None
    avg_trip_budget: Optional[float] = None

    # Event type preferences (learned)
    preferred_event_types: List[str] = field(default_factory=list)  # ["sports", "music", "theater"]
    preferred_days: List[str] = field(default_factory=list)  # ["friday", "saturday"]
    prefers_evening_events: bool = True

    def has_preferences(self) -> bool:
        """Check if we have any meaningful preferences."""
        return bool(
            self.home_city or
            self.favorite_teams or
            self.favorite_artists or
            self.total_trips > 0
        )

    def get_first_name(self) -> Optional[str]:
        """Get first name for natural use."""
        if not self.name:
            return None
        return self.name.split()[0]


# -----------------------------------------------------------------------------
# Build Profile from Data
# -----------------------------------------------------------------------------

def build_user_profile(
    user_id: str,
    user_data: Dict[str, Any] = None,
    preferences: Dict[str, Any] = None,
    trip_history: List[Dict[str, Any]] = None,
) -> UserProfile:
    """
    Build a complete user profile from available data.

    Args:
        user_id: The user's ID
        user_data: Basic user info (name, email)
        preferences: Explicit preferences from DB
        trip_history: Past trips for learning implicit preferences

    Returns:
        UserProfile with all known information
    """
    profile = UserProfile(user_id=user_id)

    # Basic info
    if user_data:
        profile.name = user_data.get("name") or user_data.get("full_name")
        profile.email = user_data.get("email")

    # Explicit preferences
    if preferences:
        profile.home_city = preferences.get("home_city")
        profile.home_airport = preferences.get("home_airport")
        profile.preferred_airlines = preferences.get("preferred_airlines") or []
        profile.seat_preference = preferences.get("seat_preference")
        profile.cabin_class = preferences.get("cabin_class")
        profile.budget_range = preferences.get("budget_range")

    # Learn from trip history
    if trip_history:
        profile = _learn_from_trips(profile, trip_history)

    return profile


def _learn_from_trips(profile: UserProfile, trips: List[Dict[str, Any]]) -> UserProfile:
    """Extract implicit preferences from trip history."""

    if not trips:
        return profile

    profile.total_trips = len(trips)

    # Track frequencies
    teams: Counter = Counter()
    artists: Counter = Counter()
    genres: Counter = Counter()
    venues: Counter = Counter()
    cities: Counter = Counter()
    event_types: Counter = Counter()
    days: Counter = Counter()
    budgets: List[float] = []

    latest_date = None

    for trip in trips:
        # Track date
        trip_date = trip.get("event_date") or trip.get("created_at")
        if trip_date:
            if not latest_date or trip_date > latest_date:
                latest_date = trip_date

        # Track event details
        event_name = (trip.get("event_name") or "").lower()
        event_type = trip.get("event_type") or trip.get("category")
        venue = trip.get("event_venue") or trip.get("venue")
        city = trip.get("destination_city") or trip.get("city")

        if event_type:
            event_types[event_type.lower()] += 1

        if venue:
            venues[venue] += 1

        if city:
            cities[city] += 1

        # Extract day of week
        if trip_date:
            try:
                dt = datetime.fromisoformat(trip_date.replace("Z", "+00:00"))
                day_name = dt.strftime("%A").lower()
                days[day_name] += 1
            except:
                pass

        # Track budget
        total = trip.get("estimated_total") or trip.get("total_cost")
        if total:
            try:
                budgets.append(float(total))
            except:
                pass

        # Try to extract team/artist from event name
        # This is fuzzy - just looking for patterns
        if event_type == "sports" or "vs" in event_name or "at" in event_name:
            # Likely a sports game - extract team names
            parts = event_name.replace(" at ", " vs ").split(" vs ")
            for part in parts:
                team = part.strip()
                if team and len(team) > 2:
                    teams[team] += 1
        elif event_type == "music" or "concert" in event_name or "tour" in event_name:
            # Likely a concert - the event name might be the artist
            artist = event_name.replace("concert", "").replace("tour", "").strip()
            if artist and len(artist) > 2:
                artists[artist] += 1

    # Set most common values
    profile.favorite_teams = [t for t, _ in teams.most_common(3)]
    profile.favorite_artists = [a for a, _ in artists.most_common(3)]
    profile.favorite_venues = [v for v, _ in venues.most_common(3)]
    profile.visited_cities = [c for c, _ in cities.most_common(5)]
    profile.preferred_event_types = [e for e, _ in event_types.most_common(3)]
    profile.preferred_days = [d for d, _ in days.most_common(2)]

    if cities:
        profile.most_visited_city = cities.most_common(1)[0][0]

    if latest_date:
        profile.last_trip_date = latest_date

    if budgets:
        profile.avg_trip_budget = sum(budgets) / len(budgets)

    # Infer evening preference
    # (Most events are evening, so this is a soft signal)
    profile.prefers_evening_events = True

    return profile


# -----------------------------------------------------------------------------
# Personalized Suggestions
# -----------------------------------------------------------------------------

def get_personalized_suggestions(profile: UserProfile) -> List[Dict[str, str]]:
    """
    Generate personalized event suggestions based on profile.

    Returns suggestions that feel natural:
    - "Lakers game" if they're a Lakers fan
    - "Another show at MSG" if they've been there before
    """
    suggestions: List[Dict[str, str]] = []

    # Favorite teams
    for team in profile.favorite_teams[:2]:
        suggestions.append({
            "label": f"{team.title()} game",
            "value": f"Find me {team.title()} games",
            "reason": "favorite_team",
        })

    # Favorite artists
    for artist in profile.favorite_artists[:2]:
        suggestions.append({
            "label": f"{artist.title()} tickets",
            "value": f"Find {artist.title()} concerts",
            "reason": "favorite_artist",
        })

    # Favorite venue
    if profile.favorite_venues:
        venue = profile.favorite_venues[0]
        suggestions.append({
            "label": f"Events at {venue}",
            "value": f"What's coming up at {venue}?",
            "reason": "favorite_venue",
        })

    # Home city events
    if profile.home_city:
        suggestions.append({
            "label": f"Events in {profile.home_city}",
            "value": f"What's happening in {profile.home_city} this weekend?",
            "reason": "home_city",
        })

    # Visited city they might want to return to
    for city in profile.visited_cities[:1]:
        if city != profile.home_city:
            suggestions.append({
                "label": f"Back to {city}",
                "value": f"Find events in {city}",
                "reason": "visited_city",
            })

    return suggestions[:4]  # Max 4 suggestions


# -----------------------------------------------------------------------------
# Personalized Context for Prompts
# -----------------------------------------------------------------------------

def build_personalization_context(profile: UserProfile) -> str:
    """
    Build context string to inject into the system prompt.

    This tells Claude what it knows about the user so it can
    personalize responses naturally.
    """
    if not profile.has_preferences():
        return ""

    lines = ["## What You Know About This User", ""]

    # Name
    first_name = profile.get_first_name()
    if first_name:
        lines.append(f"**Name:** {first_name}")
        lines.append(f"Use their name occasionally — not every message, but when it feels natural (greetings, confirmations).")
        lines.append("")

    # Home base
    if profile.home_city or profile.home_airport:
        home = profile.home_city or ""
        if profile.home_airport:
            home = f"{home} ({profile.home_airport})".strip(" ()")
        lines.append(f"**Home base:** {home}")
        lines.append("Use this as default origin for flights. Don't ask where they're flying from — you know.")
        lines.append("")

    # Favorites
    favorites = []
    if profile.favorite_teams:
        teams = ", ".join(t.title() for t in profile.favorite_teams[:3])
        favorites.append(f"Teams: {teams}")
    if profile.favorite_artists:
        artists = ", ".join(a.title() for a in profile.favorite_artists[:3])
        favorites.append(f"Artists: {artists}")
    if profile.favorite_venues:
        venues = ", ".join(profile.favorite_venues[:2])
        favorites.append(f"Venues: {venues}")

    if favorites:
        lines.append("**Favorites:**")
        for f in favorites:
            lines.append(f"- {f}")
        lines.append("")
        lines.append("Reference these naturally when relevant. Don't say 'I see you like the Lakers' — just prioritize Lakers results or mention 'another Lakers game' casually.")
        lines.append("")

    # Travel preferences
    travel_prefs = []
    if profile.cabin_class and profile.cabin_class != "economy":
        travel_prefs.append(f"Cabin: {profile.cabin_class}")
    if profile.seat_preference:
        travel_prefs.append(f"Seat: {profile.seat_preference}")
    if profile.preferred_airlines:
        airlines = ", ".join(profile.preferred_airlines[:2])
        travel_prefs.append(f"Airlines: {airlines}")

    if travel_prefs:
        lines.append("**Travel preferences:**")
        for p in travel_prefs:
            lines.append(f"- {p}")
        lines.append("")
        lines.append("Apply these automatically when searching flights. Don't ask about cabin class — use their preference.")
        lines.append("")

    # Budget
    if profile.budget_range:
        lines.append(f"**Budget style:** {profile.budget_range}")
        if profile.budget_range == "budget":
            lines.append("Prioritize value. Mention cheaper options first.")
        elif profile.budget_range == "premium":
            lines.append("Prioritize experience over price. Don't lead with 'budget options'.")
        lines.append("")

    # Trip history
    if profile.total_trips > 0:
        lines.append(f"**Trip history:** {profile.total_trips} trips planned")
        if profile.most_visited_city:
            lines.append(f"Most visited: {profile.most_visited_city}")
        if profile.avg_trip_budget:
            lines.append(f"Average spend: ~${int(profile.avg_trip_budget)}")
        lines.append("")

    # How to use this
    lines.append("**How to be personal (not creepy):**")
    lines.append("- Use their preferences automatically, don't announce them")
    lines.append("- Reference past trips casually: 'heading back to LA?' not 'I see you've been to LA 3 times'")
    lines.append("- If showing their favorite team/artist, no need to explain why — just show it")
    lines.append("- Use their name in greetings and confirmations, not every message")
    lines.append("- If they ask for something outside their usual preferences, don't question it")

    return "\n".join(lines)


# -----------------------------------------------------------------------------
# Personalized Responses
# -----------------------------------------------------------------------------

def personalize_greeting(profile: UserProfile, time_of_day: str = None) -> str:
    """
    Generate a personalized greeting.

    Args:
        profile: User profile
        time_of_day: "morning", "afternoon", "evening", or None for auto

    Returns:
        A natural greeting string
    """
    first_name = profile.get_first_name()

    # Determine time of day
    if not time_of_day:
        hour = datetime.now(timezone.utc).hour
        if hour < 12:
            time_of_day = "morning"
        elif hour < 17:
            time_of_day = "afternoon"
        else:
            time_of_day = "evening"

    # Build greeting
    greetings = []

    if first_name:
        if time_of_day == "morning":
            greetings = [
                f"Morning, {first_name}!",
                f"Hey {first_name}!",
                f"Hi {first_name}!",
            ]
        elif time_of_day == "evening":
            greetings = [
                f"Hey {first_name}!",
                f"Evening, {first_name}!",
                f"Hi {first_name}!",
            ]
        else:
            greetings = [
                f"Hey {first_name}!",
                f"Hi {first_name}!",
            ]
    else:
        greetings = ["Hey!", "Hi!", "Hello!"]

    # Pick one (could randomize, but keeping it simple)
    return greetings[0]


def personalize_event_response(
    profile: UserProfile,
    events: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Add personalization signals to event results.

    Returns:
        {
            "events": [...],  # events with personalization flags
            "personal_note": "...",  # optional note to include
            "featured_event_id": "...",  # event to highlight (if matches preferences)
        }
    """
    if not events:
        return {"events": [], "personal_note": None, "featured_event_id": None}

    featured_id = None
    personal_note = None

    # Check if any event matches their favorites
    favorite_teams_lower = [t.lower() for t in profile.favorite_teams]
    favorite_artists_lower = [a.lower() for a in profile.favorite_artists]
    favorite_venues_lower = [v.lower() for v in profile.favorite_venues]

    for event in events:
        event_name = (event.get("name") or "").lower()
        venue = (event.get("venue") or "").lower()

        # Check for favorite team
        for team in favorite_teams_lower:
            if team in event_name:
                event["_personal"] = {
                    "is_favorite": True,
                    "reason": "favorite_team",
                }
                if not featured_id:
                    featured_id = event.get("id")
                    personal_note = f"Your {team.title()} are playing"
                break

        # Check for favorite artist
        for artist in favorite_artists_lower:
            if artist in event_name:
                event["_personal"] = {
                    "is_favorite": True,
                    "reason": "favorite_artist",
                }
                if not featured_id:
                    featured_id = event.get("id")
                break

        # Check for favorite venue
        for fav_venue in favorite_venues_lower:
            if fav_venue in venue:
                event["_personal"] = event.get("_personal", {})
                event["_personal"]["favorite_venue"] = True
                break

    return {
        "events": events,
        "personal_note": personal_note,
        "featured_event_id": featured_id,
    }


def get_welcome_back_message(profile: UserProfile) -> Optional[str]:
    """
    Generate a welcome back message for returning users.

    Returns None for new users or if no meaningful message.
    """
    if profile.total_trips == 0:
        return None

    first_name = profile.get_first_name()
    name_part = f", {first_name}" if first_name else ""

    # Check if they have a recent trip
    if profile.last_trip_date:
        try:
            last_trip = datetime.fromisoformat(profile.last_trip_date.replace("Z", "+00:00"))
            days_ago = (datetime.now(timezone.utc) - last_trip).days

            if days_ago < 7:
                return f"Welcome back{name_part}! How was the trip?"
            elif days_ago < 30:
                return f"Hey{name_part}! Ready for another adventure?"
        except:
            pass

    # Generic returning user
    if profile.total_trips >= 5:
        return f"Hey{name_part}! Good to see you again."

    return None

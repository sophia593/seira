"""
Event Curation Policy

Goal:
- Stop dumping long lists (feels random)
- Avoid stupid clarifying questions like "what year?"
- Default to the next upcoming event year based on today's date
- For US Open finals: always show Men's + Women's finals first
- Rank by "most popular" when possible, and bias toward best experience
- Provide exactly 4 clear next options for UI + chat
- Provide a graceful fallback when ticket search fails or times out
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import re


# -----------------------------
# Helpers
# -----------------------------

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _parse_iso(dt_str: str | None) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None

def _days_from_now(dt: Optional[datetime], now: datetime) -> float:
    if not dt:
        return 9999.0
    return (dt - now).total_seconds() / 86400.0

def _safe_lower(s: str | None) -> str:
    return (s or "").strip().lower()

def _extract_city(ev: Dict[str, Any]) -> str:
    try:
        venues = ev.get("_embedded", {}).get("venues", []) or []
        return (venues[0].get("city", {}) or {}).get("name") or ""
    except Exception:
        return ""

def _extract_venue(ev: Dict[str, Any]) -> str:
    try:
        venues = ev.get("_embedded", {}).get("venues", []) or []
        return venues[0].get("name") or ""
    except Exception:
        return ""

def _extract_start_dt(ev: Dict[str, Any]) -> Optional[datetime]:
    return _parse_iso((ev.get("dates", {}) or {}).get("start", {}).get("dateTime"))

def _extract_popularity(ev: Dict[str, Any]) -> float:
    # Ticketmaster sometimes has "score" from discovery; sometimes not.
    val = ev.get("score") or ev.get("popularity")
    try:
        return float(val)
    except Exception:
        return 0.0

def _extract_min_price(ev: Dict[str, Any]) -> Optional[float]:
    # Ticketmaster priceRanges: [{min, max, currency}]
    try:
        prs = ev.get("priceRanges") or []
        if not prs:
            return None
        m = prs[0].get("min")
        return float(m) if m is not None else None
    except Exception:
        return None

def _dedupe_key(ev: Dict[str, Any]) -> Tuple[str, str]:
    name = _safe_lower(ev.get("name"))
    dt = (ev.get("dates", {}) or {}).get("start", {}).get("dateTime") or ""
    return (name, dt)

def _contains_any(text: str, words: List[str]) -> bool:
    t = _safe_lower(text)
    return any(w in t for w in words)

def _user_explicitly_mentioned_year(text: str) -> Optional[int]:
    m = re.search(r"\b(20\d{2})\b", text)
    if not m:
        return None
    try:
        return int(m.group(1))
    except Exception:
        return None


# -----------------------------
# "Special intent": US Open Finals
# -----------------------------

US_OPEN_ALIASES = [
    "us open",
    "u.s. open",
    "usta",
    "billie jean king",
    "arthur ashe",
]

def is_us_open_finals_intent(user_text: str) -> bool:
    t = _safe_lower(user_text)
    if "final" not in t and "finals" not in t:
        return False
    return any(alias in t for alias in US_OPEN_ALIASES) or ("us open" in t)

def assumed_us_open_year(now: datetime, user_text: str) -> int:
    """
    Default logic:
    - If user explicitly says a year, use it.
    - Otherwise assume the next upcoming US Open season automatically.
    US Open finals are late Aug / early Sep. If we are past mid-Sep, assume next year.
    """
    explicit = _user_explicitly_mentioned_year(user_text)
    if explicit:
        return explicit

    # If today is after Sep 15, assume next year; otherwise current year.
    if (now.month > 9) or (now.month == 9 and now.day >= 15):
        return now.year + 1
    return now.year

def us_open_default_options(year: int) -> List[Dict[str, str]]:
    """
    Exactly 4 options, matching what you asked for.
    Men's and Women's finals first.
    """
    return [
        {"label": f"Men's Singles Final ({year})", "value": f"Show me tickets for the US Open Men's Singles Final {year}"},
        {"label": f"Women's Singles Final ({year})", "value": f"Show me tickets for the US Open Women's Singles Final {year}"},
        {"label": f"Best finals option ({year})", "value": f"Pick the best US Open finals experience for {year} (best seats/atmosphere)"},
        {"label": "Weekend plan (finals weekend)", "value": f"Help me plan a finals weekend trip for the US Open {year}"},
    ]


# -----------------------------
# Curation + ranking
# -----------------------------

@dataclass
class CuratedEvent:
    id: str
    name: str
    dateTime: Optional[str]
    city: str
    venue: str
    url: Optional[str]
    min_price: Optional[float]
    why: List[str]
    score: float

def _why(ev: Dict[str, Any], now: datetime, year_hint: Optional[int] = None) -> List[str]:
    reasons: List[str] = []

    name = ev.get("name") or ""
    venue = _extract_venue(ev)
    dt = _extract_start_dt(ev)
    pop = _extract_popularity(ev)
    min_price = _extract_min_price(ev)

    # Best experience signals
    if _contains_any(name, ["final", "championship"]):
        reasons.append("Top-tier experience (final)")

    if venue and _contains_any(venue, ["arthur ashe", "stadium"]):
        reasons.append("Main stadium / best atmosphere")

    # Popularity signal
    if pop >= 0.5:
        reasons.append("Most popular match for your search")

    # Time signal
    if dt:
        days = _days_from_now(dt, now)
        if days < 21:
            reasons.append("Coming up soon")

    # Budget-aware note without being "cheap-first"
    if min_price is not None:
        if min_price <= 150:
            reasons.append("Good value tickets available")
        else:
            reasons.append("Premium-priced (best experience likely)")

    if not reasons:
        reasons.append("Best match for your request")

    return reasons[:3]  # keep it short

def _experience_score(ev: Dict[str, Any]) -> float:
    """
    Score signals for "best experience" (not just cheapest).
    """
    name = _safe_lower(ev.get("name"))
    venue = _safe_lower(_extract_venue(ev))

    score = 0.0
    if "final" in name or "championship" in name:
        score += 5.0
    if "arthur ashe" in venue:
        score += 3.0
    if "stadium" in venue:
        score += 1.0
    return score

def _budget_penalty(ev: Dict[str, Any]) -> float:
    """
    Keep budget in mind, but do NOT optimize purely for cheap.
    Penalize only extreme prices.
    """
    p = _extract_min_price(ev)
    if p is None:
        return 0.0
    if p <= 200:
        return 0.0
    if p <= 500:
        return 0.5
    return 1.5  # very expensive

def curate_events_v2(
    events: List[Dict[str, Any]],
    user_text: str,
    max_results: int = 5,
) -> List[CuratedEvent]:
    """
    Enhanced curation that works on raw Ticketmaster response events.
    Biases toward best experience, popularity, and upcoming dates.
    """
    now = _now_utc()

    # Dedupe
    seen = set()
    unique: List[Dict[str, Any]] = []
    for ev in events or []:
        k = _dedupe_key(ev)
        if k in seen:
            continue
        seen.add(k)
        unique.append(ev)

    # If US Open finals intent, bias toward finals
    us_open = is_us_open_finals_intent(user_text)

    scored: List[Tuple[float, Dict[str, Any]]] = []
    for ev in unique:
        pop = _extract_popularity(ev)
        dt = _extract_start_dt(ev)
        days = _days_from_now(dt, now)
        experience = _experience_score(ev)
        penalty = _budget_penalty(ev)

        # "Soon-ish" boost, but don't over-penalize missing dates
        soon_boost = 0.0
        if dt:
            # 0..3 boost for being within ~30 days
            soon_boost = max(0.0, 3.0 - min(days / 10.0, 3.0))

        # US Open finals: boost finals matches hard
        finals_boost = 0.0
        name = _safe_lower(ev.get("name"))
        if us_open and ("final" in name or "championship" in name):
            finals_boost = 4.0

        # Total score:
        # - Popularity matters (your #4)
        # - Experience matters most (your #5)
        # - Budget is a light penalty (keep in mind)
        score = 0.0
        score += experience * 1.2
        score += pop * 2.0
        score += soon_boost
        score += finals_boost
        score -= penalty

        scored.append((score, ev))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:max_results]

    curated: List[CuratedEvent] = []
    for score, ev in top:
        curated.append(
            CuratedEvent(
                id=str(ev.get("id") or ""),
                name=str(ev.get("name") or ""),
                dateTime=(ev.get("dates", {}) or {}).get("start", {}).get("dateTime"),
                city=_extract_city(ev),
                venue=_extract_venue(ev),
                url=ev.get("url"),
                min_price=_extract_min_price(ev),
                why=_why(ev, now),
                score=float(score),
            )
        )
    return curated


# -----------------------------
# Fallback policy when search fails / times out
# -----------------------------

def fallback_response_for_user(user_text: str) -> Optional[Dict[str, Any]]:
    """
    If tools fail, DO NOT dead-end with "no events found".
    Instead: assume sensible defaults and offer 4 options.
    """
    now = _now_utc()

    if is_us_open_finals_intent(user_text):
        year = assumed_us_open_year(now, user_text)
        return {
            "type": "fallback",
            "title": f"US Open Finals ({year})",
            "message": (
                "Tickets can be slow to load sometimes. "
                "Meanwhile, here are the best finals options to choose from."
            ),
            "options": us_open_default_options(year),
            "assumed_year": year,
            "assumption_note": "Assuming the next upcoming US Open season based on today's date.",
        }

    return None


# -----------------------------
# Formatting helpers for UI + chat
# -----------------------------

def curated_events_to_cards(curated: List[CuratedEvent]) -> List[Dict[str, Any]]:
    cards: List[Dict[str, Any]] = []
    for ev in curated:
        cards.append({
            "id": ev.id,
            "name": ev.name,
            "dateTime": ev.dateTime,
            "city": ev.city,
            "venue": ev.venue,
            "url": ev.url,
            "min_price": ev.min_price,
            "why": ev.why,
        })
    return cards

def options_as_chat_text(options: List[Dict[str, str]]) -> str:
    # exactly 4 lines if available
    lines = ["Options:"]
    for i, opt in enumerate(options[:4], start=1):
        lines.append(f"{i}) {opt['label']}")
    return "\n".join(lines)


# -----------------------------
# Year assumption for any seasonal event
# -----------------------------

# Common seasonal events and their typical month ranges
SEASONAL_EVENTS = {
    "us open": {"start_month": 8, "end_month": 9, "end_day": 15},  # late Aug - early Sep
    "super bowl": {"start_month": 2, "end_month": 2, "end_day": 15},  # early Feb
    "march madness": {"start_month": 3, "end_month": 4, "end_day": 10},  # Mar-Apr
    "ncaa tournament": {"start_month": 3, "end_month": 4, "end_day": 10},
    "world series": {"start_month": 10, "end_month": 11, "end_day": 5},  # late Oct
    "nba finals": {"start_month": 6, "end_month": 6, "end_day": 25},  # June
    "stanley cup": {"start_month": 6, "end_month": 6, "end_day": 25},  # June
    "wimbledon": {"start_month": 7, "end_month": 7, "end_day": 15},  # early July
    "french open": {"start_month": 5, "end_month": 6, "end_day": 10},  # late May - early Jun
    "australian open": {"start_month": 1, "end_month": 1, "end_day": 31},  # Jan
    "masters": {"start_month": 4, "end_month": 4, "end_day": 15},  # early Apr (golf)
    "kentucky derby": {"start_month": 5, "end_month": 5, "end_day": 10},  # first Sat in May
    "indy 500": {"start_month": 5, "end_month": 5, "end_day": 31},  # late May
    "daytona 500": {"start_month": 2, "end_month": 2, "end_day": 28},  # mid Feb
}

def assumed_event_year(user_text: str) -> int:
    """
    For any seasonal event, assume the next upcoming occurrence.
    If user explicitly mentions a year, use that instead.
    """
    now = _now_utc()

    # Check if user explicitly said a year
    explicit = _user_explicitly_mentioned_year(user_text)
    if explicit:
        return explicit

    text_lower = _safe_lower(user_text)

    # Check against known seasonal events
    for event_name, timing in SEASONAL_EVENTS.items():
        if event_name in text_lower:
            end_month = timing["end_month"]
            end_day = timing["end_day"]

            # If we're past the event's end date, assume next year
            if (now.month > end_month) or (now.month == end_month and now.day > end_day):
                return now.year + 1
            return now.year

    # Default: current year
    return now.year

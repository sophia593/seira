"""
Event Recommendations

Turns a list of events into:
- 3 recommended picks (curated)
- up to N additional options
- clear "why this one" bullets
- a fallback "show me more" path

Design goals:
- Don't overwhelm
- Be opinionated
- Still allow the user to browse more
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import re
import statistics

from app.ai.travel_confidence import evaluate_ticket_options
from app.ai.event_insights import get_event_insights, format_insights_for_response


# -----------------------
# Helpers
# -----------------------

def _safe_lower(s: str | None) -> str:
    return (s or "").lower().strip()

def _parse_iso(dt: str | None) -> Optional[datetime]:
    if not dt:
        return None
    try:
        return datetime.fromisoformat(dt.replace("Z", "+00:00"))
    except Exception:
        return None

def _extract_price_min(e: Dict[str, Any]) -> Optional[float]:
    p = e.get("min_price")
    if p is None:
        p = e.get("price_min")
    if p is None:
        p = e.get("minPrice")
    if p is None:
        return None
    try:
        return float(p)
    except Exception:
        return None

def _extract_datetime(e: Dict[str, Any]) -> Optional[str]:
    # support different normalizers
    return (
        e.get("dateTime")
        or e.get("datetime")
        or e.get("date_time")
        or e.get("date")
        or (e.get("dates", {}) or {}).get("start", {}).get("dateTime")
    )

def _extract_city(e: Dict[str, Any]) -> str:
    return (
        e.get("city")
        or (e.get("venue", {}) or {}).get("city")
        or (e.get("_embedded", {}) or {}).get("venues", [{}])[0].get("city", {}).get("name")
        or ""
    )

def _extract_venue(e: Dict[str, Any]) -> str:
    return (
        e.get("venue")
        if isinstance(e.get("venue"), str)
        else (e.get("venue", {}) or {}).get("name")
        or (e.get("_embedded", {}) or {}).get("venues", [{}])[0].get("name")
        or ""
    )

def _normalize_event(e: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure we have fields used by confidence + insights.
    We do NOT mutate input; we create a normalized copy.
    """
    out = dict(e)
    out.setdefault("name", e.get("name") or "")
    out.setdefault("dateTime", _extract_datetime(e))
    out.setdefault("min_price", _extract_price_min(e))
    out.setdefault("city", _extract_city(e))
    out.setdefault("venue_name", _extract_venue(e))
    return out


# -----------------------
# Scoring
# -----------------------

def _median(values: List[float]) -> float:
    if not values:
        return 0.0
    return float(statistics.median(values))

def _timing_bonus(dt: Optional[datetime]) -> float:
    """
    Lightweight: weekends slightly more "experience", weekdays slightly less.
    (We can evolve this later.)
    """
    if not dt:
        return 0.0
    # 5=Sat, 6=Sun
    if dt.weekday() in (5, 6):
        return 0.6
    # Friday
    if dt.weekday() == 4:
        return 0.4
    return 0.0

def _query_match_bonus(event_name: str, user_query: str) -> float:
    """
    If user asked for something specific ("Lakers game", "US Open final"),
    reward name matches.
    """
    q = _safe_lower(user_query)
    n = _safe_lower(event_name)
    if not q or not n:
        return 0.0

    # if multiple words, reward partial matches
    words = [w for w in re.split(r"\s+", q) if w]
    hits = sum(1 for w in words if len(w) >= 3 and w in n)
    if hits == 0:
        return 0.0
    if hits >= 3:
        return 2.0
    return 1.0


def recommend_events(
    raw_events: List[Dict[str, Any]],
    user_query: str,
    user_budget: Optional[float] = None,
    max_total: int = 7,
    top_n: int = 3,
) -> Dict[str, Any]:
    """
    Returns:
      {
        "top_picks": [event...],        # 3 curated
        "more_options": [event...],     # remaining up to max_total
        "copy": {
          "headline": str,
          "why_this_format": str
        }
      }

    Each event includes:
      event["recommendation"] = { score, reasons[] }
      event["insights"] = {...} (tags + explanation)
      event["ticket_confidence"] = {...} (price label + budget note)
    """
    events = [_normalize_event(e) for e in (raw_events or [])]
    events = [e for e in events if e.get("id") and e.get("name")]

    if not events:
        return {"top_picks": [], "more_options": [], "copy": {"headline": "I didn't find good matches.", "why_this_format": ""}}

    # Ticket confidence (price labels + budget note)
    ticket_eval = evaluate_ticket_options(events, user_budget=user_budget)
    ticket_cards = {c["id"]: c for c in ticket_eval.get("cards", [])}

    # Build scores
    prices = [p for p in (_extract_price_min(e) for e in events) if p is not None]
    med_price = _median(prices) if prices else 0.0

    scored: List[Tuple[float, Dict[str, Any]]] = []

    for e in events:
        eid = str(e["id"])
        name = str(e.get("name") or "")
        dt = _parse_iso(e.get("dateTime"))

        score = 0.0
        reasons: List[str] = []

        # 1) Relevance to query (huge)
        qb = _query_match_bonus(name, user_query)
        score += qb
        if qb >= 2:
            reasons.append("Best match for what you asked")

        # 2) Insights (rivalry, finals, opening night, etc.)
        insights = get_event_insights(
            event_name=name,
            event_date=e.get("dateTime") or e.get("date"),
            max_insights=2,
        )
        e["insights"] = format_insights_for_response(insights)

        if insights:
            # treat "specialness" as a bonus, but not overpowering
            score += 0.8
            reasons.append(e["insights"]["explanation"])

        # 3) Price confidence (Google-ish)
        tc = ticket_cards.get(eid)
        e["ticket_confidence"] = tc

        if tc:
            plabel = tc.get("price_label")
            if plabel == "Good deal":
                score += 1.2
                reasons.append("Good deal for this set")
            elif plabel == "High":
                score -= 0.4

            if tc.get("budget_note"):
                reasons.append(tc["budget_note"])

        # 4) Best experience without being crazy expensive:
        # prefer not "High" priced unless it's special + relevant
        p = _extract_price_min(e)
        if p is not None and med_price > 0:
            ratio = p / med_price
            if ratio <= 1.10:
                score += 0.4
            elif ratio >= 1.40:
                score -= 0.6
                # only add as a reason if we have nothing else
                if len(reasons) < 2:
                    reasons.append("Pricier than most options")

        # 5) Timing bonus (lightweight)
        tb = _timing_bonus(dt)
        score += tb
        if tb >= 0.5:
            reasons.append("Great weekend timing")

        # Keep reasons short (UI-friendly)
        reasons = [r for r in reasons if r]
        reasons = reasons[:3]

        e["recommendation"] = {"score": round(score, 2), "reasons": reasons}
        scored.append((score, e))

    scored.sort(key=lambda x: x[0], reverse=True)

    # Cut to max_total (so Seira isn't dumping lists)
    best = [e for _, e in scored[:max_total]]

    top = best[:top_n]
    more = best[top_n:]

    headline = "Here are the 3 best options for you"
    if len(best) <= top_n:
        headline = "Here are the best options I found"

    why = "I picked these based on match to your request, value vs the set, and what will be the best experience (without being crazy expensive)."

    return {
        "top_picks": top,
        "more_options": more,
        "copy": {"headline": headline, "why_this_format": why},
    }

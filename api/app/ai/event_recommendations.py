"""
Event Recommendations (time-saver)

Goal: stop dumping 20+ events and instead return:
- 3 best picks (curated + opinionated)
- up to 4 more visible options (for browsing)
- a cursor for "show more" paging
- short "why" reasons per pick (value + experience + notable context)

Works across sports, music, theater.
Plays nicely with:
- app.ai.event_insights (tags/explanations)
- app.ai.travel_confidence.evaluate_ticket_options (Good deal / Typical / High)
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
import re
import statistics

# If you already added these files, keep these imports.
# If not yet, you can temporarily comment them out and still run rec ranking.
from app.ai.travel_confidence import evaluate_ticket_options
from app.ai.event_insights import enrich_events_with_insights


# -------------------------
# Parsing + normalization
# -------------------------

def _safe_lower(s: str | None) -> str:
    return (s or "").strip().lower()

def _parse_iso(dt: str | None) -> Optional[datetime]:
    if not dt:
        return None
    try:
        return datetime.fromisoformat(dt.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _extract_datetime(e: Dict[str, Any]) -> Optional[str]:
    # supports normalized and raw Ticketmaster shapes
    return (
        e.get("dateTime")
        or e.get("datetime")
        or e.get("date_time")
        or (e.get("dates", {}) or {}).get("start", {}).get("dateTime")
        or e.get("date")  # sometimes just YYYY-MM-DD
    )

def _extract_venue_name(e: Dict[str, Any]) -> str:
    v = e.get("venue")
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return v.get("name") or ""
    # Ticketmaster raw
    embedded = (e.get("_embedded", {}) or {}).get("venues", [])
    if embedded:
        return embedded[0].get("name") or ""
    return ""

def _extract_city(e: Dict[str, Any]) -> str:
    c = e.get("city")
    if isinstance(c, str):
        return c
    if isinstance(c, dict):
        return c.get("name") or ""
    embedded = (e.get("_embedded", {}) or {}).get("venues", [])
    if embedded:
        return ((embedded[0].get("city") or {}).get("name")) or ""
    return ""

def _extract_min_price(e: Dict[str, Any]) -> Optional[float]:
    # normalized
    for k in ("min_price", "price_min", "minPrice"):
        if e.get(k) is not None:
            try:
                return float(e.get(k))
            except Exception:
                pass
    # Ticketmaster raw: priceRanges[0].min
    pr = e.get("priceRanges") or []
    if pr and isinstance(pr, list):
        p0 = pr[0] or {}
        if p0.get("min") is not None:
            try:
                return float(p0.get("min"))
            except Exception:
                return None
    return None

def _extract_max_price(e: Dict[str, Any]) -> Optional[float]:
    for k in ("max_price", "price_max", "maxPrice"):
        if e.get(k) is not None:
            try:
                return float(e.get(k))
            except Exception:
                pass
    pr = e.get("priceRanges") or []
    if pr and isinstance(pr, list):
        p0 = pr[0] or {}
        if p0.get("max") is not None:
            try:
                return float(p0.get("max"))
            except Exception:
                return None
    return None

def _extract_category(e: Dict[str, Any]) -> str:
    # normalized
    for k in ("category", "segment", "type"):
        if e.get(k):
            return str(e.get(k))
    # Ticketmaster raw: classifications[0].segment.name
    classifications = e.get("classifications") or []
    if classifications:
        seg = (classifications[0].get("segment") or {}).get("name")
        if seg:
            return str(seg)
    return ""

def _normalize_event(e: Dict[str, Any]) -> Dict[str, Any]:
    dt = _extract_datetime(e)
    return {
        **e,
        "id": str(e.get("id") or ""),
        "name": e.get("name") or "",
        "dateTime": dt,
        "city": e.get("city") or _extract_city(e),
        "venue_name": e.get("venue_name") or _extract_venue_name(e),
        "category": e.get("category") or _extract_category(e),
        "min_price": e.get("min_price") if e.get("min_price") is not None else _extract_min_price(e),
        "max_price": e.get("max_price") if e.get("max_price") is not None else _extract_max_price(e),
    }


# -------------------------
# Simple "Google-like" scoring
# -------------------------

def _median(vals: List[float]) -> float:
    if not vals:
        return 0.0
    return float(statistics.median(vals))

def _is_weekend(dt: Optional[datetime]) -> bool:
    return bool(dt and dt.weekday() in (5, 6))  # Sat/Sun

def _is_friday(dt: Optional[datetime]) -> bool:
    return bool(dt and dt.weekday() == 4)

def _prime_time_bonus(dt: Optional[datetime]) -> float:
    # UTC-based bonus (still useful). If you store local tz later, you can improve it.
    if not dt:
        return 0.0
    if 18 <= dt.hour <= 22:
        return 0.25
    return 0.0

def _query_tokens(q: str) -> List[str]:
    q = _safe_lower(q)
    q = re.sub(r"[^a-z0-9\s]", " ", q)
    toks = [t for t in q.split() if len(t) >= 3]
    return toks[:12]

def _match_score(name: str, q: str) -> float:
    """
    Reward matching the query (e.g., "lakers", "taylor swift", "hamilton").
    """
    name_l = _safe_lower(name)
    toks = _query_tokens(q)
    if not toks or not name_l:
        return 0.0
    hits = sum(1 for t in toks if t in name_l)
    if hits >= 3:
        return 3.0
    if hits == 2:
        return 2.0
    if hits == 1:
        return 1.2
    return 0.0

def _budget_score(price: Optional[float], budget: Optional[float]) -> float:
    if price is None or budget is None or budget <= 0:
        return 0.0
    # best experience without being crazy expensive:
    # reward being within budget; mild reward for well under; penalty for over.
    if price <= budget * 0.7:
        return 0.6
    if price <= budget:
        return 1.0
    # over budget: penalize in proportion
    over = price - budget
    if over <= 25:
        return -0.2
    if over <= 75:
        return -0.6
    return -1.2

def _not_crazy_expensive_score(price: Optional[float], med: float) -> float:
    if price is None or med <= 0:
        return 0.0
    ratio = price / med
    if ratio <= 0.9:
        return 0.6
    if ratio <= 1.1:
        return 0.4
    if ratio >= 1.5:
        return -0.8
    if ratio >= 1.25:
        return -0.4
    return 0.0

def _freshness_filter(dt: Optional[datetime]) -> bool:
    """
    Keep future events only (avoid past).
    If dt missing, keep (some Ticketmaster entries can be incomplete).
    """
    if not dt:
        return True
    return dt >= _now_utc() - timedelta(minutes=5)  # tiny tolerance


# -------------------------
# Paging cache helpers (staggering)
# -------------------------

def build_results_cache(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Store minimal cache so "show more" doesn't re-fetch:
    - list of event IDs in ranked order
    - event map by ID for quick retrieval
    """
    event_map = {str(e["id"]): e for e in events if e.get("id")}
    ordered_ids = [str(e["id"]) for e in events if e.get("id")]
    return {"ordered_ids": ordered_ids, "event_map": event_map}

def page_from_cache(cache: Dict[str, Any], start: int, count: int) -> List[Dict[str, Any]]:
    ordered = cache.get("ordered_ids") or []
    emap = cache.get("event_map") or {}
    ids = ordered[start:start+count]
    return [emap[i] for i in ids if i in emap]


# -------------------------
# Main API
# -------------------------

def recommend_events(
    raw_events: List[Dict[str, Any]],
    user_query: str,
    user_budget: Optional[float] = None,
    max_visible: int = 7,      # show at most 7 at a time
    top_n: int = 3,            # show 3 best picks first
) -> Dict[str, Any]:
    """
    Returns a response payload you can send to the UI + LLM tool result:

    {
      "headline": "...",
      "top_picks": [... 3],
      "more_options": [... up to 4],
      "cursor": { "shown": 7, "total": 42 },
      "cache": { ... }  # for "show more" without new search
    }

    Each event includes:
      - insights (tags/explanation/has_insights) if event_insights is installed
      - ticket_confidence fields if travel_confidence is installed
      - recommendation.reasons (short bullets)
      - recommendation.badges (My pick / Best value / Great value / Special)
    """
    # normalize + basic validity
    events = [_normalize_event(e) for e in (raw_events or [])]
    events = [e for e in events if e.get("id") and e.get("name")]

    # drop obvious past events
    filtered: List[Dict[str, Any]] = []
    for e in events:
        dt = _parse_iso(e.get("dateTime"))
        if _freshness_filter(dt):
            filtered.append(e)
    events = filtered

    if not events:
        return {
            "headline": "I didn't find good matches.",
            "top_picks": [],
            "more_options": [],
            "cursor": {"shown": 0, "total": 0},
            "cache": build_results_cache([]),
        }

    # enrich with insights (lightweight)
    try:
        events = enrich_events_with_insights(events)
    except Exception:
        # insights layer optional; keep going
        pass

    # ticket confidence labels (Good deal / Typical / High) based on THIS set
    ticket_cards: Dict[str, Any] = {}
    try:
        teval = evaluate_ticket_options(events, user_budget=user_budget)
        ticket_cards = {str(c["id"]): c for c in teval.get("cards", [])}
    except Exception:
        ticket_cards = {}

    prices = [p for p in (_extract_min_price(e) for e in events) if p is not None]
    med = _median(prices) if prices else 0.0

    scored: List[Tuple[float, Dict[str, Any]]] = []

    for e in events:
        eid = str(e["id"])
        dt = _parse_iso(e.get("dateTime"))
        price = _extract_min_price(e)

        score = 0.0
        reasons: List[str] = []
        badges: List[str] = []

        # 1) match what the user asked for (biggest time-saver)
        ms = _match_score(e.get("name", ""), user_query)
        score += ms
        if ms >= 2.0:
            reasons.append("Best match for what you asked")

        # 2) notable insights (rivalry, opening night, etc.)—adds "why it's special"
        ins = (e.get("insights") or {})
        if ins.get("has_insights") and ins.get("explanation"):
            score += 0.8
            badges.append("Notable")
            reasons.append(ins["explanation"])

        # 3) price label within the set (Google-ish feel)
        tc = ticket_cards.get(eid)
        if tc:
            e["ticket_confidence"] = tc
            pl = tc.get("price_label")
            if pl == "Good deal":
                score += 1.2
                badges.append("Good deal")
                reasons.append("Good value vs similar options")
            elif pl == "High":
                score -= 0.3

            if tc.get("budget_note"):
                reasons.append(tc["budget_note"])

        # 4) "best experience without being crazy expensive" (default)
        score += _not_crazy_expensive_score(price, med)

        # 5) timing bonuses (lightweight but helpful)
        if _is_weekend(dt):
            score += 0.5
            badges.append("Great timing")
        elif _is_friday(dt):
            score += 0.3
            badges.append("Great timing")
        score += _prime_time_bonus(dt)

        # 6) tiny de-dup nudge: prefer items with actual pricing info
        if price is not None and price > 0:
            score += 0.15
        else:
            score -= 0.15

        # cap reasons (short = saves time)
        reasons = [r for r in reasons if r]
        reasons = reasons[:2]

        e["recommendation"] = {
            "score": round(score, 2),
            "reasons": reasons,
            "badges": badges[:3],
        }

        scored.append((score, e))

    scored.sort(key=lambda x: x[0], reverse=True)
    ranked = [e for _, e in scored]

    # choose top picks
    top = ranked[:top_n]
    more = ranked[top_n:max_visible]

    # assign stronger labels
    if top:
        top[0]["recommendation"]["badges"] = ["My pick"] + top[0]["recommendation"].get("badges", [])
        top[0]["recommendation"]["badges"] = top[0]["recommendation"]["badges"][:3]

    # best value among visible (cheap-ish but still good score)
    best_value_id = None
    best_value_metric = None
    for e in ranked[:max_visible]:
        p = _extract_min_price(e)
        if p is None or p <= 0:
            continue
        s = float(e.get("recommendation", {}).get("score", 0.0))
        metric = s / p
        if best_value_metric is None or metric > best_value_metric:
            best_value_metric = metric
            best_value_id = str(e["id"])
    if best_value_id:
        for e in ranked[:max_visible]:
            if str(e["id"]) == best_value_id and "My pick" not in e["recommendation"]["badges"]:
                e["recommendation"]["badges"] = ["Best value"] + e["recommendation"].get("badges", [])
                e["recommendation"]["badges"] = e["recommendation"]["badges"][:3]
                break

    headline = "Here are the 3 best options for you"
    if len(ranked) < 3:
        headline = "Here are the best options I found"

    cache = build_results_cache(ranked)

    return {
        "headline": headline,
        "top_picks": top,
        "more_options": more,
        "cursor": {"shown": min(max_visible, len(ranked)), "total": len(ranked)},
        "cache": cache,
    }


def show_more_from_cache(
    cache: Dict[str, Any],
    already_shown: int,
    page_size: int = 7,
) -> Dict[str, Any]:
    """
    Next "page" of results without re-searching.

    Returns:
    {
      "more_options": [... next page],
      "cursor": { "shown": new_shown, "total": total }
    }
    """
    total = len(cache.get("ordered_ids") or [])
    next_page = page_from_cache(cache, already_shown, page_size)
    new_shown = min(already_shown + len(next_page), total)
    return {
        "more_options": next_page,
        "cursor": {"shown": new_shown, "total": total},
    }

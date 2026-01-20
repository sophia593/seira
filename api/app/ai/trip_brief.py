"""
Trip Brief

This is Seira's differentiation layer:
- Not just "here are results"
- Produces a ready-to-execute plan + risks + next actions

Works today for events only (Ticketmaster).
Later you can pass flights/hotels and it will add warnings + logistics.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.ai.travel_confidence import evaluate_ticket_options
from app.ai.event_insights import enrich_events_with_insights
from app.services.venue_tips import get_venue_tips


def _pick_event(events: List[Dict[str, Any]], preferred_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not events:
        return None
    if preferred_id:
        for e in events:
            if str(e.get("id")) == str(preferred_id):
                return e
    return events[0]


def build_next_actions(event: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    4-button UX: always present, always changes as context grows later.
    """
    name = event.get("name") or "this event"
    venue = event.get("venue_name") or event.get("venue") or "the venue"
    return [
        {"id": "save_event", "label": "Save this event"},
        {"id": "hotels_airbnbs", "label": "Hotels + Airbnbs nearby"},
        {"id": "parking_transit", "label": "Parking + transit plan"},
        {"id": "food_plan", "label": "Dinner near the venue"},
    ]


def build_trip_brief(
    events: List[Dict[str, Any]],
    selected_event_id: Optional[str] = None,
    user_budget: Optional[float] = None,
    user_city: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns a single structured payload the UI + chat can use.

    {
      "hero": {...},
      "why_this": [.. short bullets ..],
      "watch_out": [.. warnings ..],
      "practical_tips": {...},
      "next_actions": [.. 4 buttons ..],
    }
    """
    if not events:
        return {
            "hero": None,
            "why_this": [],
            "watch_out": [],
            "practical_tips": None,
            "next_actions": [],
        }

    # Add insights to each event (rivalry/opening night/etc.)
    try:
        events = enrich_events_with_insights(events)
    except Exception:
        pass

    # Ticket confidence labels (Good deal/Typical/High) within this result set
    ticket_eval = evaluate_ticket_options(events, user_budget=user_budget)
    ticket_cards = {str(c["id"]): c for c in ticket_eval.get("cards", [])}

    chosen = _pick_event(events, selected_event_id)
    if not chosen:
        return {
            "hero": None,
            "why_this": [],
            "watch_out": [],
            "practical_tips": None,
            "next_actions": [],
        }

    eid = str(chosen.get("id"))
    tc = ticket_cards.get(eid)

    # Build "hero" card (what the user needs to decide fast)
    hero = {
        "id": chosen.get("id"),
        "name": chosen.get("name"),
        "dateTime": chosen.get("dateTime") or chosen.get("date"),
        "city": chosen.get("city"),
        "venue": chosen.get("venue_name") or chosen.get("venue"),
        "min_price": chosen.get("min_price") or (tc.get("price_min") if tc else None),
        "price_label": tc.get("price_label") if tc else None,
        "budget_note": tc.get("budget_note") if tc else None,
        "insights": chosen.get("insights"),
    }

    # Why this saves time: short bullets that answer "why are you showing me this?"
    why: List[str] = []

    if hero.get("price_label"):
        if hero["price_label"] == "Good deal":
            why.append("Good value compared to similar options we found")
        elif hero["price_label"] == "High":
            why.append("Pricier than most options — only worth it if this timing/matchup is your favorite")
        else:
            why.append("Fair price for this set")

    if hero.get("budget_note"):
        why.append(hero["budget_note"])

    ins = (hero.get("insights") or {})
    if ins.get("has_insights") and ins.get("explanation"):
        why.append(ins["explanation"])

    # Practical tips (your "manual data layer" lives here — Supabase table)
    practical = get_venue_tips(
        venue_name=hero.get("venue") or "",
        city=hero.get("city") or "",
        category=(chosen.get("category") or chosen.get("segment") or ""),
    )

    # Watch-outs (event-only for now)
    watch_out: List[Dict[str, Any]] = []
    if practical and practical.get("watch_out"):
        watch_out.append({
            "level": "info",
            "tag": "Heads up",
            "message": practical["watch_out"],
            "suggestion": practical.get("watch_out_fix") or "I can adjust the plan for you.",
            "category": "logistics",
        })

    # Add default "arrive early" tip if you have nothing else
    if not watch_out:
        watch_out.append({
            "level": "info",
            "tag": "Timing tip",
            "message": "Arrive 60-90 minutes early to avoid lines and get settled.",
            "suggestion": "Want a parking/transit plan so you can time it perfectly?",
            "category": "timing",
        })

    return {
        "hero": hero,
        "why_this": why[:3],  # keep it tight
        "watch_out": watch_out[:3],
        "practical_tips": practical,
        "next_actions": build_next_actions(chosen),
    }

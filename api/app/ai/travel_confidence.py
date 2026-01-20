"""
Travel Confidence

Google Flights-style confidence labels for travel options.
Provides "Good deal", "Typical", "High" labels with explanations.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple


# -----------------------
# Price Label Helpers
# -----------------------

def price_label(prices: List[float], price: float) -> Tuple[str, str]:
    """
    Determine price label based on distribution.

    Returns (label, why) tuple.
    """
    if not prices or price <= 0:
        return ("Unknown", "No price data available")

    prices_sorted = sorted(prices)
    n = len(prices_sorted)

    if n < 3:
        # Not enough data for meaningful comparison
        return ("Typical", "Limited options to compare")

    # Calculate percentiles
    p25_idx = max(0, int(n * 0.25) - 1)
    p75_idx = min(n - 1, int(n * 0.75))

    p25 = prices_sorted[p25_idx]
    p75 = prices_sorted[p75_idx]
    median = prices_sorted[n // 2]

    if price <= p25:
        return ("Good deal", f"Lower than {int((1 - p25_idx/n) * 100)}% of options")
    elif price >= p75:
        return ("High", f"Higher than {int((p75_idx/n) * 100)}% of options")
    else:
        return ("Typical", f"Around the median price of ${int(median)}")


# -----------------------
# Flight Confidence
# -----------------------

def evaluate_flight_options(
    flights: List[Dict[str, Any]],
    user_budget: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Evaluate flight prices with Google Flights-style confidence.

    Flights should have:
    - id
    - price
    - airline
    - duration (optional)
    - stops (optional)
    """
    valid = [
        f for f in (flights or [])
        if f.get("id") and f.get("price") is not None
    ]
    if not valid:
        return {"cards": [], "recommended": {}}

    prices = [float(f["price"]) for f in valid if f.get("price")]

    cards: List[Dict[str, Any]] = []
    scored: List[Tuple[float, Dict[str, Any]]] = []

    for f in valid:
        try:
            price = float(f["price"])
        except Exception:
            price = 0.0

        plabel, pwhy = price_label(prices, price)

        # Budget comparison
        budget_note = None
        if user_budget is not None and price > 0:
            if price <= user_budget * 0.7:
                budget_note = "Well under your budget"
            elif price <= user_budget:
                budget_note = "Within your budget"
            else:
                budget_note = f"Over budget by ${int(price - user_budget)}"

        # Score: value + convenience
        score = 0.0
        tags: List[str] = []

        # Nonstop bonus
        stops = f.get("stops", 0)
        if stops == 0:
            score += 2.0
            tags.append("Nonstop")

        # Good deal bonus
        if plabel == "Good deal":
            score += 2.0
            tags.append("Good deal")
        elif plabel == "High":
            score -= 1.0

        # Short duration bonus
        duration_mins = f.get("duration_minutes", 0)
        if duration_mins and duration_mins < 180:
            score += 1.0

        scored.append((score, f))

        cards.append({
            "id": f["id"],
            "airline": f.get("airline"),
            "price": price,
            "price_label": plabel,
            "price_why": pwhy,
            "budget_note": budget_note,
            "stops": stops,
            "tags": tags,
        })

    # Best pick (highest score)
    scored.sort(key=lambda x: x[0], reverse=True)
    my_pick = scored[0][1]["id"] if scored else None

    # Best value (score / price)
    value_scored: List[Tuple[float, Dict[str, Any]]] = []
    for s, f in scored:
        try:
            denom = max(float(f.get("price", 1)), 1.0)
        except Exception:
            denom = 1.0
        value_scored.append((s / denom, f))

    value_scored.sort(key=lambda x: x[0], reverse=True)
    best_value = value_scored[0][1]["id"] if value_scored else None

    # Tag the picks
    for c in cards:
        if my_pick and c["id"] == my_pick:
            c["tags"].append("My pick")
        if best_value and c["id"] == best_value and c["id"] != my_pick:
            c["tags"].append("Best value")

    return {
        "cards": cards,
        "recommended": {"my_pick": my_pick, "best_value": best_value},
    }


# -----------------------
# Event/Ticket Confidence
# -----------------------

def evaluate_ticket_options(
    events: List[Dict[str, Any]],
    user_budget: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Evaluate event ticket prices.

    Events should have:
    - id
    - name
    - price_min (or min_price)
    - price_max (optional)
    """
    valid = [
        e for e in (events or [])
        if e.get("id") and (e.get("price_min") is not None or e.get("min_price") is not None)
    ]
    if not valid:
        return {"cards": [], "recommended": {}}

    prices: List[float] = []
    for e in valid:
        p = e.get("price_min") if e.get("price_min") is not None else e.get("min_price")
        if p is not None:
            try:
                prices.append(float(p))
            except Exception:
                continue

    cards: List[Dict[str, Any]] = []
    scored: List[Tuple[float, Dict[str, Any]]] = []

    for e in valid:
        raw_price = e.get("price_min") if e.get("price_min") is not None else e.get("min_price")
        try:
            price = float(raw_price)
        except Exception:
            price = 0.0

        plabel, pwhy = price_label(prices, price)

        # Budget comparison if available
        budget_note = None
        if user_budget is not None and price > 0:
            if price <= user_budget * 0.7:
                budget_note = "Well under your budget"
            elif price <= user_budget:
                budget_note = "Within your budget"
            else:
                budget_note = f"Over budget by ${int(price - user_budget)}"

        # Score: prefer good value + premium-experience signals
        score = 0.0
        tags: List[str] = []

        name_lower = (e.get("name") or "").lower()
        if "final" in name_lower or "championship" in name_lower:
            score += 3.0
            tags.append("Premium experience")

        if plabel == "Good deal":
            score += 2.0
            tags.append("Good deal")
        elif plabel == "High":
            score -= 1.0

        scored.append((score, e))

        cards.append({
            "id": e["id"],
            "name": e.get("name"),
            "price_min": price,
            "price_max": e.get("price_max") if e.get("price_max") is not None else e.get("max_price"),
            "price_label": plabel,
            "price_why": pwhy,
            "budget_note": budget_note,
            "tags": tags,
        })

    # Best pick (highest score)
    scored.sort(key=lambda x: x[0], reverse=True)
    my_pick = scored[0][1]["id"] if scored else None

    # Best value (score / price)
    value_scored: List[Tuple[float, Dict[str, Any]]] = []
    for s, e in scored:
        p = e.get("price_min") if e.get("price_min") is not None else e.get("min_price")
        try:
            denom = max(float(p), 1.0)
        except Exception:
            denom = 1.0
        value_scored.append((s / denom, e))

    value_scored.sort(key=lambda x: x[0], reverse=True)
    best_value = value_scored[0][1]["id"] if value_scored else None

    # Tag the picks
    for c in cards:
        if my_pick and c["id"] == my_pick:
            c["tags"].append("My pick")
        if best_value and c["id"] == best_value and c["id"] != my_pick:
            c["tags"].append("Best value")

    return {
        "cards": cards,
        "recommended": {"my_pick": my_pick, "best_value": best_value},
    }

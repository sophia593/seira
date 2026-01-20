"""
Reco Presenter

Turns the recommendation payload into short chat text that feels like:
- opinionated
- quick
- time-saving
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional

def _fmt_price(e: Dict[str, Any]) -> str:
    p = e.get("min_price")
    if p is None and isinstance(e.get("ticket_confidence"), dict):
        p = e["ticket_confidence"].get("price_min")
    try:
        if p is None:
            return ""
        return f"${int(float(p))}+"
    except Exception:
        return ""

def _fmt_when(e: Dict[str, Any]) -> str:
    dt = e.get("dateTime") or e.get("date") or ""
    return dt.replace("T", " ").replace("Z", " UTC") if dt else ""

def _fmt_badges(e: Dict[str, Any]) -> str:
    b = (e.get("recommendation") or {}).get("badges") or []
    if not b:
        return ""
    # keep 1–2
    b = b[:2]
    return " • " + " • ".join(b)

def _fmt_reasons(e: Dict[str, Any]) -> str:
    rs = (e.get("recommendation") or {}).get("reasons") or []
    rs = [r for r in rs if r]
    if not rs:
        return ""
    # 1 short sentence max
    return rs[0]

def render_event_recos_text(payload: Dict[str, Any]) -> str:
    headline = payload.get("headline") or "Here are my picks"
    top: List[Dict[str, Any]] = payload.get("top_picks") or []
    more: List[Dict[str, Any]] = payload.get("more_options") or []
    cursor = payload.get("cursor") or {}
    total = cursor.get("total", 0)

    lines: List[str] = []
    lines.append(headline + ":")

    for i, e in enumerate(top, start=1):
        name = e.get("name") or "Event"
        city = e.get("city") or ""
        venue = e.get("venue_name") or ""
        when = _fmt_when(e)
        price = _fmt_price(e)
        badges = _fmt_badges(e)
        why = _fmt_reasons(e)

        meta = " — ".join([x for x in [when, city, venue, price] if x])
        if meta:
            lines.append(f"{i}) **{name}**{badges}\n   {meta}")
        else:
            lines.append(f"{i}) **{name}**{badges}")

        if why:
            lines.append(f"   *Why:* {why}")

    if more:
        lines.append("")
        lines.append(f"If you want more options, I have {min(len(more), 4)} more ready to show (and I can keep going).")

    # Keep it short and decisive
    if total and total > 0:
        lines.append("")
        lines.append("Tell me which one you like (1/2/3), or say **more options**.")

    return "\n".join(lines)

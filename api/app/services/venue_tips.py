"""
Venue Tips Service

This is your lightweight manual data layer.
It makes Seira better than Google by remembering real venue logistics:
- best area to stay
- parking situation
- transit/rideshare tips
- "watch out" notes (construction, awful pickup zones, etc.)

Table (Supabase) suggested columns:
- venue_name (text)  [or venue_id if you normalize later]
- city (text)
- category (text)    # sports/music/theater (optional)
- stay_area (text)
- parking_tip (text)
- transit_tip (text)
- rideshare_tip (text)
- watch_out (text)
- watch_out_fix (text)
- updated_at (timestamp)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def _empty() -> Dict[str, Any]:
    return {
        "stay_area": None,
        "parking_tip": None,
        "transit_tip": None,
        "rideshare_tip": None,
        "watch_out": None,
        "watch_out_fix": None,
        "source": "none",
    }


def get_venue_tips(
    venue_name: str,
    city: str,
    category: str = "",
) -> Dict[str, Any]:
    """
    Get practical tips for a venue.

    Currently returns empty tips (table not yet created).
    Once venue_tips table exists in Supabase, this will query it.
    """
    v = (venue_name or "").strip()
    c = (city or "").strip()

    if not v or not c:
        return _empty()

    # Try to fetch from Supabase
    try:
        return _fetch_venue_tips(v, c, category)
    except Exception as e:
        logger.debug(f"Could not fetch venue tips for {v} in {c}: {e}")
        return _empty()


def _fetch_venue_tips(
    venue_name: str,
    city: str,
    category: str = "",
) -> Dict[str, Any]:
    """
    Fetch venue tips from Supabase.

    Returns empty if table doesn't exist or no match found.
    """
    try:
        from app.core.database import get_supabase
        sb = get_supabase()

        # Try exact match
        result = (
            sb.table("venue_tips")
            .select("*")
            .eq("venue_name", venue_name)
            .eq("city", city)
            .limit(1)
            .execute()
        )

        data = getattr(result, "data", None)
        if data and len(data) > 0:
            row = data[0]
            return {
                "stay_area": row.get("stay_area"),
                "parking_tip": row.get("parking_tip"),
                "transit_tip": row.get("transit_tip"),
                "rideshare_tip": row.get("rideshare_tip"),
                "watch_out": row.get("watch_out"),
                "watch_out_fix": row.get("watch_out_fix"),
                "source": "supabase",
            }

        return _empty()

    except Exception as e:
        # Table might not exist yet - that's fine
        logger.debug(f"Venue tips query failed (table may not exist): {e}")
        return _empty()


async def get_venue_tips_async(
    venue_name: str,
    city: str,
    category: str = "",
) -> Dict[str, Any]:
    """
    Async version for use in async contexts.
    """
    import anyio
    return await anyio.to_thread.run_sync(
        lambda: get_venue_tips(venue_name, city, category)
    )

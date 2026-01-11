"""
AI Metrics API - Monitoring and observability for AI components.

GET /metrics - Full metrics dump
GET /metrics/health - Quick health check
GET /metrics/summary - Dashboard-friendly summary
POST /metrics/reset - Reset metrics (admin only)
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException

from app.ai.metrics import get_all_metrics, gemini_rescue_metrics, research_web_metrics
from app.core.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("")
async def get_metrics() -> dict[str, Any]:
    """
    Get full AI metrics.

    Returns metrics for:
    - Gemini rescue (Ticketmaster fallback)
    - Web research tool usage
    """
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": get_all_metrics(),
    }


@router.get("/health")
async def health_check() -> dict[str, Any]:
    """
    Quick health check for AI components.

    Returns:
        status: "healthy" | "degraded" | "unhealthy"
        checks: Individual component statuses
    """
    settings = get_settings()
    checks = {}

    # Check API keys are configured
    checks["anthropic_key"] = "ok" if settings.ANTHROPIC_API_KEY else "missing"
    checks["gemini_key"] = "ok" if settings.GEMINI_API_KEY else "missing"
    checks["ticketmaster_key"] = "ok" if settings.TICKETMASTER_API_KEY else "missing"

    # Check recent error rates
    gemini_stats = gemini_rescue_metrics.get_stats()
    if gemini_stats["total_triggers"] > 0:
        failure_rate = gemini_stats["failed_rescues"] / gemini_stats["total_triggers"]
        checks["gemini_rescue"] = "ok" if failure_rate < 0.3 else "degraded"
    else:
        checks["gemini_rescue"] = "no_data"

    research_stats = research_web_metrics.get_stats()
    if research_stats["total_calls"] > 0:
        failure_rate = research_stats["failed_calls"] / research_stats["total_calls"]
        checks["research_web"] = "ok" if failure_rate < 0.3 else "degraded"
    else:
        checks["research_web"] = "no_data"

    # Overall status
    critical_checks = [checks["anthropic_key"], checks["gemini_key"]]
    if "missing" in critical_checks:
        status = "unhealthy"
    elif "degraded" in checks.values():
        status = "degraded"
    else:
        status = "healthy"

    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks,
    }


@router.get("/summary")
async def get_summary() -> dict[str, Any]:
    """
    Dashboard-friendly metrics summary.

    Returns key metrics for monitoring dashboards.
    """
    gemini_stats = gemini_rescue_metrics.get_stats()
    research_stats = research_web_metrics.get_stats()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "gemini_rescue": {
            "total": gemini_stats["total_triggers"],
            "success_rate": gemini_stats["success_rate_pct"],
            "official_source_rate": gemini_stats["source_quality"]["official_source_rate_pct"],
        },
        "research_web": {
            "total": research_stats["total_calls"],
            "success_rate": research_stats["success_rate_pct"],
            "top_search_types": dict(
                sorted(
                    research_stats["search_type_distribution"].items(),
                    key=lambda x: x[1],
                    reverse=True,
                )[:5]
            ),
        },
    }


@router.post("/reset")
async def reset_metrics() -> dict[str, str]:
    """
    Reset all metrics counters.

    WARNING: This clears all accumulated metrics data.
    Should be protected by admin auth in production.
    """
    # Reset gemini rescue metrics
    gemini_rescue_metrics.total_triggers = 0
    gemini_rescue_metrics.successful_rescues = 0
    gemini_rescue_metrics.empty_rescues = 0
    gemini_rescue_metrics.failed_rescues = 0
    gemini_rescue_metrics.rescues_with_official_sources = 0
    gemini_rescue_metrics.total_sources_found = 0
    gemini_rescue_metrics.total_official_sources_found = 0
    gemini_rescue_metrics.triggers_no_ticketmaster_results = 0
    gemini_rescue_metrics.triggers_ticketmaster_failed = 0
    gemini_rescue_metrics.recent_rescues.clear()

    # Reset research web metrics
    research_web_metrics.total_calls = 0
    research_web_metrics.successful_calls = 0
    research_web_metrics.failed_calls = 0
    research_web_metrics.calls_with_official_sources = 0
    research_web_metrics.total_sources_found = 0
    research_web_metrics.search_types.clear()

    logger.info("AI metrics reset")

    return {"status": "ok", "message": "Metrics reset successfully"}

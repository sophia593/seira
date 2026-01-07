"""
AI Metrics Tracking

Simple in-memory metrics for tracking AI tool performance.
Metrics reset on server restart - for production, use Redis or a proper metrics service.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class GeminiRescueMetrics:
    """Tracks Gemini rescue search performance."""

    # Counters
    total_triggers: int = 0
    successful_rescues: int = 0  # Found useful content
    empty_rescues: int = 0       # Found nothing useful
    failed_rescues: int = 0      # API error

    # Quality tracking
    rescues_with_official_sources: int = 0
    total_sources_found: int = 0
    total_official_sources_found: int = 0

    # Trigger reasons
    triggers_no_ticketmaster_results: int = 0
    triggers_ticketmaster_failed: int = 0

    # Recent rescues for debugging (keep last 20)
    recent_rescues: list[dict[str, Any]] = field(default_factory=list)

    _lock: Lock = field(default_factory=Lock, repr=False)

    def record_rescue(
        self,
        query: str,
        trigger_reason: str,
        success: bool,
        answer_length: int,
        source_count: int,
        official_source_count: int,
        error: str | None = None,
    ) -> None:
        """Record a rescue attempt with all details."""
        with self._lock:
            self.total_triggers += 1

            # Track trigger reason
            if trigger_reason == "no_results":
                self.triggers_no_ticketmaster_results += 1
            elif trigger_reason == "api_failed":
                self.triggers_ticketmaster_failed += 1

            # Track outcome
            if error:
                self.failed_rescues += 1
                outcome = "failed"
            elif answer_length > 100 and source_count > 0:
                self.successful_rescues += 1
                outcome = "success"
                self.total_sources_found += source_count
                self.total_official_sources_found += official_source_count
                if official_source_count > 0:
                    self.rescues_with_official_sources += 1
            else:
                self.empty_rescues += 1
                outcome = "empty"

            # Record for debugging
            rescue_record = {
                "timestamp": datetime.utcnow().isoformat(),
                "query": query[:100],  # Truncate long queries
                "trigger_reason": trigger_reason,
                "outcome": outcome,
                "answer_length": answer_length,
                "source_count": source_count,
                "official_source_count": official_source_count,
                "error": error,
            }

            self.recent_rescues.append(rescue_record)
            if len(self.recent_rescues) > 20:
                self.recent_rescues.pop(0)

            # Log the rescue
            logger.info(
                f"GEMINI_RESCUE: outcome={outcome}, trigger={trigger_reason}, "
                f"answer_len={answer_length}, sources={source_count} "
                f"(official={official_source_count}), query={query[:50]}..."
            )

    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_triggers == 0:
            return 0.0
        return (self.successful_rescues / self.total_triggers) * 100

    @property
    def official_source_rate(self) -> float:
        """Rate of successful rescues that had official sources."""
        if self.successful_rescues == 0:
            return 0.0
        return (self.rescues_with_official_sources / self.successful_rescues) * 100

    def get_stats(self) -> dict[str, Any]:
        """Get all metrics as a dict."""
        with self._lock:
            return {
                "total_triggers": self.total_triggers,
                "successful_rescues": self.successful_rescues,
                "empty_rescues": self.empty_rescues,
                "failed_rescues": self.failed_rescues,
                "success_rate_pct": round(self.success_rate, 1),
                "triggers_by_reason": {
                    "no_ticketmaster_results": self.triggers_no_ticketmaster_results,
                    "ticketmaster_api_failed": self.triggers_ticketmaster_failed,
                },
                "source_quality": {
                    "total_sources_found": self.total_sources_found,
                    "total_official_sources": self.total_official_sources_found,
                    "rescues_with_official_sources": self.rescues_with_official_sources,
                    "official_source_rate_pct": round(self.official_source_rate, 1),
                },
                "recent_rescues": self.recent_rescues[-5:],  # Last 5 for summary
            }


@dataclass
class ResearchWebMetrics:
    """Tracks research_web tool usage."""

    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0

    # Search type distribution
    search_types: dict[str, int] = field(default_factory=dict)

    # Quality tracking
    calls_with_official_sources: int = 0
    total_sources_found: int = 0

    _lock: Lock = field(default_factory=Lock, repr=False)

    def record_call(
        self,
        query: str,
        search_type: str,
        success: bool,
        source_count: int,
        official_source_count: int,
        error: str | None = None,
    ) -> None:
        """Record a research_web call."""
        with self._lock:
            self.total_calls += 1

            if success:
                self.successful_calls += 1
                self.total_sources_found += source_count
                if official_source_count > 0:
                    self.calls_with_official_sources += 1
            else:
                self.failed_calls += 1

            # Track search type distribution
            self.search_types[search_type] = self.search_types.get(search_type, 0) + 1

            logger.info(
                f"RESEARCH_WEB: success={success}, type={search_type}, "
                f"sources={source_count} (official={official_source_count}), "
                f"query={query[:50]}..."
            )

    def get_stats(self) -> dict[str, Any]:
        """Get all metrics as a dict."""
        with self._lock:
            success_rate = (self.successful_calls / self.total_calls * 100) if self.total_calls > 0 else 0
            return {
                "total_calls": self.total_calls,
                "successful_calls": self.successful_calls,
                "failed_calls": self.failed_calls,
                "success_rate_pct": round(success_rate, 1),
                "search_type_distribution": dict(self.search_types),
                "source_quality": {
                    "total_sources_found": self.total_sources_found,
                    "calls_with_official_sources": self.calls_with_official_sources,
                },
            }


# Global metrics instances
gemini_rescue_metrics = GeminiRescueMetrics()
research_web_metrics = ResearchWebMetrics()


def get_all_metrics() -> dict[str, Any]:
    """Get all AI metrics for monitoring."""
    return {
        "gemini_rescue": gemini_rescue_metrics.get_stats(),
        "research_web": research_web_metrics.get_stats(),
    }

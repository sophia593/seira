"""
Tool Registry

Manages tool definitions and execution for Claude function calling.
Tools are registered here and executed by the orchestrator.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Awaitable

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Tool definitions (Claude format)
# -----------------------------------------------------------------------------

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "search_events",
        "description": "Search for live events (sports, concerts, theater, comedy) by query, location, and date range.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query - team name, artist, event name, or genre (e.g., 'Lakers', 'Taylor Swift', 'comedy shows')",
                },
                "city": {
                    "type": "string",
                    "description": "City to search in (e.g., 'Los Angeles', 'New York')",
                },
                "date_from": {
                    "type": "string",
                    "description": "Start date for search range (YYYY-MM-DD format)",
                },
                "date_to": {
                    "type": "string",
                    "description": "End date for search range (YYYY-MM-DD format)",
                },
                "category": {
                    "type": "string",
                    "enum": ["sports", "music", "theater", "comedy"],
                    "description": "Event category to filter by",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_flights",
        "description": "Search for flights between two cities on specific dates.",
        "input_schema": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "string",
                    "description": "Origin city or airport code (e.g., 'Chicago', 'ORD')",
                },
                "destination": {
                    "type": "string",
                    "description": "Destination city or airport code (e.g., 'Los Angeles', 'LAX')",
                },
                "departure_date": {
                    "type": "string",
                    "description": "Departure date (YYYY-MM-DD format)",
                },
                "return_date": {
                    "type": "string",
                    "description": "Return date (YYYY-MM-DD format). Omit for one-way.",
                },
                "cabin_class": {
                    "type": "string",
                    "enum": ["economy", "premium_economy", "business", "first"],
                    "description": "Preferred cabin class (default: economy)",
                },
                "passengers": {
                    "type": "integer",
                    "description": "Number of passengers (default: 1)",
                    "minimum": 1,
                    "maximum": 9,
                },
            },
            "required": ["origin", "destination", "departure_date"],
        },
    },
    {
        "name": "save_trip",
        "description": "Save a trip plan to the user's account with event and flight details.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Trip title (e.g., 'Lakers vs Celtics - Feb 14, 2026')",
                },
                "event": {
                    "type": "object",
                    "description": "Event details from search results",
                    "properties": {
                        "name": {"type": "string"},
                        "date": {"type": "string"},
                        "time": {"type": "string"},
                        "venue": {"type": "string"},
                        "city": {"type": "string"},
                        "ticket_url": {"type": "string"},
                        "price_range": {"type": "string"},
                    },
                    "required": ["name", "date", "venue"],
                },
                "outbound_flight": {
                    "type": "object",
                    "description": "Outbound flight details",
                    "properties": {
                        "airline": {"type": "string"},
                        "flight_number": {"type": "string"},
                        "departure_time": {"type": "string"},
                        "arrival_time": {"type": "string"},
                        "origin": {"type": "string"},
                        "destination": {"type": "string"},
                        "price": {"type": "number"},
                        "booking_url": {"type": "string"},
                    },
                },
                "return_flight": {
                    "type": "object",
                    "description": "Return flight details (optional)",
                    "properties": {
                        "airline": {"type": "string"},
                        "flight_number": {"type": "string"},
                        "departure_time": {"type": "string"},
                        "arrival_time": {"type": "string"},
                        "origin": {"type": "string"},
                        "destination": {"type": "string"},
                        "price": {"type": "number"},
                        "booking_url": {"type": "string"},
                    },
                },
                "estimated_total": {
                    "type": "number",
                    "description": "Estimated total cost (tickets + flights)",
                },
                "notes": {
                    "type": "string",
                    "description": "Additional notes for the trip",
                },
            },
            "required": ["title", "event"],
        },
    },
]


# -----------------------------------------------------------------------------
# Tool handlers registry
# -----------------------------------------------------------------------------

# Type for tool handler functions
ToolHandler = Callable[[dict[str, Any], str | None], Awaitable[dict[str, Any]]]

# Registered handlers: tool_name -> handler function
_handlers: dict[str, ToolHandler] = {}


def register_tool(name: str):
    """Decorator to register a tool handler function."""

    def decorator(func: ToolHandler) -> ToolHandler:
        _handlers[name] = func
        logger.debug(f"Registered tool handler: {name}")
        return func

    return decorator


# -----------------------------------------------------------------------------
# Public API
# -----------------------------------------------------------------------------


def get_tool_definitions() -> list[dict[str, Any]]:
    """Get all tool definitions for Claude."""
    return TOOL_DEFINITIONS


async def execute_tool(
    tool_name: str,
    tool_input: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Execute a tool by name with the given input.

    Args:
        tool_name: Name of the tool to execute
        tool_input: Input parameters for the tool
        user_id: User ID for authorization (required for save_trip)

    Returns:
        Tool execution result as a dict

    Raises:
        ValueError: If tool is not registered
        Exception: If tool execution fails
    """
    handler = _handlers.get(tool_name)

    if handler is None:
        logger.error(f"No handler registered for tool: {tool_name}")
        raise ValueError(f"Unknown tool: {tool_name}")

    logger.info(f"Executing tool {tool_name} with input: {tool_input}")

    try:
        result = await handler(tool_input, user_id)
        logger.debug(f"Tool {tool_name} completed successfully")
        return result
    except Exception as e:
        logger.exception(f"Tool {tool_name} failed: {e}")
        raise


# -----------------------------------------------------------------------------
# Import handlers to register them
# -----------------------------------------------------------------------------

# Import after registry is defined to avoid circular imports
from app.ai.tools import handlers  # noqa: E402, F401

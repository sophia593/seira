"""
Anthropic Claude client wrapper with streaming support.

This module handles all communication with the Claude API.
Tool execution logic is handled separately in orchestrator.py.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, AsyncGenerator, Literal

from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Type definitions
# -----------------------------------------------------------------------------


class ToolCall(BaseModel):
    """A tool call extracted from Claude's response."""
    id: str
    name: str
    input: dict[str, Any]


class StreamEvent(BaseModel):
    """Normalized event types for frontend consumption."""
    type: Literal["text", "tool_start", "tool_input", "tool_result", "error", "done"]
    data: dict[str, Any]


class MessageParams(BaseModel):
    """Input params for stream_message."""
    messages: list[dict[str, Any]]
    system: str | None = None
    tools: list[dict[str, Any]] | None = None
    max_tokens: int = 4096


# -----------------------------------------------------------------------------
# Error mapping
# -----------------------------------------------------------------------------

# User-friendly error messages (don't expose raw API errors)
ANTHROPIC_ERROR_MESSAGES = {
    "APITimeoutError": "AI service timed out. Please try again.",
    "RateLimitError": "AI service is busy. Please wait a moment.",
    "AuthenticationError": "AI service authentication failed.",
    "BadRequestError": "Invalid request to AI service.",
    "APIConnectionError": "Could not connect to AI service.",
}


def _get_user_friendly_error(error: Exception) -> str:
    """Map Anthropic errors to user-friendly messages."""
    error_type = type(error).__name__
    return ANTHROPIC_ERROR_MESSAGES.get(
        error_type,
        "An error occurred with the AI service. Please try again.",
    )


# -----------------------------------------------------------------------------
# Client singleton
# -----------------------------------------------------------------------------

_client = None


def get_client():
    """Get or create the Anthropic client singleton."""
    global _client
    if _client is None:
        try:
            import anthropic
        except ImportError:
            raise ImportError(
                "anthropic package not installed. Run: pip install anthropic"
            )

        settings = get_settings()
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is not set")

        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        logger.info(f"Initialized Anthropic client (model: {settings.CLAUDE_MODEL})")

    return _client


# -----------------------------------------------------------------------------
# Main streaming function
# -----------------------------------------------------------------------------


async def stream_message(
    messages: list[dict[str, Any]],
    system: str | None = None,
    tools: list[dict[str, Any]] | None = None,
    max_tokens: int | None = None,
) -> AsyncGenerator[StreamEvent, None]:
    """
    Stream a message to Claude and yield normalized events.

    Args:
        messages: List of message dicts with role and content
        system: Optional system prompt
        tools: Optional list of tool definitions
        max_tokens: Max tokens to generate (uses config default if not set)

    Yields:
        StreamEvent with types:
        - text: {"text": "chunk"}
        - tool_start: {"id": "...", "name": "tool_name"}
        - tool_input: {"id": "...", "input": {...}} (accumulated)
        - error: {"message": "..."}
        - done: {"stop_reason": "end_turn"|"tool_use"}
    """
    settings = get_settings()
    client = get_client()

    if max_tokens is None:
        max_tokens = settings.CLAUDE_MAX_TOKENS

    # Build request kwargs
    kwargs: dict[str, Any] = {
        "model": settings.CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system
    if tools:
        kwargs["tools"] = tools

    logger.debug(
        f"Streaming message: model={settings.CLAUDE_MODEL}, "
        f"messages={len(messages)}, tools={len(tools) if tools else 0}"
    )

    # Track tool input accumulation (tool_use blocks come in chunks)
    tool_inputs: dict[str, str] = {}  # block_id -> accumulated JSON string
    tool_names: dict[str, str] = {}   # block_id -> tool name
    current_block_id: str | None = None

    try:
        async with asyncio.timeout(settings.CLAUDE_TIMEOUT):
            async with client.messages.stream(**kwargs) as stream:
                async for event in stream:
                    event_type = getattr(event, "type", None)

                    # Content block started
                    if event_type == "content_block_start":
                        block = event.content_block
                        if block.type == "tool_use":
                            current_block_id = block.id
                            tool_names[block.id] = block.name
                            tool_inputs[block.id] = ""
                            yield StreamEvent(
                                type="tool_start",
                                data={"id": block.id, "name": block.name},
                            )

                    # Content block delta (text or tool input)
                    elif event_type == "content_block_delta":
                        delta = event.delta
                        if delta.type == "text_delta":
                            yield StreamEvent(
                                type="text",
                                data={"text": delta.text},
                            )
                        elif delta.type == "input_json_delta":
                            # Accumulate tool input JSON
                            if current_block_id:
                                tool_inputs[current_block_id] += delta.partial_json

                    # Content block stopped
                    elif event_type == "content_block_stop":
                        # If this was a tool_use block, yield the complete input
                        if current_block_id and current_block_id in tool_inputs:
                            try:
                                parsed_input = json.loads(
                                    tool_inputs[current_block_id] or "{}"
                                )
                            except json.JSONDecodeError:
                                parsed_input = {}
                                logger.warning(
                                    f"Failed to parse tool input for {current_block_id}"
                                )

                            yield StreamEvent(
                                type="tool_input",
                                data={
                                    "id": current_block_id,
                                    "name": tool_names.get(current_block_id, ""),
                                    "input": parsed_input,
                                },
                            )
                            current_block_id = None

                    # Message complete
                    elif event_type == "message_stop":
                        # Get final message for stop reason
                        final_message = await stream.get_final_message()
                        yield StreamEvent(
                            type="done",
                            data={
                                "stop_reason": final_message.stop_reason,
                                "usage": {
                                    "input_tokens": final_message.usage.input_tokens,
                                    "output_tokens": final_message.usage.output_tokens,
                                },
                            },
                        )

    except asyncio.TimeoutError:
        logger.error(f"Claude API timeout after {settings.CLAUDE_TIMEOUT}s")
        yield StreamEvent(
            type="error",
            data={"message": "AI service timed out. Please try again."},
        )
    except Exception as e:
        logger.exception(f"Claude API error: {e}")
        yield StreamEvent(
            type="error",
            data={"message": _get_user_friendly_error(e)},
        )


# -----------------------------------------------------------------------------
# Raw stream access (for orchestrator)
# -----------------------------------------------------------------------------


def create_stream(
    messages: list[dict[str, Any]],
    system: str | None = None,
    tools: list[dict[str, Any]] | None = None,
    max_tokens: int | None = None,
):
    """
    Create a raw Anthropic stream for direct control.

    Use when orchestrator needs to handle tool execution mid-stream.
    Returns the stream context manager.

    Usage:
        async with create_stream(messages, system=prompt, tools=tools) as stream:
            async for event in stream:
                # Handle events directly
    """
    settings = get_settings()
    client = get_client()

    if max_tokens is None:
        max_tokens = settings.CLAUDE_MAX_TOKENS

    kwargs: dict[str, Any] = {
        "model": settings.CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system
    if tools:
        kwargs["tools"] = tools

    logger.debug(
        f"Creating raw stream: model={settings.CLAUDE_MODEL}, "
        f"messages={len(messages)}, tools={len(tools) if tools else 0}"
    )

    return client.messages.stream(**kwargs)


# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------


def get_tool_calls_from_response(response) -> list[ToolCall]:
    """
    Extract tool_use blocks from a message response.

    Args:
        response: Anthropic message response object

    Returns:
        List of ToolCall objects
    """
    tool_calls = []

    for block in response.content:
        if block.type == "tool_use":
            tool_calls.append(
                ToolCall(
                    id=block.id,
                    name=block.name,
                    input=block.input,
                )
            )

    return tool_calls


async def send_message(
    messages: list[dict[str, Any]],
    system: str | None = None,
    tools: list[dict[str, Any]] | None = None,
    max_tokens: int | None = None,
) -> dict[str, Any]:
    """
    Send a non-streaming message to Claude.

    Returns the full response as a dict.
    Useful for simple queries where streaming isn't needed.
    """
    settings = get_settings()
    client = get_client()

    if max_tokens is None:
        max_tokens = settings.CLAUDE_MAX_TOKENS

    kwargs: dict[str, Any] = {
        "model": settings.CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system
    if tools:
        kwargs["tools"] = tools

    logger.debug(
        f"Sending message: model={settings.CLAUDE_MODEL}, "
        f"messages={len(messages)}, tools={len(tools) if tools else 0}"
    )

    try:
        async with asyncio.timeout(settings.CLAUDE_TIMEOUT):
            response = await client.messages.create(**kwargs)

            return {
                "id": response.id,
                "content": [
                    {"type": block.type, "text": getattr(block, "text", None)}
                    if block.type == "text"
                    else {
                        "type": block.type,
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    }
                    for block in response.content
                ],
                "stop_reason": response.stop_reason,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            }

    except asyncio.TimeoutError:
        logger.error(f"Claude API timeout after {settings.CLAUDE_TIMEOUT}s")
        raise
    except Exception as e:
        logger.exception(f"Claude API error: {e}")
        raise

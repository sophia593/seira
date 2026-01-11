"""
Seira AI Orchestrator

Manages the agentic loop: streaming Claude responses, executing tools,
and continuing the conversation until completion.

Flow:
1. Build system prompt with user/conversation context
2. Stream response from Claude
3. If Claude requests tool use, execute tools and continue
4. Yield events for frontend consumption throughout
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any, AsyncGenerator

from pydantic import BaseModel

from app.ai.client import StreamEvent, create_stream
from app.ai.prompts import build_system_prompt
from app.ai.tokens import truncate_messages, estimate_tokens
from app.ai.tools.registry import get_tool_definitions, execute_tool
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Maximum size for tool result content (characters)
MAX_TOOL_RESULT_SIZE = 50_000


# -----------------------------------------------------------------------------
# Types
# -----------------------------------------------------------------------------


class OrchestratorConfig(BaseModel):
    """Configuration for the orchestrator."""

    max_tool_rounds: int = 6  # Prevent infinite loops (configurable via MAX_TOOL_ROUNDS)
    max_context_tokens: int = 180_000  # Token limit (configurable via MAX_CONTEXT_TOKENS)
    stream_timeout: int = 120  # Timeout for each stream in seconds
    include_date: bool = True

    @classmethod
    def from_settings(cls) -> "OrchestratorConfig":
        """Create config from environment settings."""
        settings = get_settings()
        return cls(
            max_tool_rounds=settings.MAX_TOOL_ROUNDS,
            max_context_tokens=settings.MAX_CONTEXT_TOKENS,
            stream_timeout=settings.CLAUDE_TIMEOUT,
        )


class ConversationContext(BaseModel):
    """Context extracted from the current conversation state."""

    selected_event: dict[str, Any] | None = None
    origin_city: str | None = None
    travel_dates: str | None = None
    selected_flights: list[dict[str, Any]] | None = None
    trip_saved: bool = False


class UserContext(BaseModel):
    """User information for prompt personalization."""

    user_id: str
    name: str | None = None
    email: str | None = None
    preferences: dict[str, Any] | None = None


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------


def _truncate_tool_result(result: Any, max_size: int = MAX_TOOL_RESULT_SIZE) -> str:
    """
    Truncate tool result to prevent context overflow.

    Large results (like 100 events) can blow up the context window.
    This truncates while preserving structure.
    """
    if isinstance(result, dict):
        result_str = json.dumps(result, ensure_ascii=False)
    else:
        result_str = str(result)

    if len(result_str) <= max_size:
        return result_str

    # Try to truncate intelligently for known result types
    if isinstance(result, dict):
        # Truncate list fields (events, flights, sources, etc.)
        truncated = dict(result)
        for key in ["events", "flights", "sources", "results", "items", "data"]:
            if key in truncated and isinstance(truncated[key], list):
                original_len = len(truncated[key])
                if original_len > 10:
                    truncated[key] = truncated[key][:10]
                    truncated[f"_{key}_truncated"] = f"Showing 10 of {original_len}"

        result_str = json.dumps(truncated, ensure_ascii=False)
        if len(result_str) <= max_size:
            return result_str

    # Hard truncate if still too large
    return result_str[:max_size - 50] + f"... [truncated, {len(result_str)} chars total]"


# -----------------------------------------------------------------------------
# Main orchestrator
# -----------------------------------------------------------------------------


async def run_conversation(
    messages: list[dict[str, Any]],
    user_context: UserContext | None = None,
    conversation_context: ConversationContext | None = None,
    config: OrchestratorConfig | None = None,
) -> AsyncGenerator[StreamEvent, None]:
    """
    Run a complete conversation turn with tool execution support.

    This is the main entry point for the chat endpoint. It:
    1. Builds the system prompt with context
    2. Streams Claude's response
    3. Executes any tool calls
    4. Continues until Claude is done (no more tool calls)

    Args:
        messages: Conversation history in Claude format
        user_context: User info for personalization
        conversation_context: Current conversation state
        config: Orchestrator configuration

    Yields:
        StreamEvent objects for frontend consumption:
        - text: Streamed text chunks
        - tool_start: Tool execution starting
        - tool_input: Complete tool input received
        - tool_result: Tool execution result
        - error: Error occurred
        - done: Conversation turn complete
    """
    if config is None:
        config = OrchestratorConfig.from_settings()

    # Generate request ID for log correlation
    request_id = uuid.uuid4().hex[:8]

    logger.info(f"[{request_id}] Starting conversation turn")

    # Build system prompt with context
    system_prompt = build_system_prompt(
        user_name=user_context.name if user_context else None,
        user_email=user_context.email if user_context else None,
        preferences=user_context.preferences if user_context else None,
        conversation_context=conversation_context.model_dump() if conversation_context else None,
        include_date=config.include_date,
    )

    # Get tool definitions
    tools = get_tool_definitions()

    # Truncate messages if needed to fit context window
    truncated_messages = truncate_messages(
        messages,
        max_tokens=config.max_context_tokens,
        system=system_prompt,
        preserve_recent=4,
        preserve_first=1,
    )

    if len(truncated_messages) < len(messages):
        logger.info(
            f"[{request_id}] Context truncated: {len(messages)} -> {len(truncated_messages)} messages"
        )

    # Log token estimate
    token_estimate = estimate_tokens(truncated_messages, system_prompt)
    logger.debug(f"[{request_id}] Token estimate: {token_estimate}")

    # Track conversation for this turn
    turn_messages = list(truncated_messages)  # Copy to avoid mutation
    tool_rounds = 0

    while tool_rounds < config.max_tool_rounds:
        tool_rounds += 1

        logger.debug(f"[{request_id}] Tool round {tool_rounds}/{config.max_tool_rounds}")

        # Collect the response and tool calls
        assistant_content: list[dict[str, Any]] = []
        tool_calls: list[dict[str, Any]] = []
        stop_reason: str | None = None

        try:
            async with asyncio.timeout(config.stream_timeout):
                async with create_stream(
                    messages=turn_messages,
                    system=system_prompt,
                    tools=tools,
                ) as stream:
                    async for event in stream:
                        event_type = getattr(event, "type", None)

                        # Content block started
                        if event_type == "content_block_start":
                            block = event.content_block
                            if block.type == "text":
                                assistant_content.append({
                                    "type": "text",
                                    "text": "",
                                })
                            elif block.type == "tool_use":
                                tool_calls.append({
                                    "id": block.id,
                                    "name": block.name,
                                    "input": "",  # Will accumulate
                                })
                                yield StreamEvent(
                                    type="tool_start",
                                    data={"id": block.id, "name": block.name},
                                )

                        # Content block delta
                        elif event_type == "content_block_delta":
                            delta = event.delta
                            if delta.type == "text_delta":
                                # Append to last text block
                                if assistant_content and assistant_content[-1]["type"] == "text":
                                    assistant_content[-1]["text"] += delta.text
                                yield StreamEvent(
                                    type="text",
                                    data={"text": delta.text},
                                )
                            elif delta.type == "input_json_delta":
                                # Accumulate tool input
                                if tool_calls:
                                    tool_calls[-1]["input"] += delta.partial_json

                        # Content block stopped
                        elif event_type == "content_block_stop":
                            # Parse tool input if we just finished a tool block
                            if tool_calls and isinstance(tool_calls[-1]["input"], str):
                                try:
                                    tool_calls[-1]["input"] = json.loads(
                                        tool_calls[-1]["input"] or "{}"
                                    )
                                except json.JSONDecodeError:
                                    tool_calls[-1]["input"] = {}
                                    logger.warning(
                                        f"[{request_id}] Failed to parse tool input for {tool_calls[-1]['id']}"
                                    )

                                # Yield the complete tool input
                                yield StreamEvent(
                                    type="tool_input",
                                    data={
                                        "id": tool_calls[-1]["id"],
                                        "name": tool_calls[-1]["name"],
                                        "input": tool_calls[-1]["input"],
                                    },
                                )

                        # Message complete
                        elif event_type == "message_stop":
                            final_message = await stream.get_final_message()
                            stop_reason = final_message.stop_reason
                            logger.debug(
                                f"[{request_id}] Stream complete: "
                                f"in={final_message.usage.input_tokens}, "
                                f"out={final_message.usage.output_tokens}"
                            )

        except asyncio.TimeoutError:
            logger.error(f"[{request_id}] Stream timeout after {config.stream_timeout}s")
            yield StreamEvent(
                type="error",
                data={"message": "AI response timed out. Please try again."},
            )
            return

        except Exception as e:
            logger.exception(f"[{request_id}] Stream error: {e}")
            error_type = type(e).__name__
            yield StreamEvent(
                type="error",
                data={"message": f"Error ({error_type}): {str(e)[:100]}"},
            )
            return

        # Build assistant message content for history
        final_assistant_content = []
        for block in assistant_content:
            if block["type"] == "text" and block["text"]:
                final_assistant_content.append(block)

        for tool_call in tool_calls:
            final_assistant_content.append({
                "type": "tool_use",
                "id": tool_call["id"],
                "name": tool_call["name"],
                "input": tool_call["input"],
            })

        # Add assistant message to turn history
        if final_assistant_content:
            turn_messages.append({
                "role": "assistant",
                "content": final_assistant_content,
            })

        # If no tool calls, we're done
        if stop_reason != "tool_use" or not tool_calls:
            logger.info(f"[{request_id}] Complete (stop_reason: {stop_reason}, rounds: {tool_rounds})")
            yield StreamEvent(
                type="done",
                data={"stop_reason": stop_reason or "end_turn"},
            )
            return

        # Execute tools and add results
        tool_results: list[dict[str, Any]] = []

        for tool_call in tool_calls:
            tool_id = tool_call["id"]
            tool_name = tool_call["name"]
            tool_input = tool_call["input"]

            logger.info(f"[{request_id}] Executing: {tool_name}")

            try:
                result = await execute_tool(
                    tool_name=tool_name,
                    tool_input=tool_input,
                    user_id=user_context.user_id if user_context else None,
                )

                # Truncate large results to prevent context overflow
                result_content = _truncate_tool_result(result)

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_id,
                    "content": result_content,
                })

                yield StreamEvent(
                    type="tool_result",
                    data={
                        "id": tool_id,
                        "name": tool_name,
                        "result": result,
                        "is_error": False,
                    },
                )

            except Exception as e:
                logger.exception(f"[{request_id}] Tool error ({tool_name}): {e}")

                error_message = f"Error executing {tool_name}: {str(e)}"
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_id,
                    "content": error_message,
                    "is_error": True,
                })

                yield StreamEvent(
                    type="tool_result",
                    data={
                        "id": tool_id,
                        "name": tool_name,
                        "result": {"error": error_message},
                        "is_error": True,
                    },
                )

        # Add tool results to conversation
        turn_messages.append({
            "role": "user",
            "content": tool_results,
        })

        # Continue the loop for Claude to process tool results

    # If we hit max rounds, end gracefully
    logger.warning(f"[{request_id}] Max tool rounds reached ({config.max_tool_rounds})")
    yield StreamEvent(
        type="done",
        data={"stop_reason": "max_tool_rounds"},
    )


# -----------------------------------------------------------------------------
# Simplified interface for chat endpoint
# -----------------------------------------------------------------------------


async def chat(
    user_message: str,
    conversation_history: list[dict[str, Any]],
    user_id: str,
    user_name: str | None = None,
    user_email: str | None = None,
    user_preferences: dict[str, Any] | None = None,
    conversation_context: dict[str, Any] | None = None,
) -> AsyncGenerator[StreamEvent, None]:
    """
    Simplified chat interface for the API endpoint.

    Args:
        user_message: The new user message
        conversation_history: Previous messages in Claude format
        user_id: User ID for tool execution
        user_name: User's display name
        user_email: User's email
        user_preferences: User preferences dict
        conversation_context: Current conversation state

    Yields:
        StreamEvent objects
    """
    # Build messages list
    messages = list(conversation_history)
    messages.append({
        "role": "user",
        "content": user_message,
    })

    # Build contexts
    user_ctx = UserContext(
        user_id=user_id,
        name=user_name,
        email=user_email,
        preferences=user_preferences,
    )

    conv_ctx = None
    if conversation_context:
        conv_ctx = ConversationContext(**conversation_context)

    # Run conversation
    async for event in run_conversation(
        messages=messages,
        user_context=user_ctx,
        conversation_context=conv_ctx,
    ):
        yield event


# -----------------------------------------------------------------------------
# Helper to extract assistant text from events
# -----------------------------------------------------------------------------


def extract_text_from_events(events: list[StreamEvent]) -> str:
    """
    Extract concatenated text from a list of stream events.

    Useful for saving the final assistant message to the database.
    """
    text_parts = []
    for event in events:
        if event.type == "text":
            text_parts.append(event.data.get("text", ""))
    return "".join(text_parts)


def extract_tool_calls_from_events(events: list[StreamEvent]) -> list[dict[str, Any]]:
    """
    Extract tool calls from a list of stream events.

    Returns list of {id, name, input, result} dicts.
    """
    tool_calls: dict[str, dict[str, Any]] = {}

    for event in events:
        if event.type == "tool_input":
            tool_id = event.data["id"]
            tool_calls[tool_id] = {
                "id": tool_id,
                "name": event.data["name"],
                "input": event.data["input"],
                "result": None,
            }
        elif event.type == "tool_result":
            tool_id = event.data["id"]
            if tool_id in tool_calls:
                tool_calls[tool_id]["result"] = event.data["result"]
                tool_calls[tool_id]["is_error"] = event.data.get("is_error", False)

    return list(tool_calls.values())

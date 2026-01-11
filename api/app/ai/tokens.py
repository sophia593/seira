"""
Token counting and context window management for Seira.

This module provides utilities to estimate token counts and manage
context window limits to prevent overflow errors.

Usage:
    from app.ai.tokens import estimate_tokens, truncate_messages

    token_count = estimate_tokens(messages, system_prompt)
    if token_count > MAX_CONTEXT_TOKENS:
        messages = truncate_messages(messages, MAX_CONTEXT_TOKENS)
"""

from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Claude's tokenizer is similar to cl100k_base
# Average ~4 characters per token for English text
CHARS_PER_TOKEN = 3.5


def estimate_tokens(
    messages: list[dict[str, Any]],
    system: str | None = None,
) -> int:
    """
    Estimate token count for messages and system prompt.

    This is a fast approximation. For exact counts, use tiktoken.

    Args:
        messages: List of message dicts in Claude format
        system: Optional system prompt

    Returns:
        Estimated token count
    """
    total_chars = 0

    if system:
        total_chars += len(system)

    for message in messages:
        content = message.get("content", "")

        if isinstance(content, str):
            total_chars += len(content)
        elif isinstance(content, list):
            total_chars += len(json.dumps(content, ensure_ascii=False))
        else:
            total_chars += len(str(content))

        # Role overhead
        total_chars += 40

    # Add overhead for JSON structure
    return int(total_chars / CHARS_PER_TOKEN * 1.1)


def truncate_messages(
    messages: list[dict[str, Any]],
    max_tokens: int,
    system: str | None = None,
    preserve_recent: int = 4,
    preserve_first: int = 1,
) -> list[dict[str, Any]]:
    """
    Truncate messages to fit within token limit.

    Strategy:
    1. Always keep first N messages (initial context)
    2. Always keep last N messages (recent context)
    3. Drop middle messages, add summary placeholder

    Args:
        messages: Full message history
        max_tokens: Maximum tokens allowed
        system: System prompt (counted against limit)
        preserve_recent: Number of recent messages to always keep
        preserve_first: Number of first messages to always keep

    Returns:
        Truncated message list
    """
    current_tokens = estimate_tokens(messages, system)

    if current_tokens <= max_tokens:
        return messages

    logger.warning(
        f"Context too large ({current_tokens} tokens > {max_tokens}), truncating"
    )

    # If very few messages, truncate tool results instead
    if len(messages) <= preserve_first + preserve_recent:
        return _truncate_tool_results(messages, max_tokens, system)

    # Keep first and last messages
    first_messages = messages[:preserve_first]
    recent_messages = messages[-preserve_recent:]
    middle_messages = messages[preserve_first:-preserve_recent]

    # Calculate tokens for preserved messages
    preserved_tokens = estimate_tokens(first_messages + recent_messages, system)

    if preserved_tokens >= max_tokens:
        return _truncate_tool_results(first_messages + recent_messages, max_tokens, system)

    # Add middle messages until we hit limit
    available_tokens = max_tokens - preserved_tokens - 500
    truncated_middle = []

    for message in reversed(middle_messages):
        msg_tokens = estimate_tokens([message])
        if available_tokens >= msg_tokens:
            truncated_middle.insert(0, message)
            available_tokens -= msg_tokens
        else:
            break

    # Add summary placeholder if we dropped messages
    dropped_count = len(middle_messages) - len(truncated_middle)
    if dropped_count > 0:
        summary_message = {
            "role": "user",
            "content": f"[{dropped_count} earlier messages summarized: The conversation covered event searches, flight options, and travel planning.]",
        }
        result = first_messages + [summary_message] + truncated_middle + recent_messages
    else:
        result = first_messages + truncated_middle + recent_messages

    final_tokens = estimate_tokens(result, system)
    logger.info(f"Truncated context: {current_tokens} → {final_tokens} tokens")

    return result


def _truncate_tool_results(
    messages: list[dict[str, Any]],
    max_tokens: int,
    system: str | None = None,
) -> list[dict[str, Any]]:
    """Truncate large tool results within messages."""
    truncated = []

    for message in messages:
        content = message.get("content")

        if isinstance(content, list):
            new_content = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_result":
                    result_content = block.get("content", "")
                    if isinstance(result_content, str) and len(result_content) > 2000:
                        truncated_result = _truncate_json_result(result_content)
                        new_content.append({**block, "content": truncated_result})
                    else:
                        new_content.append(block)
                else:
                    new_content.append(block)
            truncated.append({**message, "content": new_content})
        else:
            truncated.append(message)

    return truncated


def _truncate_json_result(result: str, max_items: int = 5) -> str:
    """Truncate JSON result to max_items if it's a list."""
    try:
        data = json.loads(result)

        if isinstance(data, dict):
            for key in ["events", "flights", "results", "items", "data"]:
                if key in data and isinstance(data[key], list):
                    original_count = len(data[key])
                    if original_count > max_items:
                        data[key] = data[key][:max_items]
                        data["_truncated"] = f"Showing {max_items} of {original_count}"
                        break

        elif isinstance(data, list) and len(data) > max_items:
            original_count = len(data)
            data = data[:max_items]
            data.append({"_truncated": f"Showing {max_items} of {original_count}"})

        return json.dumps(data, ensure_ascii=False)

    except json.JSONDecodeError:
        if len(result) > 2000:
            return result[:1900] + "... [truncated]"
        return result

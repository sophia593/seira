"""
Chat API - Streaming chat endpoint with AI responses.

POST /chat - Send a message and stream the AI response via SSE.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.auth import User, get_current_user, require_owner
from app.core.config import get_settings
from app.services import conversation as conversation_service
from app.services import message as message_service
from app.services import user as user_service
from app.ai import chat as ai_chat
from app.ai.sse import sse_from_stream_event, sse_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


def _generate_title(message: str, max_length: int = 40) -> str:
    """Generate a clean conversation title from the first message."""
    import re

    # Clean up and take first line
    title = message.strip().split("\n")[0].strip()
    original_title = title

    # Remove filler phrases first (before checking if it's a question)
    filler_prefixes = [
        r"^i mean,?\s*",
        r"^okay,?\s*",
        r"^ok,?\s*",
        r"^so,?\s*",
        r"^well,?\s*",
        r"^hey,?\s*",
        r"^hi,?\s*",
        r"^hello,?\s*",
        r"^um+,?\s*",
        r"^like,?\s*",
        r"^actually,?\s*",
    ]
    for pattern in filler_prefixes:
        title = re.sub(pattern, "", title, flags=re.IGNORECASE)

    # Skip pure questions without substance (these make bad titles)
    title_lower = title.lower().strip()
    question_only_patterns = [
        r"^what (is|are|city|cities|date|time|about|else)",
        r"^where (is|are|can|do)",
        r"^when (is|are|can|do)",
        r"^how (do|can|much|many|about)",
        r"^which (one|city|date)",
        r"^can you",
        r"^do you",
        r"^is there",
        r"^are there",
        r"^what's ",
    ]
    for pattern in question_only_patterns:
        if re.match(pattern, title_lower):
            return "new chat"

    # Remove common request prefixes (order matters - more specific first)
    request_prefixes = [
        r"^i('m| am) (looking to|trying to|wanting to)\s*",
        r"^i('d| would) (like to|love to|want to)\s*",
        r"^i (really )?(want to|need to|have to|wanna)\s*",
        r"^(find me|search for|look for|show me|get me)\s*",
        r"^(find|search|look)\s+",
        r"^(can you|could you|please)\s*(find|search|show|help|get)?\s*(me\s*)?",
        r"^(help me|help us)\s*(find|search|with|plan)?\s*",
        r"^(see|attend|go to|visit)\s*",
    ]
    for pattern in request_prefixes:
        title = re.sub(pattern, "", title, flags=re.IGNORECASE)

    # Clean up any double spaces and trim
    title = re.sub(r"\s+", " ", title).strip()

    # If we stripped everything, use original but cleaned
    if not title or len(title) < 3:
        title = re.sub(r"\s+", " ", original_title).strip()

    # Capitalize first letter
    if title:
        title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()

    # Smart truncation - don't cut words in half
    if len(title) > max_length:
        truncated = title[:max_length - 3]
        # Find last space to avoid cutting mid-word
        last_space = truncated.rfind(" ")
        if last_space > max_length // 2:  # Only if we don't lose too much
            truncated = truncated[:last_space]
        title = truncated.rstrip() + "..."

    return title.strip() or "new chat"


# -----------------------------------------------------------------------------
# Request/Response models
# -----------------------------------------------------------------------------


class ChatRequest(BaseModel):
    """Request body for the chat endpoint."""

    message: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[str] = None


class ChatStartResponse(BaseModel):
    """Initial response before streaming begins."""

    conversation_id: str
    message_id: str


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------


def _db_messages_to_claude_format(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Convert database message format to Claude API format.

    DB format: { role, content, tool_calls, tool_call_id }
    Claude format: { role, content } where content can be string or list of blocks
    """
    claude_messages = []

    for msg in messages:
        role = msg["role"]
        content = msg.get("content", "")

        # Skip system messages (handled separately in system prompt)
        if role == "system":
            continue

        # Handle tool role (tool results)
        if role == "tool":
            # Tool results go in a user message with tool_result blocks
            # Group consecutive tool messages together
            tool_result = {
                "type": "tool_result",
                "tool_use_id": msg.get("tool_call_id", ""),
                "content": content,
            }

            # Check if last message is already a user message with tool results
            if claude_messages and claude_messages[-1]["role"] == "user":
                last_content = claude_messages[-1]["content"]
                if isinstance(last_content, list):
                    claude_messages[-1]["content"].append(tool_result)
                    continue

            claude_messages.append({
                "role": "user",
                "content": [tool_result],
            })
            continue

        # Handle assistant messages with tool calls
        if role == "assistant":
            tool_calls = msg.get("tool_calls")
            if tool_calls:
                # Build content blocks
                blocks = []
                if content:
                    blocks.append({"type": "text", "text": content})
                for tc in tool_calls:
                    blocks.append({
                        "type": "tool_use",
                        "id": tc.get("id", ""),
                        "name": tc.get("name", ""),
                        "input": tc.get("input", {}),
                    })
                claude_messages.append({
                    "role": "assistant",
                    "content": blocks,
                })
            else:
                claude_messages.append({
                    "role": "assistant",
                    "content": content,
                })
            continue

        # User messages
        if role == "user":
            claude_messages.append({
                "role": "user",
                "content": content,
            })

    return claude_messages


# -----------------------------------------------------------------------------
# Main chat endpoint
# -----------------------------------------------------------------------------


@router.post("")
async def chat(
    body: ChatRequest,
    current: User = Depends(get_current_user),
):
    """
    Send a message and stream the AI response.

    Returns a Server-Sent Events stream with the following event types:
    - `start`: Initial metadata (conversation_id, message_id)
    - `text`: Text chunk from the AI
    - `tool_start`: Tool execution starting
    - `tool_input`: Complete tool input received
    - `tool_result`: Tool execution result
    - `done`: Stream complete
    - `error`: An error occurred
    """
    request_start = time.time()
    settings = get_settings()
    conversation_id = body.conversation_id
    user_message = body.message

    logger.info(f"[TIMING] Chat request started: conv_id={conversation_id}, msg_len={len(user_message)}")

    # Get or create conversation
    t0 = time.time()
    if conversation_id:
        conversation = await conversation_service.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        require_owner(current, conversation["user_id"])
    else:
        # Create new conversation with auto-generated title
        title = _generate_title(user_message)
        conversation = await conversation_service.create_conversation(
            user_id=current.id,
            title=title,
        )
        conversation_id = conversation["id"]
    logger.info(f"[TIMING] Get/create conversation: {(time.time() - t0) * 1000:.1f}ms")

    # Save user message
    t0 = time.time()
    user_msg = await message_service.save_user_message(
        conversation_id=conversation_id,
        content=user_message,
    )
    logger.info(f"[TIMING] Save user message: {(time.time() - t0) * 1000:.1f}ms")

    # Get user info for personalization
    t0 = time.time()
    user_row = await user_service.get_user_row(current.id)
    prefs_row = await user_service.get_preferences_row(current.id)

    user_name = user_row.get("name") if user_row else None
    user_email = current.email
    user_preferences = None
    if prefs_row:
        user_preferences = {
            "home_airport": prefs_row.get("home_airport"),
            "cabin_class": prefs_row.get("cabin_class"),
            "seat_preference": prefs_row.get("seat_preference"),
            "budget_default": prefs_row.get("budget_default"),
            "preferred_airlines": prefs_row.get("preferred_airlines"),
        }
    logger.info(f"[TIMING] Get user info: {(time.time() - t0) * 1000:.1f}ms")

    # Get conversation context
    conv_context = conversation.get("context") or {}

    # Get conversation history for context
    t0 = time.time()
    history_messages = await message_service.get_messages_for_context(
        conversation_id=conversation_id,
        max_messages=20,
        include_system=False,
        include_tool=True,  # Need tool messages for proper context
    )

    # Convert to Claude format (exclude the message we just saved)
    claude_history = _db_messages_to_claude_format(history_messages[:-1])
    logger.info(f"[TIMING] Get conversation history ({len(history_messages)} msgs): {(time.time() - t0) * 1000:.1f}ms")
    logger.info(f"[TIMING] Total setup time: {(time.time() - request_start) * 1000:.1f}ms")

    async def generate_stream():
        """Generate SSE stream from AI response."""
        text_buffer: list[str] = []
        pending_tool_calls: list[dict] = []

        # Send start event with conversation and message IDs
        yield sse_event("start", {
            "conversation_id": conversation_id,
            "message_id": user_msg["id"],
        })

        try:
            async for event in ai_chat(
                user_message=user_message,
                conversation_history=claude_history,
                user_id=current.id,
                user_name=user_name,
                user_email=user_email,
                user_preferences=user_preferences,
                conversation_context=conv_context,
            ):
                yield sse_from_stream_event(event)

                # Accumulate text
                if event.type == "text":
                    text_buffer.append(event.data.get("text", ""))

                # Track tool calls
                elif event.type == "tool_input":
                    pending_tool_calls.append({
                        "id": event.data["id"],
                        "name": event.data["name"],
                        "input": event.data["input"],
                    })

                # Save tool result messages as they complete
                elif event.type == "tool_result":
                    tool_id = event.data["id"]
                    result = event.data.get("result", {})
                    is_error = event.data.get("is_error", False)

                    # If we have pending text + tool calls, save assistant message first
                    if pending_tool_calls:
                        await message_service.save_assistant_message(
                            conversation_id=conversation_id,
                            content="".join(text_buffer),
                            tool_calls=pending_tool_calls,
                            model_version=settings.CLAUDE_MODEL,
                        )
                        text_buffer.clear()
                        pending_tool_calls.clear()

                    # Save tool result message
                    await message_service.save_tool_message(
                        conversation_id=conversation_id,
                        content=json.dumps(result) if isinstance(result, dict) else str(result),
                        tool_call_id=tool_id,
                    )

            # Save final assistant message (text after all tool calls)
            final_text = "".join(text_buffer)
            if final_text or pending_tool_calls:
                await message_service.save_assistant_message(
                    conversation_id=conversation_id,
                    content=final_text,
                    tool_calls=pending_tool_calls if pending_tool_calls else None,
                    model_version=settings.CLAUDE_MODEL,
                )

        except Exception as e:
            logger.exception(f"Error in chat stream: {e}")
            yield sse_event("error", {"message": "An error occurred. Please try again."})

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )

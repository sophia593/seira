"""
Chat API - Streaming chat endpoint with AI responses.

POST /chat - Send a message and stream the AI response via SSE.
"""

from __future__ import annotations

import json
import logging
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
    settings = get_settings()
    conversation_id = body.conversation_id
    user_message = body.message

    # Get or create conversation
    if conversation_id:
        conversation = await conversation_service.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        require_owner(current, conversation["user_id"])
    else:
        # Create new conversation
        conversation = await conversation_service.create_conversation(
            user_id=current.id,
            title=None,  # Can be set later or auto-generated
        )
        conversation_id = conversation["id"]

    # Save user message
    user_msg = await message_service.save_user_message(
        conversation_id=conversation_id,
        content=user_message,
    )

    # Get user info for personalization
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

    # Get conversation context
    conv_context = conversation.get("context") or {}

    # Get conversation history for context
    history_messages = await message_service.get_messages_for_context(
        conversation_id=conversation_id,
        max_messages=20,
        include_system=False,
        include_tool=True,  # Need tool messages for proper context
    )

    # Convert to Claude format (exclude the message we just saved)
    claude_history = _db_messages_to_claude_format(history_messages[:-1])

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

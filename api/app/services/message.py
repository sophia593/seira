"""
Message service - business logic for chat messages.
"""

from __future__ import annotations

from typing import Any, Optional, List, Dict

import anyio
from fastapi import HTTPException, status

from app.core.database import get_supabase


# -----------------------------------------------------------------------------
# Database helpers
# -----------------------------------------------------------------------------


def _sb_exec(query):
    """Execute a supabase-py query and normalize errors."""
    res = query.execute()
    err = getattr(res, "error", None)
    if err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {err}",
        )
    return getattr(res, "data", None)


async def _exec(query):
    """Async wrapper for supabase queries."""
    return await anyio.to_thread.run_sync(_sb_exec, query)


# -----------------------------------------------------------------------------
# Core message operations
# -----------------------------------------------------------------------------


async def get_message(message_id: str) -> Optional[Dict[str, Any]]:
    """Get a single message by ID."""
    sb = get_supabase()
    data = await _exec(
        sb.table("messages").select("*").eq("id", message_id).limit(1)
    )
    if not data:
        return None
    return data[0]


async def get_messages(
    conversation_id: str,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """
    Get messages for a conversation.
    Returns messages ordered by created_at ascending (oldest first).
    """
    sb = get_supabase()

    start = offset
    end = offset + limit - 1

    data = await _exec(
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .range(start, end)
    )
    return data or []


async def count_messages(conversation_id: str) -> int:
    """Count total messages in a conversation."""
    sb = get_supabase()
    res = (
        sb.table("messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .execute()
    )
    return res.count if res.count is not None else 0


# -----------------------------------------------------------------------------
# Create messages
# -----------------------------------------------------------------------------


async def create_message(
    conversation_id: str,
    role: str,
    content: str,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    tool_call_id: Optional[str] = None,
    tokens_used: Optional[int] = None,
    model_version: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a new message in a conversation.
    The conversation's message_count and updated_at are updated by a DB trigger.
    """
    sb = get_supabase()

    payload: Dict[str, Any] = {
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
    }
    if tool_calls is not None:
        payload["tool_calls"] = tool_calls
    if tool_call_id is not None:
        payload["tool_call_id"] = tool_call_id
    if tokens_used is not None:
        payload["tokens_used"] = tokens_used
    if model_version is not None:
        payload["model_version"] = model_version

    data = await _exec(sb.table("messages").insert(payload))
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create message")

    return data[0]


async def save_user_message(
    conversation_id: str,
    content: str,
) -> Dict[str, Any]:
    """Save a user message to a conversation."""
    return await create_message(
        conversation_id=conversation_id,
        role="user",
        content=content,
    )


async def save_assistant_message(
    conversation_id: str,
    content: str,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    tokens_used: Optional[int] = None,
    model_version: Optional[str] = None,
) -> Dict[str, Any]:
    """Save an assistant message to a conversation."""
    return await create_message(
        conversation_id=conversation_id,
        role="assistant",
        content=content,
        tool_calls=tool_calls,
        tokens_used=tokens_used,
        model_version=model_version,
    )


async def save_system_message(
    conversation_id: str,
    content: str,
) -> Dict[str, Any]:
    """Save a system message to a conversation."""
    return await create_message(
        conversation_id=conversation_id,
        role="system",
        content=content,
    )


async def save_tool_message(
    conversation_id: str,
    content: str,
    tool_call_id: str,
) -> Dict[str, Any]:
    """Save a tool response message to a conversation."""
    return await create_message(
        conversation_id=conversation_id,
        role="tool",
        content=content,
        tool_call_id=tool_call_id,
    )


# -----------------------------------------------------------------------------
# Batch operations
# -----------------------------------------------------------------------------


async def save_message_pair(
    conversation_id: str,
    user_content: str,
    assistant_content: str,
    tokens_used: Optional[int] = None,
    model_version: Optional[str] = None,
) -> Dict[str, Any]:
    """Save a user message and assistant response pair."""
    user_msg = await save_user_message(conversation_id, user_content)
    assistant_msg = await save_assistant_message(
        conversation_id=conversation_id,
        content=assistant_content,
        tokens_used=tokens_used,
        model_version=model_version,
    )
    return {
        "user_message": user_msg,
        "assistant_message": assistant_msg,
    }


async def get_recent_messages(
    conversation_id: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Get the most recent messages for a conversation.
    Returns messages ordered oldest to newest (for chat context).
    """
    sb = get_supabase()

    # Get the last N messages by created_at desc, then reverse
    data = await _exec(
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=True)
        .limit(limit)
    )

    # Reverse to get oldest-first order
    return list(reversed(data or []))


async def get_messages_for_context(
    conversation_id: str,
    max_messages: int = 20,
    include_system: bool = True,
    include_tool: bool = False,
    exclude_message_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Get recent messages for LLM context.

    Key feature: you can exclude a specific message by ID.
    This prevents accidental "memory loss" caused by removing the wrong message.
    """
    # Fetch a little extra so we still have enough after exclusions
    messages = await get_recent_messages(conversation_id, limit=max_messages + 5)

    # Exclude roles if needed
    excluded_roles: List[str] = []
    if not include_system:
        excluded_roles.append("system")
    if not include_tool:
        excluded_roles.append("tool")

    if excluded_roles:
        messages = [m for m in messages if m.get("role") not in excluded_roles]

    # Exclude a specific message (usually the one we just saved)
    if exclude_message_id:
        messages = [m for m in messages if m.get("id") != exclude_message_id]

    # Keep only the most recent max_messages, in oldest->newest order
    if len(messages) > max_messages:
        messages = messages[-max_messages:]

    return messages

"""
Conversation service - business logic for conversations and messages.
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
# Conversation operations
# -----------------------------------------------------------------------------


async def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """Get a single conversation by ID."""
    sb = get_supabase()
    data = await _exec(
        sb.table("conversations").select("*").eq("id", conversation_id).limit(1)
    )
    if not data:
        return None
    return data[0]


async def list_conversations(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    include_archived: bool = False,
) -> List[Dict[str, Any]]:
    """
    List conversations for a user.
    Returns conversations ordered by most recently updated.
    """
    sb = get_supabase()
    query = sb.table("conversations").select("*").eq("user_id", user_id)

    if not include_archived:
        query = query.eq("is_archived", False)

    query = query.order("updated_at", desc=True).range(offset, offset + limit - 1)
    data = await _exec(query)
    return data or []


async def count_conversations(user_id: str, include_archived: bool = False) -> int:
    """Count total conversations for a user."""
    sb = get_supabase()
    query = sb.table("conversations").select("id", count="exact").eq("user_id", user_id)

    if not include_archived:
        query = query.eq("is_archived", False)

    res = query.execute()
    return res.count if res.count is not None else 0


async def create_conversation(
    user_id: str,
    title: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a new conversation."""
    sb = get_supabase()
    payload: Dict[str, Any] = {"user_id": user_id}

    if title:
        payload["title"] = title.strip()
    if context:
        payload["context"] = context

    data = await _exec(sb.table("conversations").insert(payload))
    if not data:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    return data[0]


async def update_conversation(
    conversation_id: str,
    title: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Update a conversation's title and/or context."""
    updates: Dict[str, Any] = {}

    if title is not None:
        updates["title"] = title.strip() if title else None
    if context is not None:
        updates["context"] = context

    if not updates:
        # No changes - return existing
        conv = await get_conversation(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conv

    sb = get_supabase()
    data = await _exec(
        sb.table("conversations").update(updates).eq("id", conversation_id)
    )
    if not data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return data[0]


async def archive_conversation(conversation_id: str) -> None:
    """Soft delete a conversation by setting is_archived to true."""
    sb = get_supabase()
    await _exec(
        sb.table("conversations")
        .update({"is_archived": True})
        .eq("id", conversation_id)
    )


async def unarchive_conversation(conversation_id: str) -> None:
    """Restore an archived conversation."""
    sb = get_supabase()
    await _exec(
        sb.table("conversations")
        .update({"is_archived": False})
        .eq("id", conversation_id)
    )


async def delete_conversation(conversation_id: str) -> None:
    """Hard delete a conversation and its messages (cascade)."""
    sb = get_supabase()
    await _exec(sb.table("conversations").delete().eq("id", conversation_id))


async def set_conversation_title(
    conversation_id: str,
    title: str,
) -> Dict[str, Any]:
    """Set the title of a conversation."""
    return await update_conversation(conversation_id, title=title)


# -----------------------------------------------------------------------------
# Message operations
# -----------------------------------------------------------------------------


async def get_messages(
    conversation_id: str,
    limit: int = 100,
    before_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Get messages for a conversation.
    Returns messages ordered by created_at ascending (oldest first).
    """
    sb = get_supabase()
    query = (
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .limit(limit)
    )
    data = await _exec(query)
    return data or []


async def get_message(message_id: str) -> Optional[Dict[str, Any]]:
    """Get a single message by ID."""
    sb = get_supabase()
    data = await _exec(
        sb.table("messages").select("*").eq("id", message_id).limit(1)
    )
    if not data:
        return None
    return data[0]


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


async def create_user_message(
    conversation_id: str,
    content: str,
) -> Dict[str, Any]:
    """Create a user message."""
    return await create_message(conversation_id, "user", content)


async def create_assistant_message(
    conversation_id: str,
    content: str,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    tokens_used: Optional[int] = None,
    model_version: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an assistant message."""
    return await create_message(
        conversation_id,
        "assistant",
        content,
        tool_calls=tool_calls,
        tokens_used=tokens_used,
        model_version=model_version,
    )


async def create_system_message(
    conversation_id: str,
    content: str,
) -> Dict[str, Any]:
    """Create a system message."""
    return await create_message(conversation_id, "system", content)


async def create_tool_message(
    conversation_id: str,
    content: str,
    tool_call_id: str,
) -> Dict[str, Any]:
    """Create a tool response message."""
    return await create_message(
        conversation_id,
        "tool",
        content,
        tool_call_id=tool_call_id,
    )


# -----------------------------------------------------------------------------
# Composite operations
# -----------------------------------------------------------------------------


async def get_conversation_with_messages(
    conversation_id: str,
    message_limit: int = 100,
) -> Optional[Dict[str, Any]]:
    """Get a conversation with its messages."""
    conversation = await get_conversation(conversation_id)
    if not conversation:
        return None

    messages = await get_messages(conversation_id, limit=message_limit)

    return {
        "conversation": conversation,
        "messages": messages,
    }


async def start_conversation(
    user_id: str,
    initial_message: Optional[str] = None,
    title: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a new conversation, optionally with an initial user message.
    Returns the conversation and any messages created.
    """
    conversation = await create_conversation(user_id, title=title, context=context)
    messages = []

    if initial_message:
        msg = await create_user_message(conversation["id"], initial_message)
        messages.append(msg)

    return {
        "conversation": conversation,
        "messages": messages,
    }


async def generate_title_from_message(content: str, max_length: int = 50) -> str:
    """
    Generate a conversation title from the first message content.
    Simple implementation - can be enhanced with AI summarization later.
    """
    # Strip whitespace and take first line
    title = content.strip().split("\n")[0]

    # Truncate if too long
    if len(title) > max_length:
        title = title[: max_length - 3].rstrip() + "..."

    return title


async def auto_title_conversation(
    conversation_id: str,
    from_content: str,
) -> Dict[str, Any]:
    """
    Automatically set conversation title from content if not already set.
    """
    conversation = await get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Only set title if currently empty
    if conversation.get("title"):
        return conversation

    title = await generate_title_from_message(from_content)
    return await set_conversation_title(conversation_id, title)

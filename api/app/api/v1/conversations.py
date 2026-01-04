"""
Conversations API routes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional, List, Dict

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.core.auth import User, get_current_user, require_owner
from app.services import conversation as conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str  # 'system' | 'user' | 'assistant' | 'tool'
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_call_id: Optional[str] = None
    tokens_used: Optional[int] = None
    model_version: Optional[str] = None
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    context: Dict[str, Any] = {}
    message_count: int = 0
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime


class ConversationWithMessagesResponse(BaseModel):
    conversation: ConversationResponse
    messages: List[MessageResponse]


class CreateConversationRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    context: Optional[Dict[str, Any]] = None


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    context: Optional[Dict[str, Any]] = None


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: CreateConversationRequest = None,
    current: User = Depends(get_current_user),
):
    """Create a new conversation for the current user."""
    title = body.title if body else None
    context = body.context if body else None

    conversation = await conversation_service.create_conversation(
        user_id=current.id,
        title=title,
        context=context,
    )
    return conversation


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    include_archived: bool = Query(default=False),
):
    """
    List conversations for the current user.
    Returns conversations ordered by most recently updated.
    """
    conversations = await conversation_service.list_conversations(
        user_id=current.id,
        limit=limit,
        offset=offset,
        include_archived=include_archived,
    )
    return conversations


@router.get("/{conversation_id}", response_model=ConversationWithMessagesResponse)
async def get_conversation(
    conversation_id: str,
    current: User = Depends(get_current_user),
    message_limit: int = Query(default=100, ge=1, le=500),
):
    """Get a conversation with its messages."""
    conversation = await conversation_service.get_conversation(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    require_owner(current, conversation["user_id"])

    result = await conversation_service.get_conversation_with_messages(
        conversation_id=conversation_id,
        message_limit=message_limit,
    )
    return result


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    body: UpdateConversationRequest,
    current: User = Depends(get_current_user),
):
    """Update a conversation's title or context."""
    conversation = await conversation_service.get_conversation(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    require_owner(current, conversation["user_id"])

    updated = await conversation_service.update_conversation(
        conversation_id=conversation_id,
        title=body.title,
        context=body.context,
    )
    return updated


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current: User = Depends(get_current_user),
    hard_delete: bool = Query(default=False),
):
    """
    Delete (archive) a conversation.
    By default, sets is_archived to true (soft delete).
    Use hard_delete=true to permanently remove (not recommended).
    """
    conversation = await conversation_service.get_conversation(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    require_owner(current, conversation["user_id"])

    if hard_delete:
        await conversation_service.delete_conversation(conversation_id)
    else:
        await conversation_service.archive_conversation(conversation_id)

    return None

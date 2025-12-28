"""
Messages API routes.

Endpoints:
- GET  /conversations/{conversation_id}/messages
- POST /conversations/{conversation_id}/messages
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.auth import User, get_current_user, require_owner
from app.services import conversation as conversation_service
from app.services import message as message_service

router = APIRouter(prefix="/conversations", tags=["messages"])


# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    tool_calls: Optional[Dict[str, Any]] = None
    tool_call_id: Optional[str] = None
    tokens_used: Optional[int] = None
    model_version: Optional[str] = None
    created_at: datetime


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    conversation_id: str,
    current: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """
    Get paginated message history for a conversation.

    Returns messages ordered by created_at ASC (oldest first).
    """
    conversation = await conversation_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    require_owner(current, conversation["user_id"])

    messages = await message_service.get_messages(
        conversation_id=conversation_id,
        limit=limit,
        offset=offset,
    )

    return messages


@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    current: User = Depends(get_current_user),
):
    """
    Add a user message to a conversation.
    (Assistant response generation can be added later.)
    """
    conversation = await conversation_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    require_owner(current, conversation["user_id"])

    # Save the user message
    msg = await message_service.save_user_message(
        conversation_id=conversation_id,
        content=body.content,
    )

    return msg

"""
Agent API endpoints.

POST /api/v1/agents/risk       — SSE streaming risk analysis
POST /api/v1/agents/risk/sync  — Non-streaming risk analysis
POST /api/v1/agents/recap      — SSE streaming recap writer
POST /api/v1/agents/recap/sync — Non-streaming recap writer
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.auth import User, get_current_user
from app.core.database import get_supabase, execute
from app.agents.base import AgentContext
from app.agents.risk import RiskAgent
from app.agents.recap import RecapAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------


class AgentRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    org_id: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _verify_org_membership(user_id: str, org_id: str) -> str:
    """Verify user is a member of the org. Returns role. Raises 403 if not."""
    sb = get_supabase()
    rows = await execute(
        sb.table("organization_members")
        .select("role")
        .eq("user_id", user_id)
        .eq("org_id", org_id)
        .limit(1)
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization",
        )
    return rows[0]["role"]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/risk")
async def run_risk_agent(
    body: AgentRequest,
    user: User = Depends(get_current_user),
):
    """Run the risk agent with SSE streaming."""
    role = await _verify_org_membership(user.id, body.org_id)
    ctx = AgentContext(org_id=body.org_id, user_id=user.id, extra={"role": role})
    agent = RiskAgent(ctx=ctx)

    async def event_stream():
        try:
            async for chunk in agent.run_stream(body.message):
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.exception("Risk agent streaming error")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/risk/sync")
async def run_risk_agent_sync(
    body: AgentRequest,
    user: User = Depends(get_current_user),
):
    """Run the risk agent and return the full response."""
    role = await _verify_org_membership(user.id, body.org_id)
    ctx = AgentContext(org_id=body.org_id, user_id=user.id, extra={"role": role})
    agent = RiskAgent(ctx=ctx)
    result = await agent.run(body.message)
    return {"response": result}


# ---------------------------------------------------------------------------
# Recap agent
# ---------------------------------------------------------------------------


@router.post("/recap")
async def run_recap_agent(
    body: AgentRequest,
    user: User = Depends(get_current_user),
):
    """Run the recap writer agent with SSE streaming."""
    role = await _verify_org_membership(user.id, body.org_id)
    ctx = AgentContext(org_id=body.org_id, user_id=user.id, extra={"role": role})
    agent = RecapAgent(ctx=ctx)

    async def event_stream():
        try:
            async for chunk in agent.run_stream(body.message):
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.exception("Recap agent streaming error")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/recap/sync")
async def run_recap_agent_sync(
    body: AgentRequest,
    user: User = Depends(get_current_user),
):
    """Run the recap writer agent and return the full response."""
    role = await _verify_org_membership(user.id, body.org_id)
    ctx = AgentContext(org_id=body.org_id, user_id=user.id, extra={"role": role})
    agent = RecapAgent(ctx=ctx)
    result = await agent.run(body.message)
    return {"response": result}

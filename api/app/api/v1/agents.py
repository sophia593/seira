"""
Agent API endpoints.

POST /api/v1/agents/risk                 — SSE streaming risk analysis
POST /api/v1/agents/risk/sync            — Non-streaming risk analysis
POST /api/v1/agents/recap                — SSE streaming recap writer
POST /api/v1/agents/recap/sync           — Non-streaming recap writer
POST /api/v1/agents/intake               — SSE streaming intake suggestions
POST /api/v1/agents/intake/sync          — Non-streaming intake suggestions
POST /api/v1/agents/proof-validation/sync — Proof validation (vision + link check)
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
from app.agents.intake import IntakeAgent
from app.agents.proof_validation import ProofValidationAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------


class AgentRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    org_id: str


class ProofValidationRequest(BaseModel):
    proof_id: str
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


# ---------------------------------------------------------------------------
# Intake agent
# ---------------------------------------------------------------------------


@router.post("/intake")
async def run_intake_agent(
    body: AgentRequest,
    user: User = Depends(get_current_user),
):
    """Run the intake agent with SSE streaming."""
    role = await _verify_org_membership(user.id, body.org_id)
    ctx = AgentContext(org_id=body.org_id, user_id=user.id, extra={"role": role})
    agent = IntakeAgent(ctx=ctx)

    async def event_stream():
        try:
            async for chunk in agent.run_stream(body.message):
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.exception("Intake agent streaming error")
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


@router.post("/intake/sync")
async def run_intake_agent_sync(
    body: AgentRequest,
    user: User = Depends(get_current_user),
):
    """Run the intake agent and return the full response."""
    role = await _verify_org_membership(user.id, body.org_id)
    ctx = AgentContext(org_id=body.org_id, user_id=user.id, extra={"role": role})
    agent = IntakeAgent(ctx=ctx)
    result = await agent.run(body.message)
    return {"response": result}


# ---------------------------------------------------------------------------
# Proof validation agent
# ---------------------------------------------------------------------------


@router.post("/proof-validation/sync")
async def run_proof_validation_agent(
    body: ProofValidationRequest,
    user: User = Depends(get_current_user),
):
    """Validate a proof using vision (images) or content analysis (links)."""
    import httpx

    role = await _verify_org_membership(user.id, body.org_id)
    ctx = AgentContext(org_id=body.org_id, user_id=user.id, extra={"role": role})

    sb = get_supabase()

    # 1. Fetch proof record
    proof_rows = await execute(
        sb.table("proofs")
        .select("*")
        .eq("id", body.proof_id)
        .eq("org_id", body.org_id)
        .limit(1)
    )
    if not proof_rows:
        raise HTTPException(status_code=404, detail="Proof not found")
    proof = proof_rows[0]

    # 2. Fetch deliverable + partner name
    del_rows = await execute(
        sb.table("deliverables")
        .select("id, title, category, proof_required, partner_id")
        .eq("id", proof["deliverable_id"])
        .limit(1)
    )
    if not del_rows:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    deliverable = del_rows[0]

    partner_rows = await execute(
        sb.table("event_partners")
        .select("name")
        .eq("id", deliverable["partner_id"])
        .limit(1)
    )
    partner_name = partner_rows[0]["name"] if partner_rows else "Unknown"

    # 3. Build message based on proof type
    file_type = proof.get("file_type", "")
    agent = ProofValidationAgent(ctx=ctx)

    if file_type.startswith("image/"):
        # Image proof — use vision
        message = ProofValidationAgent.build_image_message(
            image_url=proof["file_url"],
            deliverable_title=deliverable["title"],
            category=deliverable["category"],
            partner_name=partner_name,
        )
    elif file_type == "text/uri-list":
        # Link proof — fetch URL content
        url = proof["file_url"]
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "Seira-ProofValidator/1.0"})
                resp.raise_for_status()
                url_content = resp.text
        except Exception as e:
            logger.warning("Failed to fetch proof URL %s: %s", url, e)
            # Store as invalid — URL not reachable
            validation_result = {
                "valid": False,
                "confidence": "high",
                "reason": f"Could not fetch URL: {str(e)[:200]}",
                "issues": ["URL is not reachable or returned an error"],
            }
            await execute(
                sb.table("proofs")
                .update({
                    "validation_status": "invalid",
                    "validation_result": json.dumps(validation_result),
                })
                .eq("id", body.proof_id)
            )
            return {"result": validation_result}

        message = ProofValidationAgent.build_link_message(
            url=url,
            url_content=url_content,
            deliverable_title=deliverable["title"],
            category=deliverable["category"],
            partner_name=partner_name,
        )
    else:
        # PDF, video, etc. — skip validation
        validation_result = {
            "valid": True,
            "confidence": "low",
            "reason": "Automated validation not available for this file type",
            "issues": [],
        }
        await execute(
            sb.table("proofs")
            .update({
                "validation_status": "skipped",
                "validation_result": json.dumps(validation_result),
            })
            .eq("id", body.proof_id)
        )
        return {"result": validation_result}

    # 4. Run agent
    try:
        raw = await agent.run(message)
        validation_result = json.loads(raw)
    except (json.JSONDecodeError, Exception) as e:
        logger.exception("Proof validation agent error for proof %s", body.proof_id)
        validation_result = {
            "valid": True,
            "confidence": "low",
            "reason": "Validation could not be completed",
            "issues": [],
        }

    # 5. Determine status
    validation_status = "valid" if validation_result.get("valid") else "invalid"

    # 6. Update proof record
    await execute(
        sb.table("proofs")
        .update({
            "validation_status": validation_status,
            "validation_result": json.dumps(validation_result),
        })
        .eq("id", body.proof_id)
    )

    return {"result": validation_result}

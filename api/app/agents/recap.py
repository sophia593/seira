"""
Recap writer agent for sponsorship fulfillment.

Generates professional cover notes and narrative summaries for sponsor recap
reports. Given deliverable + proof data as JSON, the agent writes compelling
copy that highlights fulfilled commitments and proof of performance.
"""

from __future__ import annotations

import json
import logging

from app.agents.base import BaseAgent, AgentContext
from app.core.database import get_supabase, execute

logger = logging.getLogger(__name__)


class RecapAgent(BaseAgent):

    SYSTEM_PROMPT = (
        "You are Seira's recap writer — a professional copywriter for sponsorship "
        "fulfillment teams.\n\n"
        "Your job is to write compelling cover notes and narrative summaries for "
        "sponsor recap reports. These reports are sent to sponsors (partners) to "
        "demonstrate that their investment was fulfilled.\n\n"
        "## Input\n"
        "You will receive structured JSON data about a partner's deliverables and "
        "proof of performance via tools. Use this data to write your copy.\n\n"
        "## Writing guidelines\n"
        "1. **Tone**: Professional, confident, appreciative. Not salesy or over-the-top. "
        "Write as if you are the sponsorship team addressing the partner directly.\n"
        "2. **Structure**: Lead with the headline result (e.g., '100% of deliverables "
        "fulfilled'), then summarize highlights by category, then close with a "
        "forward-looking statement about the partnership.\n"
        "3. **Be specific**: Reference actual deliverable titles, categories, and proof "
        "counts. Never fabricate data — only reference what appears in the tool results.\n"
        "4. **Brevity**: Cover notes should be 2–4 paragraphs (100–250 words). "
        "Keep it scannable.\n"
        "5. **Categories**: Deliverables fall into: In-Venue, Digital, Hospitality, "
        "Signage, Talent, Content. Group highlights by category when it makes sense.\n"
        "6. **Proof awareness**: Mention when deliverables have proof attached "
        "(photos, videos, links). This validates fulfillment.\n"
        "7. **Handle gaps honestly**: If some deliverables are incomplete or missing "
        "proof, acknowledge briefly without being defensive. Frame as 'in progress' "
        "where appropriate.\n"
        "8. **No markdown** in the cover note output — it will be rendered as plain text "
        "in an email-safe HTML template. Use line breaks between paragraphs.\n\n"
        "## What you can do\n"
        "- Write a cover note for a single-event recap\n"
        "- Write a cover note for a season (multi-event) recap\n"
        "- Write a cover note for a combined (all-events) recap\n"
        "- Suggest a recap title\n"
        "- Summarize highlights for a specific category\n\n"
        "Always fetch the recap data first before writing. Never guess or fabricate."
    )

    TOOLS = [
        {
            "name": "get_recap_data",
            "description": (
                "Fetch full deliverable and proof data for a recap report. Returns "
                "partner info, event info, deliverables with status and proof counts, "
                "and aggregate stats (total, completed, proved, by category). "
                "Use this before writing any copy."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "event_id": {
                        "type": "string",
                        "description": "Event ID for a single-event recap.",
                    },
                    "partner_id": {
                        "type": "string",
                        "description": "Partner ID (event-level partner record).",
                    },
                    "partner_name": {
                        "type": "string",
                        "description": (
                            "Partner name for season/combined recaps. Fetches across "
                            "all events with this partner name."
                        ),
                    },
                    "season_id": {
                        "type": "string",
                        "description": "Season ID for season-scoped recaps.",
                    },
                    "combined": {
                        "type": "boolean",
                        "description": "If true, fetch across ALL org events for this partner name.",
                    },
                },
                "required": [],
            },
        },
        {
            "name": "get_event_context",
            "description": (
                "Get event details: name, date, venue, status. Useful for adding "
                "contextual details to the narrative."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "event_id": {
                        "type": "string",
                        "description": "Event ID to look up.",
                    },
                },
                "required": ["event_id"],
            },
        },
        {
            "name": "get_partner_context",
            "description": (
                "Get partner details: name, contact info, deal value, renewal date, "
                "contract notes. Useful for personalizing the narrative."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "partner_id": {
                        "type": "string",
                        "description": "Partner ID to look up.",
                    },
                    "partner_name": {
                        "type": "string",
                        "description": "Partner name for cross-event lookup.",
                    },
                },
                "required": [],
            },
        },
    ]

    # -------------------------------------------------------------------------
    # Tool routing
    # -------------------------------------------------------------------------

    async def handle_tool_call(self, name: str, input: dict) -> str:
        handlers = {
            "get_recap_data": self._get_recap_data,
            "get_event_context": self._get_event_context,
            "get_partner_context": self._get_partner_context,
        }
        handler = handlers.get(name)
        if not handler:
            return json.dumps({"error": f"Unknown tool: {name}"})
        try:
            result = await handler(input)
            return json.dumps(result, default=str)
        except Exception as e:
            logger.exception("Tool %s failed", name)
            return json.dumps({"error": str(e)})

    # -------------------------------------------------------------------------
    # Tool implementations
    # -------------------------------------------------------------------------

    async def _get_recap_data(self, input: dict) -> dict:
        sb = get_supabase()
        org_id = self.ctx.org_id

        event_id = input.get("event_id")
        partner_id = input.get("partner_id")
        partner_name = input.get("partner_name")
        season_id = input.get("season_id")
        combined = input.get("combined", False)

        # --- Determine scope ---

        # Single-event recap: specific partner_id + event_id
        if partner_id and event_id:
            return await self._recap_single_event(sb, org_id, event_id, partner_id)

        # Season recap: partner_name + season_id
        if partner_name and season_id:
            return await self._recap_season(sb, org_id, season_id, partner_name)

        # Combined recap: partner_name across all events
        if partner_name and combined:
            return await self._recap_combined(sb, org_id, partner_name)

        # Fallback: try partner_name across all active events
        if partner_name:
            return await self._recap_combined(sb, org_id, partner_name)

        return {"error": "Provide event_id + partner_id, or partner_name + season_id, or partner_name + combined=true."}

    async def _recap_single_event(self, sb, org_id: str, event_id: str, partner_id: str) -> dict:
        # Fetch event + partner + deliverables in parallel-ish
        event_rows = await execute(
            sb.table("events").select("id, name, date, venue, status")
            .eq("id", event_id).eq("org_id", org_id).limit(1)
        ) or []
        if not event_rows:
            return {"error": "Event not found"}
        event = event_rows[0]

        partner_rows = await execute(
            sb.table("partners").select("id, name, contact_name, contact_email, deal_value, contract_notes")
            .eq("id", partner_id).limit(1)
        ) or []
        if not partner_rows:
            return {"error": "Partner not found"}
        partner = partner_rows[0]

        deliverables = await execute(
            sb.table("deliverables")
            .select("id, title, category, status, due_date, proof_required, notes")
            .eq("partner_id", partner_id).eq("event_id", event_id)
            .order("category")
        ) or []

        # Get proof counts
        del_ids = [d["id"] for d in deliverables]
        proof_counts = await self._count_proofs(sb, del_ids)

        return self._build_recap_response(
            partner=partner,
            events=[event],
            deliverables=deliverables,
            proof_counts=proof_counts,
        )

    async def _recap_season(self, sb, org_id: str, season_id: str, partner_name: str) -> dict:
        # Get season events
        events = await execute(
            sb.table("events").select("id, name, date, venue, status")
            .eq("org_id", org_id).eq("season_id", season_id)
            .order("date")
        ) or []
        if not events:
            return {"error": "No events in season"}

        event_ids = [e["id"] for e in events]

        # Find partners with matching name
        partners = await execute(
            sb.table("partners")
            .select("id, name, contact_name, contact_email, deal_value, contract_notes, event_id")
            .eq("org_id", org_id).in_("event_id", event_ids)
            .ilike("name", partner_name)
        ) or []
        if not partners:
            return {"error": f"No partner named '{partner_name}' in season events"}

        partner_ids = [p["id"] for p in partners]

        deliverables = await execute(
            sb.table("deliverables")
            .select("id, title, category, status, due_date, proof_required, notes, event_id, partner_id")
            .in_("partner_id", partner_ids)
            .order("category")
        ) or []

        del_ids = [d["id"] for d in deliverables]
        proof_counts = await self._count_proofs(sb, del_ids)

        return self._build_recap_response(
            partner=partners[0],
            events=events,
            deliverables=deliverables,
            proof_counts=proof_counts,
            total_deal_value=sum(p.get("deal_value") or 0 for p in partners),
        )

    async def _recap_combined(self, sb, org_id: str, partner_name: str) -> dict:
        # All non-archived events
        events = await execute(
            sb.table("events").select("id, name, date, venue, status")
            .eq("org_id", org_id).neq("status", "archived")
            .order("date")
        ) or []
        if not events:
            return {"error": "No events found"}

        event_ids = [e["id"] for e in events]

        partners = await execute(
            sb.table("partners")
            .select("id, name, contact_name, contact_email, deal_value, contract_notes, event_id")
            .eq("org_id", org_id).in_("event_id", event_ids)
            .ilike("name", partner_name)
        ) or []
        if not partners:
            return {"error": f"No partner named '{partner_name}' found"}

        partner_ids = [p["id"] for p in partners]

        deliverables = await execute(
            sb.table("deliverables")
            .select("id, title, category, status, due_date, proof_required, notes, event_id, partner_id")
            .in_("partner_id", partner_ids)
            .order("category")
        ) or []

        del_ids = [d["id"] for d in deliverables]
        proof_counts = await self._count_proofs(sb, del_ids)

        # Filter events to only those that have deliverables
        events_with_dels = {d.get("event_id") for d in deliverables}
        active_events = [e for e in events if e["id"] in events_with_dels]

        return self._build_recap_response(
            partner=partners[0],
            events=active_events,
            deliverables=deliverables,
            proof_counts=proof_counts,
            total_deal_value=sum(p.get("deal_value") or 0 for p in partners),
        )

    async def _count_proofs(self, sb, deliverable_ids: list[str]) -> dict[str, int]:
        if not deliverable_ids:
            return {}
        rows = await execute(
            sb.table("proofs").select("deliverable_id")
            .in_("deliverable_id", deliverable_ids)
        ) or []
        counts: dict[str, int] = {}
        for r in rows:
            counts[r["deliverable_id"]] = counts.get(r["deliverable_id"], 0) + 1
        return counts

    def _build_recap_response(
        self,
        partner: dict,
        events: list[dict],
        deliverables: list[dict],
        proof_counts: dict[str, int],
        total_deal_value: int | None = None,
    ) -> dict:
        total = len(deliverables)
        completed = sum(1 for d in deliverables if d["status"] in ("done", "proved"))
        proved = sum(1 for d in deliverables if d["status"] == "proved")
        in_progress = sum(1 for d in deliverables if d["status"] == "in_progress")
        with_proof = sum(1 for d in deliverables if proof_counts.get(d["id"], 0) > 0)

        # By category breakdown
        by_category: dict[str, dict] = {}
        for d in deliverables:
            cat = d["category"]
            entry = by_category.setdefault(cat, {"total": 0, "completed": 0, "proved": 0, "with_proof": 0})
            entry["total"] += 1
            if d["status"] in ("done", "proved"):
                entry["completed"] += 1
            if d["status"] == "proved":
                entry["proved"] += 1
            if proof_counts.get(d["id"], 0) > 0:
                entry["with_proof"] += 1

        # Enriched deliverables
        enriched = []
        for d in deliverables:
            enriched.append({
                "title": d["title"],
                "category": d["category"],
                "status": d["status"],
                "due_date": d.get("due_date"),
                "proof_required": d.get("proof_required"),
                "proof_count": proof_counts.get(d["id"], 0),
                "notes": d.get("notes"),
                "event_id": d.get("event_id"),
            })

        result = {
            "partner": {
                "name": partner["name"],
                "contact_name": partner.get("contact_name"),
                "contact_email": partner.get("contact_email"),
                "deal_value": partner.get("deal_value"),
                "contract_notes": partner.get("contract_notes"),
            },
            "events": [
                {
                    "id": e["id"],
                    "name": e["name"],
                    "date": e.get("date"),
                    "venue": e.get("venue"),
                    "status": e.get("status"),
                }
                for e in events
            ],
            "stats": {
                "total_deliverables": total,
                "completed": completed,
                "proved": proved,
                "in_progress": in_progress,
                "with_proof": with_proof,
                "completion_pct": round(completed / total * 100, 1) if total else 0,
                "proof_pct": round(with_proof / total * 100, 1) if total else 0,
            },
            "by_category": by_category,
            "deliverables": enriched,
        }

        if total_deal_value is not None:
            result["total_deal_value"] = total_deal_value

        return result

    async def _get_event_context(self, input: dict) -> dict:
        sb = get_supabase()
        event_id = input.get("event_id")
        if not event_id:
            return {"error": "event_id is required"}

        rows = await execute(
            sb.table("events")
            .select("id, name, date, venue, status, notes")
            .eq("id", event_id).eq("org_id", self.ctx.org_id).limit(1)
        ) or []
        if not rows:
            return {"error": "Event not found"}
        return rows[0]

    async def _get_partner_context(self, input: dict) -> dict:
        sb = get_supabase()
        org_id = self.ctx.org_id

        partner_id = input.get("partner_id")
        partner_name = input.get("partner_name")

        if partner_id:
            rows = await execute(
                sb.table("partners")
                .select("id, name, contact_name, contact_email, deal_value, renewal_date, contract_notes, event_id")
                .eq("id", partner_id).limit(1)
            ) or []
            if not rows:
                return {"error": "Partner not found"}
            return rows[0]

        if partner_name:
            rows = await execute(
                sb.table("partners")
                .select("id, name, contact_name, contact_email, deal_value, renewal_date, contract_notes, event_id")
                .eq("org_id", org_id).ilike("name", partner_name)
                .limit(5)
            ) or []
            if not rows:
                return {"error": f"No partner named '{partner_name}' found"}

            # Return first match with aggregated deal value
            total_deal = sum(r.get("deal_value") or 0 for r in rows)
            result = rows[0].copy()
            result["total_deal_value"] = total_deal
            result["event_count"] = len(rows)
            return result

        return {"error": "Provide partner_id or partner_name"}

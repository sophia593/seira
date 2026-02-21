"""
Risk analysis agent for sponsorship fulfillment.

Analyzes fulfillment risk (overdue/behind-schedule deliverables) and
churn risk (poor performance near renewal dates) across an organization's
sponsorship portfolio.
"""

from __future__ import annotations

import json
import logging
from datetime import date, timedelta

from app.agents.base import BaseAgent, AgentContext
from app.core.database import get_supabase, execute

logger = logging.getLogger(__name__)


class RiskAgent(BaseAgent):

    SYSTEM_PROMPT = (
        "You are Seira's risk analysis assistant for sponsorship fulfillment teams.\n\n"
        "You have access to the organization's sponsorship data: events, partners, "
        "deliverables, and proof of performance.\n\n"
        "Your job is to analyze two kinds of risk:\n\n"
        "**Fulfillment Risk** — deliverables that are overdue or behind schedule, "
        "especially for high-value partners.\n"
        "**Churn Risk** — partners with upcoming renewal dates whose fulfillment "
        "performance is poor.\n\n"
        "When analyzing:\n"
        "1. First get an overview of the org's current state.\n"
        "2. Then drill into specific risk areas based on the user's question.\n"
        "3. Provide specific, actionable insights with partner names, deal values, "
        "and due dates.\n"
        "4. Categorize risk as HIGH / MEDIUM / LOW with clear reasoning.\n"
        "5. Include dollar amounts at risk when deal_value data is available.\n\n"
        "Be concise and direct. Use bullet points. Focus on what needs attention NOW."
    )

    TOOLS = [
        {
            "name": "get_org_overview",
            "description": (
                "Get a high-level summary of the organization: event count, partner "
                "count, deliverable completion rates, total deal value, overdue items."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "event_status_filter": {
                        "type": "string",
                        "enum": ["upcoming", "active", "completed", "archived", "all"],
                        "description": "Filter events by status. Default: all.",
                    }
                },
                "required": [],
            },
        },
        {
            "name": "get_partners_at_risk",
            "description": (
                "Get partners with fulfillment risk: overdue deliverables, low "
                "completion rates, or high deal values at risk. Returns partner name, "
                "deal value, completion stats, overdue count, sorted by risk."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "min_deal_value": {
                        "type": "integer",
                        "description": "Only partners with deal_value >= this (dollars).",
                    },
                    "max_completion_pct": {
                        "type": "integer",
                        "description": "Only partners with completion <= this (0-100).",
                    },
                    "event_id": {
                        "type": "string",
                        "description": "Filter to a specific event.",
                    },
                },
                "required": [],
            },
        },
        {
            "name": "get_deliverables_by_status",
            "description": (
                "Query deliverables with filters. Returns title, partner name, event "
                "name, due_date, status, category."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["not_started", "in_progress", "done", "proved"],
                        "description": "Filter by status.",
                    },
                    "overdue_only": {
                        "type": "boolean",
                        "description": "Only return overdue (due < today, not done/proved).",
                    },
                    "event_id": {
                        "type": "string",
                        "description": "Filter to a specific event.",
                    },
                    "partner_name": {
                        "type": "string",
                        "description": "Filter by partner name (case-insensitive).",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results. Default: 50.",
                    },
                },
                "required": [],
            },
        },
        {
            "name": "get_renewal_pipeline",
            "description": (
                "Get partners with upcoming renewal dates, sorted by date. Includes "
                "fulfillment performance to assess churn risk."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "days_ahead": {
                        "type": "integer",
                        "description": "Look ahead N days from today. Default: 90.",
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
            "get_org_overview": self._get_org_overview,
            "get_partners_at_risk": self._get_partners_at_risk,
            "get_deliverables_by_status": self._get_deliverables_by_status,
            "get_renewal_pipeline": self._get_renewal_pipeline,
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

    async def _get_org_overview(self, input: dict) -> dict:
        sb = get_supabase()
        org_id = self.ctx.org_id
        status_filter = input.get("event_status_filter", "all")

        # Events
        q = sb.table("events").select("id, name, date, status").eq("org_id", org_id)
        if status_filter != "all":
            q = q.eq("status", status_filter)
        events = await execute(q) or []

        event_ids = [e["id"] for e in events]
        if not event_ids:
            return {
                "event_count": 0,
                "partner_count": 0,
                "deliverables_total": 0,
                "deliverables_completed": 0,
                "completion_pct": 0,
                "overdue_count": 0,
                "total_deal_value": 0,
                "events": [],
            }

        # Partners
        partners = (
            await execute(
                sb.table("partners")
                .select("id, name, deal_value, event_id")
                .eq("org_id", org_id)
                .in_("event_id", event_ids)
            )
            or []
        )

        # Deliverables
        deliverables = (
            await execute(
                sb.table("deliverables")
                .select("id, status, due_date, partner_id, event_id")
                .in_("event_id", event_ids)
            )
            or []
        )

        today = date.today().isoformat()
        total = len(deliverables)
        completed = sum(1 for d in deliverables if d["status"] in ("done", "proved"))
        overdue = sum(
            1
            for d in deliverables
            if d.get("due_date")
            and d["due_date"] < today
            and d["status"] not in ("done", "proved")
        )
        total_deal_value = sum(p.get("deal_value") or 0 for p in partners)

        return {
            "event_count": len(events),
            "partner_count": len(partners),
            "deliverables_total": total,
            "deliverables_completed": completed,
            "completion_pct": round(completed / total * 100, 1) if total else 0,
            "overdue_count": overdue,
            "total_deal_value": total_deal_value,
            "events": [
                {"id": e["id"], "name": e["name"], "status": e["status"]}
                for e in events
            ],
        }

    async def _get_partners_at_risk(self, input: dict) -> list:
        sb = get_supabase()
        org_id = self.ctx.org_id
        min_deal = input.get("min_deal_value", 0)
        max_pct = input.get("max_completion_pct", 100)
        event_id = input.get("event_id")

        # Get events
        eq = sb.table("events").select("id").eq("org_id", org_id).neq("status", "archived")
        if event_id:
            eq = eq.eq("id", event_id)
        events = await execute(eq) or []
        event_ids = [e["id"] for e in events]
        if not event_ids:
            return []

        # Partners
        pq = sb.table("partners").select("id, name, deal_value, event_id, renewal_date").eq("org_id", org_id).in_("event_id", event_ids)
        partners = await execute(pq) or []

        # Deliverables
        deliverables = await execute(
            sb.table("deliverables")
            .select("id, partner_id, status, due_date")
            .in_("event_id", event_ids)
        ) or []

        # Aggregate per partner
        today = date.today().isoformat()
        del_by_partner: dict[str, list] = {}
        for d in deliverables:
            del_by_partner.setdefault(d["partner_id"], []).append(d)

        results = []
        for p in partners:
            dels = del_by_partner.get(p["id"], [])
            total = len(dels)
            completed = sum(1 for d in dels if d["status"] in ("done", "proved"))
            overdue = sum(
                1
                for d in dels
                if d.get("due_date")
                and d["due_date"] < today
                and d["status"] not in ("done", "proved")
            )
            pct = round(completed / total * 100, 1) if total else 0
            deal_value = p.get("deal_value") or 0

            if deal_value < min_deal:
                continue
            if pct > max_pct:
                continue

            # Risk score: higher = worse
            risk_score = overdue * 10 + (100 - pct) + (deal_value / 1000)
            results.append(
                {
                    "partner_name": p["name"],
                    "deal_value": deal_value,
                    "deliverables_total": total,
                    "deliverables_completed": completed,
                    "completion_pct": pct,
                    "overdue_count": overdue,
                    "renewal_date": p.get("renewal_date"),
                    "risk_score": round(risk_score, 1),
                }
            )

        results.sort(key=lambda r: r["risk_score"], reverse=True)
        return results[:30]

    async def _get_deliverables_by_status(self, input: dict) -> list:
        sb = get_supabase()
        org_id = self.ctx.org_id
        limit = min(input.get("limit", 50), 100)

        # Get org events
        events = await execute(
            sb.table("events")
            .select("id, name")
            .eq("org_id", org_id)
            .neq("status", "archived")
        ) or []
        event_ids = [e["id"] for e in events]
        if not event_ids:
            return []
        event_map = {e["id"]: e["name"] for e in events}

        # Build deliverable query
        dq = sb.table("deliverables").select(
            "id, title, status, due_date, category, partner_id, event_id"
        ).in_("event_id", event_ids)

        if input.get("status"):
            dq = dq.eq("status", input["status"])
        if input.get("event_id"):
            dq = dq.eq("event_id", input["event_id"])

        dq = dq.order("due_date", desc=False).limit(limit)
        deliverables = await execute(dq) or []

        # Filter overdue in code (supabase-py doesn't support compound where easily)
        today = date.today().isoformat()
        if input.get("overdue_only"):
            deliverables = [
                d
                for d in deliverables
                if d.get("due_date")
                and d["due_date"] < today
                and d["status"] not in ("done", "proved")
            ]

        # Get partner names
        partner_ids = list({d["partner_id"] for d in deliverables})
        partners = (
            await execute(
                sb.table("partners").select("id, name").in_("id", partner_ids)
            )
            if partner_ids
            else []
        ) or []
        partner_map = {p["id"]: p["name"] for p in partners}

        # Filter by partner name
        if input.get("partner_name"):
            search = input["partner_name"].lower()
            deliverables = [
                d
                for d in deliverables
                if search in partner_map.get(d["partner_id"], "").lower()
            ]

        return [
            {
                "title": d["title"],
                "status": d["status"],
                "due_date": d.get("due_date"),
                "category": d["category"],
                "partner_name": partner_map.get(d["partner_id"], "Unknown"),
                "event_name": event_map.get(d["event_id"], "Unknown"),
            }
            for d in deliverables[:limit]
        ]

    async def _get_renewal_pipeline(self, input: dict) -> list:
        sb = get_supabase()
        org_id = self.ctx.org_id
        days_ahead = input.get("days_ahead", 90)

        today_str = date.today().isoformat()
        future_str = (date.today() + timedelta(days=days_ahead)).isoformat()

        # Partners with renewal dates in range
        partners = await execute(
            sb.table("partners")
            .select("id, name, deal_value, renewal_date, event_id")
            .eq("org_id", org_id)
            .gte("renewal_date", today_str)
            .lte("renewal_date", future_str)
            .order("renewal_date", desc=False)
            .limit(30)
        ) or []

        if not partners:
            return []

        # Get their deliverables for completion stats
        partner_ids = [p["id"] for p in partners]
        deliverables = await execute(
            sb.table("deliverables")
            .select("partner_id, status, due_date")
            .in_("partner_id", partner_ids)
        ) or []

        today = date.today().isoformat()
        del_by_partner: dict[str, list] = {}
        for d in deliverables:
            del_by_partner.setdefault(d["partner_id"], []).append(d)

        # Event names
        event_ids = list({p["event_id"] for p in partners})
        events = await execute(
            sb.table("events").select("id, name").in_("id", event_ids)
        ) or []
        event_map = {e["id"]: e["name"] for e in events}

        results = []
        for p in partners:
            dels = del_by_partner.get(p["id"], [])
            total = len(dels)
            completed = sum(1 for d in dels if d["status"] in ("done", "proved"))
            overdue = sum(
                1
                for d in dels
                if d.get("due_date")
                and d["due_date"] < today
                and d["status"] not in ("done", "proved")
            )
            pct = round(completed / total * 100, 1) if total else 0

            results.append(
                {
                    "partner_name": p["name"],
                    "deal_value": p.get("deal_value") or 0,
                    "renewal_date": p["renewal_date"],
                    "event_name": event_map.get(p["event_id"], "Unknown"),
                    "deliverables_total": total,
                    "deliverables_completed": completed,
                    "completion_pct": pct,
                    "overdue_count": overdue,
                }
            )

        return results

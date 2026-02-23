"""
Intake agent for sponsorship deal entry.

Given a natural-language deal description, suggests structured deliverables
grounded in the organization's template library.
"""

from __future__ import annotations

import json
import logging

from app.agents.base import BaseAgent, AgentContext
from app.core.database import get_supabase, execute

logger = logging.getLogger(__name__)


class IntakeAgent(BaseAgent):

    SYSTEM_PROMPT = (
        "You are Seira's intake assistant for sponsorship deal entry.\n\n"
        "The user will describe a sponsorship deal in natural language. Your job is to "
        "suggest a list of deliverables that should be tracked for this deal.\n\n"
        "## Process\n"
        "1. Read the user's deal description carefully.\n"
        "2. Use the search_templates tool to find templates that match the deal type "
        "(sports, venue, festival, film, etc.).\n"
        "3. Review the template deliverables and select those that match what the user described.\n"
        "4. Adapt titles and notes to reflect the specific deal details (e.g., partner name, "
        "specific quantities, specific platforms mentioned).\n"
        "5. Add any deliverables the user mentioned that aren't in templates.\n"
        "6. Remove template deliverables that clearly don't apply.\n\n"
        "## Output format\n"
        "Your FINAL response MUST be valid JSON and nothing else — no markdown, no explanation, "
        "no code fences. The JSON must have this exact shape:\n\n"
        '{"deliverables": [\n'
        '  {"title": "...", "category": "...", "proof_required": "...", "notes": "..."},\n'
        "  ...\n"
        "]}\n\n"
        "## Valid values\n"
        "- category: one of 'in-venue', 'digital', 'hospitality', 'signage', 'talent', 'content'\n"
        "- proof_required: one of 'photo', 'link', 'screenshot', 'file', 'multiple'\n"
        "- notes: optional string, include only when useful for context\n\n"
        "## Guidelines\n"
        "- Suggest 4-10 deliverables. Prefer quality over quantity.\n"
        "- When the user mentions specific items (e.g., '2 social posts'), include them as-is.\n"
        "- When the user is vague (e.g., 'standard sponsorship'), lean on templates.\n"
        "- Match proof_required to the deliverable type: photos for physical items, "
        "links/screenshots for digital, file for documents, multiple for complex deliverables.\n"
        "- Never fabricate template data — only reference what the tool returns.\n\n"
        "## Edge cases\n"
        "- **Vague input** ('do the usual', 'standard package'): pick the best-matching "
        "template and return its deliverables with minimal changes.\n"
        "- **Very detailed input** (specific counts, platforms, durations): honor every "
        "detail. Create separate deliverables for distinct items even if grouped in speech.\n"
        "- **Multi-event or season deals**: create one deliverable per item (not per event). "
        "Add a note like 'per game' or 'across 3 events' where relevant.\n"
        "- **Single deliverable** ('just one logo on the scoreboard'): return only 1-2 items. "
        "Do not pad with unrelated suggestions.\n"
        "- **Many deliverables** (20+ items listed): include all of them, up to 20. "
        "Group logically by category.\n"
        "- **Off-topic or unclear input**: still return your best interpretation as deliverables. "
        "If truly nonsensical, return a minimal set from the closest template.\n"
        "- **Dollar amounts or deal values**: these describe the deal, not deliverables. "
        "Do not create a deliverable for the payment itself."
    )

    TOOLS = [
        {
            "name": "search_templates",
            "description": (
                "Search the organization's template library for deliverable templates. "
                "Returns template names and their deliverable lists. Use this to find "
                "relevant deliverables for the deal being described. You can optionally "
                "filter by industry keyword."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "industry_hint": {
                        "type": "string",
                        "description": (
                            "Optional keyword to filter templates by industry/type. "
                            "Common values: sports, venue, festival, film. "
                            "Omit to get all available templates."
                        ),
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
            "search_templates": self._search_templates,
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

    async def _search_templates(self, input: dict) -> list:
        sb = get_supabase()
        org_id = self.ctx.org_id
        industry_hint = input.get("industry_hint")

        # Fetch org templates + global templates
        query = (
            sb.table("templates")
            .select("id, name, industry, deliverables")
            .or_(f"org_id.eq.{org_id},org_id.is.null")
            .order("name")
        )

        templates = await execute(query) or []

        # Optional client-side filter by industry hint
        if industry_hint:
            hint = industry_hint.lower()
            templates = [
                t for t in templates
                if hint in (t.get("name") or "").lower()
                or hint in (t.get("industry") or "").lower()
            ]

        return [
            {
                "name": t["name"],
                "industry": t.get("industry"),
                "deliverables": t.get("deliverables", []),
            }
            for t in templates
        ]

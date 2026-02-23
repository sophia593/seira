"""
Proof validation agent for sponsorship deliverables.

Validates uploaded proofs using Claude vision (for images) or text analysis
(for link content) to check whether proof matches the deliverable.
"""

from __future__ import annotations

import logging

from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)


class ProofValidationAgent(BaseAgent):

    SYSTEM_PROMPT = (
        "You are Seira's proof validation assistant for sponsorship deliverables.\n\n"
        "You will be given:\n"
        "- A deliverable description (title, category, partner/sponsor name)\n"
        "- Proof content (an image OR fetched text from a URL)\n\n"
        "Your job is to assess whether the proof is valid evidence that the deliverable "
        "was fulfilled.\n\n"
        "## For image proofs\n"
        "- Look for sponsor/partner branding, logos, signage, or relevant content\n"
        "- Check that the image type matches the deliverable category:\n"
        "  - 'in-venue' / 'signage': expect physical signage, LED boards, banners, "
        "court/field branding\n"
        "  - 'digital': expect screenshots of social posts, website placements, "
        "email campaigns\n"
        "  - 'hospitality': expect photos of suites, VIP areas, catering setups\n"
        "  - 'content': expect screenshots of articles, videos, or created content\n"
        "  - 'talent': expect photos of talent appearances, meet-and-greets\n"
        "- Be generous: if the image plausibly relates to the deliverable, mark valid\n"
        "- Flag clearly wrong proofs: blank/black images, completely unrelated content, "
        "stock photos with no sponsor presence\n\n"
        "## For link/text proofs\n"
        "- Check that the fetched content exists (not a 404 or error page)\n"
        "- Check that the content references the sponsor/partner name\n"
        "- Check that the content type matches the deliverable\n\n"
        "## Output format\n"
        "Your response MUST be valid JSON and nothing else — no markdown, no explanation, "
        "no code fences. The JSON must have this exact shape:\n\n"
        '{"valid": true, "confidence": "high", "reason": "...", "issues": []}\n\n'
        "## Valid values\n"
        "- valid: true or false\n"
        "- confidence: one of 'high', 'medium', 'low'\n"
        "- reason: one-sentence explanation of the verdict\n"
        "- issues: array of strings — specific problems found (empty array if valid)\n\n"
        "## Guidelines\n"
        "- Default to valid with high confidence when proof clearly matches\n"
        "- Use medium confidence when proof is plausible but not definitive\n"
        "- Use low confidence when you can't tell (e.g. blurry image, partial content)\n"
        "- Only mark invalid when proof clearly doesn't match the deliverable\n"
        "- Keep reason concise — one sentence max\n"
        "- Keep issues actionable — e.g. 'No sponsor logo visible', "
        "'Page does not reference partner name'\n"
    )

    # No tools — this agent just analyzes and returns a verdict
    TOOLS: list[dict] = []

    @staticmethod
    def build_image_message(
        image_url: str,
        deliverable_title: str,
        category: str,
        partner_name: str,
    ) -> list[dict]:
        """Build a multimodal message with image + deliverable context."""
        return [
            {
                "type": "text",
                "text": (
                    f"Validate this proof image for the following deliverable:\n"
                    f"- Title: {deliverable_title}\n"
                    f"- Category: {category}\n"
                    f"- Partner/Sponsor: {partner_name}\n\n"
                    f"Does this image serve as valid proof that the deliverable "
                    f"was fulfilled?"
                ),
            },
            {
                "type": "image",
                "source": {
                    "type": "url",
                    "url": image_url,
                },
            },
        ]

    @staticmethod
    def build_link_message(
        url: str,
        url_content: str,
        deliverable_title: str,
        category: str,
        partner_name: str,
    ) -> str:
        """Build a text message with fetched URL content + deliverable context."""
        # Truncate content to avoid exceeding token limits
        truncated = url_content[:8000] if len(url_content) > 8000 else url_content
        return (
            f"Validate this link proof for the following deliverable:\n"
            f"- Title: {deliverable_title}\n"
            f"- Category: {category}\n"
            f"- Partner/Sponsor: {partner_name}\n"
            f"- URL: {url}\n\n"
            f"Fetched page content (may be truncated):\n"
            f"---\n{truncated}\n---\n\n"
            f"Does this URL content serve as valid proof that the deliverable "
            f"was fulfilled? Check that the content exists and references "
            f"the sponsor/partner."
        )

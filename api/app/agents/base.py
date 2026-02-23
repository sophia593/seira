"""
Base agent framework for Claude tool-calling loops.

Usage:
    1. Subclass BaseAgent
    2. Override SYSTEM_PROMPT, TOOLS, handle_tool_call()
    3. Call agent.run(message) or agent.run_stream(message)
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any, AsyncIterator

import anthropic

from app.core.config import get_settings

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "claude-sonnet-4-5-20250929"
MAX_TURNS = 10


@dataclass
class AgentContext:
    """Injected context available to all tool handlers."""

    org_id: str
    user_id: str
    extra: dict[str, Any] = field(default_factory=dict)


class BaseAgent:
    """
    Abstract base for Claude agents with tool-calling loops.

    Subclasses must set:
      SYSTEM_PROMPT: str
      TOOLS: list[dict]

    And implement:
      handle_tool_call(name, input) -> str
    """

    SYSTEM_PROMPT: str = ""
    TOOLS: list[dict] = []

    def __init__(self, ctx: AgentContext, model: str = DEFAULT_MODEL):
        self.ctx = ctx
        self.model = model
        settings = get_settings()
        if not settings.ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured")
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def run(self, user_message: str | list) -> str:
        """Run the agent to completion, return final text.

        user_message can be a plain string or a list of content blocks
        (e.g. for multimodal / vision inputs).
        """
        messages: list[dict] = [{"role": "user", "content": user_message}]

        for _ in range(MAX_TURNS):
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=self.SYSTEM_PROMPT,
                tools=self.TOOLS,
                messages=messages,
            )

            if response.stop_reason == "end_turn":
                return self._extract_text(response)

            if response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        logger.info("Tool call: %s", block.name)
                        result = await self.handle_tool_call(block.name, block.input)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": result,
                            }
                        )
                messages.append({"role": "user", "content": tool_results})
            else:
                return self._extract_text(response)

        return "Analysis could not be completed within the allowed number of steps."

    async def run_stream(self, user_message: str | list) -> AsyncIterator[str]:
        """Run the agent with streaming. Yields text chunks."""
        messages: list[dict] = [{"role": "user", "content": user_message}]

        for _ in range(MAX_TURNS):
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=4096,
                system=self.SYSTEM_PROMPT,
                tools=self.TOOLS,
                messages=messages,
            ) as stream:
                async for event in stream:
                    if (
                        event.type == "content_block_delta"
                        and hasattr(event.delta, "text")
                    ):
                        yield event.delta.text

                response = await stream.get_final_message()

            if response.stop_reason == "end_turn":
                return

            if response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        logger.info("Tool call: %s", block.name)
                        result = await self.handle_tool_call(block.name, block.input)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": result,
                            }
                        )
                messages.append({"role": "user", "content": tool_results})
            else:
                return

    async def handle_tool_call(self, name: str, input: dict) -> str:
        """Override in subclass. Execute a tool and return string result."""
        raise NotImplementedError(f"Tool '{name}' not implemented")

    @staticmethod
    def _extract_text(response: Any) -> str:
        parts = []
        for block in response.content:
            if hasattr(block, "text"):
                parts.append(block.text)
        return "\n".join(parts)

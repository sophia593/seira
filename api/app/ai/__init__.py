# AI module - Claude client and orchestration

from app.ai.client import (
    StreamEvent,
    ToolCall,
    stream_message,
    send_message,
)
from app.ai.orchestrator import (
    chat,
    run_conversation,
    UserContext,
    ConversationContext,
    OrchestratorConfig,
    extract_text_from_events,
    extract_tool_calls_from_events,
)
from app.ai.prompts import build_system_prompt
from app.ai.sse import sse_event, sse_from_stream_event, sse_comment

__all__ = [
    # Client
    "StreamEvent",
    "ToolCall",
    "stream_message",
    "send_message",
    # Orchestrator
    "chat",
    "run_conversation",
    "UserContext",
    "ConversationContext",
    "OrchestratorConfig",
    "extract_text_from_events",
    "extract_tool_calls_from_events",
    # Prompts
    "build_system_prompt",
    # SSE
    "sse_event",
    "sse_from_stream_event",
    "sse_comment",
]

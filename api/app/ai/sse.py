# api/app/ai/sse.py
from __future__ import annotations

import json
from typing import Any, Optional

from app.ai.client import StreamEvent


def sse_event(
    event: str,
    data: Any,
    *,
    event_id: Optional[str] = None,
    retry: Optional[int] = None,
) -> bytes:
    """
    Build a Server-Sent Event (SSE) payload.

    SSE format:
      id: <id>        (optional)
      event: <name>
      retry: <ms>     (optional)
      data: <line1>
      data: <line2>
      <blank line>

    Returns UTF-8 bytes ready to yield from a StreamingResponse generator.
    """
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))

    lines: list[str] = []
    if event_id is not None:
        lines.append(f"id: {event_id}")
    if retry is not None:
        lines.append(f"retry: {retry}")

    # event name
    lines.append(f"event: {event}")

    # data can be multi-line; SSE requires each line prefixed with "data:"
    for line in payload.splitlines() or [""]:
        lines.append(f"data: {line}")

    # blank line terminator
    lines.append("")
    return ("\n".join(lines) + "\n").encode("utf-8")


def sse_from_stream_event(ev: StreamEvent) -> bytes:
    """Convert your normalized StreamEvent into SSE bytes."""
    return sse_event(ev.type, ev.data)


def sse_comment(comment: str = "keepalive") -> bytes:
    """
    SSE comment line (useful as a heartbeat to keep connections open):
      : keepalive

    Must end with a blank line.
    """
    return f": {comment}\n\n".encode("utf-8")

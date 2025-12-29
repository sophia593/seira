"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type StreamEventType = "start" | "text" | "tool_start" | "tool_input" | "tool_result" | "done" | "error";

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
}

export interface StartEventData {
  conversation_id: string;
  message_id: string;
}

export interface TextEventData {
  text: string;
}

export interface ToolStartEventData {
  id: string;
  name: string;
}

export interface ToolInputEventData {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultEventData {
  id: string;
  name: string;
  result: Record<string, unknown>;
  is_error: boolean;
}

export interface DoneEventData {
  stop_reason: string;
}

export interface ErrorEventData {
  message: string;
}

export interface StreamCallbacks {
  onStart?: (data: StartEventData) => void;
  onText?: (data: TextEventData) => void;
  onToolStart?: (data: ToolStartEventData) => void;
  onToolInput?: (data: ToolInputEventData) => void;
  onToolResult?: (data: ToolResultEventData) => void;
  onDone?: (data: DoneEventData) => void;
  onError?: (data: ErrorEventData) => void;
}

export interface SendMessageOptions {
  conversationId?: string;
  signal?: AbortSignal;
}

export interface UseStreamingReturn {
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<void>;
  isStreaming: boolean;
  error: string | null;
  abort: () => void;
}

// -----------------------------------------------------------------------------
// SSE Parser
// -----------------------------------------------------------------------------

function parseSSEEvent(chunk: string): StreamEvent | null {
  const lines = chunk.split("\n");
  let eventType: string | null = null;
  let eventData: string | null = null;

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      eventData = line.slice(5).trim();
    }
  }

  if (eventType && eventData) {
    try {
      const data = JSON.parse(eventData);
      return { type: eventType as StreamEvent["type"], data };
    } catch {
      console.warn("Failed to parse SSE data:", eventData);
      return null;
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useStreaming(
  callbacks: StreamCallbacks,
  baseUrl: string = process.env.NEXT_PUBLIC_API_URL || ""
): UseStreamingReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string, options: SendMessageOptions = {}) => {
      // Abort any existing stream
      abort();

      setIsStreaming(true);
      setError(null);

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Merge signals if one was provided
      const signal = options.signal
        ? combineSignals(options.signal, abortController.signal)
        : abortController.signal;

      try {
        // Get auth token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        // Build request body
        const body: Record<string, unknown> = { message };
        if (options.conversationId) {
          body.conversation_id = options.conversationId;
        }

        // Make streaming request
        const response = await fetch(`${baseUrl}/api/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "Accept": "text/event-stream",
          },
          body: JSON.stringify(body),
          signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete events (separated by double newlines)
          const parts = buffer.split("\n\n");

          // Keep the last incomplete part in the buffer
          buffer = parts.pop() || "";

          // Process complete events
          for (const part of parts) {
            if (!part.trim()) continue;

            const event = parseSSEEvent(part);
            if (!event) continue;

            // Dispatch to appropriate callback
            dispatchEvent(event, callbacks, setError);
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const event = parseSSEEvent(buffer);
          if (event) {
            dispatchEvent(event, callbacks, setError);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, not an error
          return;
        }

        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        callbacks.onError?.({ message: errorMessage });
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [callbacks, baseUrl, abort]
  );

  return {
    sendMessage,
    isStreaming,
    error,
    abort,
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function dispatchEvent(
  event: StreamEvent,
  callbacks: StreamCallbacks,
  setError: (error: string | null) => void
): void {
  const data = event.data;

  switch (event.type) {
    case "start":
      callbacks.onStart?.(data as StartEventData);
      break;
    case "text":
      callbacks.onText?.(data as TextEventData);
      break;
    case "tool_start":
      callbacks.onToolStart?.(data as ToolStartEventData);
      break;
    case "tool_input":
      callbacks.onToolInput?.(data as ToolInputEventData);
      break;
    case "tool_result":
      callbacks.onToolResult?.(data as ToolResultEventData);
      break;
    case "done":
      callbacks.onDone?.(data as DoneEventData);
      break;
    case "error": {
      const errorData = data as ErrorEventData;
      callbacks.onError?.(errorData);
      setError(errorData.message);
      break;
    }
  }
}

function combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
  const controller = new AbortController();

  const onAbort = () => controller.abort();

  signal1.addEventListener("abort", onAbort);
  signal2.addEventListener("abort", onAbort);

  // Check if already aborted
  if (signal1.aborted || signal2.aborted) {
    controller.abort();
  }

  return controller.signal;
}

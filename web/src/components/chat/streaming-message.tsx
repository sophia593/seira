'use client'

import { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarAssistant } from '@/components/ui/avatar'
import { type ToolCall } from '@/stores/conversation-store'
import { ToolIndicator } from './tool-indicator'
import { EventResultsGrid } from './tool-results/event-results-grid'
import { FlightResultsGrid } from './tool-results/flight-results-grid'

// =============================================================================
// Types
// =============================================================================

interface StreamingMessageProps {
  /** Text content streamed so far */
  content: string
  /** Tool calls currently in progress or completed */
  pendingToolCalls: ToolCall[]
  /** Additional className */
  className?: string
}

// =============================================================================
// Constants
// =============================================================================

// Map tool names to user-friendly display text (lowercase per typography system)
const TOOL_DISPLAY_TEXT: Record<string, string> = {
  search_events: 'searching for events...',
  search_flights: 'searching for flights...',
  save_trip: 'saving your trip...',
}

// =============================================================================
// Main Component
// =============================================================================

export const StreamingMessage = memo(function StreamingMessage({
  content,
  pendingToolCalls,
  className,
}: StreamingMessageProps) {
  const hasContent = content.length > 0
  const hasPendingTools = pendingToolCalls.some(
    (t) => t.status === 'pending' || t.status === 'running'
  )
  const hasCompletedTools = pendingToolCalls.some((t) => t.status === 'complete')
  const isJustStarted = !hasContent && !hasPendingTools && !hasCompletedTools

  return (
    <div className={cn('flex items-start gap-3 animate-message-in', className)}>
      {/* Avatar */}
      <AvatarAssistant size="default" className="flex-shrink-0" />

      {/* Content area */}
      <div className="flex-1 min-w-0 space-y-3 max-w-[90%] sm:max-w-[85%] pt-0.5">
        {/* Initial loading skeleton (no content, no tools yet) */}
        {isJustStarted && <LoadingSkeleton />}

        {/* Streaming text with cursor */}
        {hasContent && (
          <div className="rounded-2xl px-4 py-3 bg-muted">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap mb-0">
                {content}
                <BlinkingCursor />
              </p>
            </div>
          </div>
        )}

        {/* Tool calls - both pending and completed */}
        {pendingToolCalls.map((tool) => (
          <ToolCallDisplay key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
})

// =============================================================================
// Tool Call Display
// =============================================================================

interface ToolCallDisplayProps {
  tool: ToolCall
}

function ToolCallDisplay({ tool }: ToolCallDisplayProps) {
  const isPending = tool.status === 'pending' || tool.status === 'running'
  const isComplete = tool.status === 'complete'
  const isError = tool.status === 'error'

  // Pending: show loading card
  if (isPending) {
    return <ToolLoadingCard toolName={tool.name} />
  }

  // Complete or Error: show indicator + results
  return (
    <div className="space-y-2">
      <ToolIndicator toolCall={tool} />

      {/* Show results for completed tools */}
      {isComplete && tool.result && (
        <ToolResultDisplay name={tool.name} result={tool.result} />
      )}

      {/* Show error message */}
      {isError && tool.result && (
        <div className="text-sm text-destructive bg-destructive/5 rounded-lg p-3">
          {String((tool.result as Record<string, unknown>).error || 'an error occurred')}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Tool Result Display
// =============================================================================

interface ToolResultDisplayProps {
  name: string
  result: Record<string, unknown>
}

function ToolResultDisplay({ name, result }: ToolResultDisplayProps) {
  // Event results
  if (name === 'search_events' && Array.isArray(result.events)) {
    return <EventResultsGrid events={result.events} />
  }

  // Flight results
  if (name === 'search_flights') {
    const outbound = Array.isArray(result.outbound_flights)
      ? result.outbound_flights
      : []
    const returns = Array.isArray(result.return_flights)
      ? result.return_flights
      : undefined

    if (outbound.length > 0) {
      return <FlightResultsGrid outboundFlights={outbound} returnFlights={returns} />
    }
  }

  // Trip saved confirmation
  if (name === 'save_trip' && result.success) {
    return (
      <div className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 rounded-xl p-3">
        trip saved successfully!{' '}
        <a href="/trips" className="underline hover:no-underline">
          view it in your trips
        </a>
      </div>
    )
  }

  return null
}

// =============================================================================
// Blinking Cursor
// =============================================================================

/**
 * Blinking cursor shown at end of streaming text
 * Uses step-end for sharp on/off (like a real cursor)
 */
function BlinkingCursor() {
  return (
    <span
      className="inline-block w-2 h-4 ml-0.5 bg-foreground animate-blink align-middle"
      aria-hidden="true"
    />
  )
}

// =============================================================================
// Loading Skeleton
// =============================================================================

/**
 * Skeleton loading state when Claude just started thinking
 * Uses the pulse animation pattern with varied widths
 */
function LoadingSkeleton() {
  return (
    <div
      className="animate-pulse space-y-3 rounded-2xl px-4 py-3 bg-muted"
      aria-label="loading response"
    >
      {/* First line - full width */}
      <div className="h-3 w-3/4 rounded bg-muted-foreground/20" />

      {/* Second line - varied widths */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3 h-3 rounded bg-muted-foreground/20" />
          <div className="col-span-1 h-3 rounded bg-muted-foreground/20" />
        </div>
        <div className="h-3 w-1/2 rounded bg-muted-foreground/20" />
      </div>
    </div>
  )
}

// =============================================================================
// Tool Loading Card
// =============================================================================

/**
 * Loading indicator for a specific tool call
 * Only shows if tool is actually pending (truth-based)
 */
interface ToolLoadingCardProps {
  toolName: string
}

function ToolLoadingCard({ toolName }: ToolLoadingCardProps) {
  // Get display text, fallback to generic if unknown tool
  const displayText = TOOL_DISPLAY_TEXT[toolName] || 'working...'

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{displayText}</span>
    </div>
  )
}

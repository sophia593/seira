'use client'

import { memo } from 'react'
import { Loader2, Check, Circle, X, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ToolCall } from '@/stores/conversation-store'

// =============================================================================
// Types
// =============================================================================

interface ToolIndicatorProps {
  toolCall: ToolCall
  onRetry?: () => void
}

// =============================================================================
// Display Text Maps (lowercase per typography system)
// =============================================================================

const PENDING_TEXT: Record<string, string> = {
  search_events: 'searching for events...',
  search_flights: 'searching for flights...',
  save_trip: 'saving your trip...',
  research_web: 'searching the web...',
}

const COMPLETE_TEXT: Record<string, string> = {
  search_events: 'found events',
  search_flights: 'found flights',
  save_trip: 'trip saved',
  research_web: 'found results',
}

const EMPTY_TEXT: Record<string, string> = {
  search_events: 'no events found for those dates',
  search_flights: 'no flights available',
  save_trip: 'trip saved',
  research_web: 'no results found',
}

// P1 fix: More actionable error messages
const ERROR_TEXT: Record<string, string> = {
  search_events: "couldn't find events — try different dates or keywords",
  search_flights: "couldn't search flights — try again",
  save_trip: "couldn't save trip — try again",
  research_web: "search didn't work — try rephrasing",
}

// =============================================================================
// Main Component
// =============================================================================

export const ToolIndicator = memo(function ToolIndicator({
  toolCall,
  onRetry,
}: ToolIndicatorProps) {
  const { name, status, result } = toolCall

  const hasResults = checkHasResults(name, result)
  const displayText = getDisplayText(name, status, hasResults, result)
  const { icon, colorClass } = getIconConfig(status, hasResults)

  // Check if this error is retryable
  const isRetryable = status === 'error' && onRetry && isRetryableError(name)

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-muted/50 border border-border/50',
        'transition-all duration-200 ease-out',
        status === 'error' && 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 transition-opacity duration-200',
          colorClass
        )}
      >
        {icon}
      </div>

      {/* Status text */}
      <span
        className={cn(
          'text-sm',
          status === 'error'
            ? 'text-amber-700 dark:text-amber-300'
            : 'text-muted-foreground',
          'transition-opacity duration-200'
        )}
      >
        {displayText}
      </span>

      {/* Retry button for retryable errors */}
      {isRetryable && (
        <button
          onClick={onRetry}
          className="ml-auto flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          retry
        </button>
      )}
    </div>
  )
})

// =============================================================================
// Helper Functions
// =============================================================================

function checkHasResults(toolName: string, result: unknown): boolean {
  if (!result) return false

  const res = result as Record<string, unknown>

  switch (toolName) {
    case 'search_events':
      return Array.isArray(res.events) && res.events.length > 0
    case 'search_flights':
      return (
        (Array.isArray(res.outbound_flights) && res.outbound_flights.length > 0) ||
        (Array.isArray(res.return_flights) && res.return_flights.length > 0)
      )
    case 'save_trip':
      return Boolean(res.success)
    case 'research_web':
      // Has results if content exists and isn't an error
      return Boolean(res.content) && !res.error
    default:
      return Boolean(result)
  }
}

function getDisplayText(
  toolName: string,
  status: ToolCall['status'],
  hasResults: boolean,
  result?: unknown
): string {
  switch (status) {
    case 'pending':
    case 'running':
      return PENDING_TEXT[toolName] || 'working...'
    case 'complete':
      if (hasResults) {
        // For events/flights, could add count
        if (toolName === 'search_events' && result) {
          const res = result as Record<string, unknown>
          const count = Array.isArray(res.events) ? res.events.length : 0
          if (count > 0) return `found ${count} event${count !== 1 ? 's' : ''}`
        }
        if (toolName === 'search_flights' && result) {
          const res = result as Record<string, unknown>
          const outbound = Array.isArray(res.outbound_flights) ? res.outbound_flights.length : 0
          if (outbound > 0) return `found ${outbound} flight${outbound !== 1 ? 's' : ''}`
        }
        return COMPLETE_TEXT[toolName] || 'done'
      }
      return EMPTY_TEXT[toolName] || 'no results'
    case 'error':
      return ERROR_TEXT[toolName] || 'something went wrong — try again'
    default:
      return 'working...'
  }
}

function getIconConfig(
  status: ToolCall['status'],
  hasResults: boolean
): { icon: React.ReactNode; colorClass: string } {
  switch (status) {
    case 'pending':
    case 'running':
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        colorClass: 'text-muted-foreground',
      }
    case 'complete':
      if (hasResults) {
        return {
          icon: <Check className="w-4 h-4" />,
          colorClass: 'text-green-600 dark:text-green-500',
        }
      }
      return {
        icon: <Circle className="w-4 h-4" />,
        colorClass: 'text-muted-foreground',
      }
    case 'error':
      return {
        icon: <X className="w-4 h-4" />,
        colorClass: 'text-amber-600 dark:text-amber-400',
      }
    default:
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        colorClass: 'text-muted-foreground',
      }
  }
}

function isRetryableError(toolName: string): boolean {
  // Most tool errors are retryable except save_trip (needs user action)
  return toolName !== 'save_trip'
}

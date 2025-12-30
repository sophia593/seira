'use client'

import { memo } from 'react'
import { Loader2, Check, Circle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ToolCall } from '@/stores/conversation-store'

// =============================================================================
// Types
// =============================================================================

interface ToolIndicatorProps {
  toolCall: ToolCall
}

// =============================================================================
// Display Text Maps (lowercase per typography system)
// =============================================================================

// Pending state display text
const PENDING_TEXT: Record<string, string> = {
  search_events: 'searching for events...',
  search_flights: 'searching for flights...',
  save_trip: 'saving your trip...',
}

// Complete state display text (no counts)
const COMPLETE_TEXT: Record<string, string> = {
  search_events: 'found events',
  search_flights: 'found flights',
  save_trip: 'trip saved',
}

// Empty result display text
const EMPTY_TEXT: Record<string, string> = {
  search_events: 'no events found',
  search_flights: 'no flights available',
  save_trip: 'could not save trip',
}

// Error state display text
const ERROR_TEXT: Record<string, string> = {
  search_events: "couldn't search events",
  search_flights: "couldn't search flights",
  save_trip: "couldn't save trip",
}

// =============================================================================
// Main Component
// =============================================================================

export const ToolIndicator = memo(function ToolIndicator({
  toolCall,
}: ToolIndicatorProps) {
  const { name, status, result } = toolCall

  // Determine if results are empty
  const hasResults = checkHasResults(name, result)

  // Get display text based on state
  const displayText = getDisplayText(name, status, hasResults)

  // Get icon and styling based on state
  const { icon, colorClass } = getIconConfig(status, hasResults)

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-muted/50 border border-border/50',
        'transition-all duration-200 ease-out'
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
          'text-sm text-muted-foreground',
          'transition-opacity duration-200'
        )}
      >
        {displayText}
      </span>
    </div>
  )
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if tool result contains actual data
 */
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
    default:
      return Boolean(result)
  }
}

/**
 * Get display text based on tool state
 */
function getDisplayText(
  toolName: string,
  status: ToolCall['status'],
  hasResults: boolean
): string {
  switch (status) {
    case 'pending':
    case 'running':
      return PENDING_TEXT[toolName] || 'working...'
    case 'complete':
      if (hasResults) {
        return COMPLETE_TEXT[toolName] || 'complete'
      }
      return EMPTY_TEXT[toolName] || 'no results'
    case 'error':
      return ERROR_TEXT[toolName] || 'something went wrong'
    default:
      return 'working...'
  }
}

/**
 * Get icon component and color class based on state
 */
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
        colorClass: 'text-destructive',
      }
    default:
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        colorClass: 'text-muted-foreground',
      }
  }
}

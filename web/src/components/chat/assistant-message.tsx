'use client'

import { memo } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { AvatarAssistant } from '@/components/ui/avatar'
import { ToolIndicator } from './tool-indicator'
import { EventResultsGrid } from './tool-results/event-results-grid'
import { FlightResultsGrid } from './tool-results/flight-results-grid'
import type { SelectedEvent, SelectedFlight, ToolCall as StoreToolCall } from '@/stores/conversation-store'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ToolCall {
  id: string
  name: string
  input?: Record<string, unknown>
  result?: Record<string, unknown>
  is_error?: boolean
}

interface AssistantMessageProps {
  content: string
  toolCalls?: ToolCall[]
  selectedEvent?: SelectedEvent | null
  selectedFlight?: SelectedFlight | null
  onSelectEvent?: (event: SelectedEvent) => void
  onSelectFlight?: (flight: SelectedFlight) => void
  className?: string
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const AssistantMessage = memo(function AssistantMessage({
  content,
  toolCalls = [],
  selectedEvent,
  selectedFlight,
  onSelectEvent,
  onSelectFlight,
  className,
}: AssistantMessageProps) {
  const hasContent = content && content.length > 0
  const hasToolCalls = toolCalls && toolCalls.length > 0

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {/* Avatar */}
      <AvatarAssistant size="default" className="flex-shrink-0" />

      {/* Message content */}
      <div className="flex-1 space-y-3 max-w-[90%] sm:max-w-[85%] pt-0.5">
        {/* Text content */}
        {hasContent && (
          <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted">
            <div className="prose prose-sm max-w-none break-words prose-neutral dark:prose-invert">
              <Markdown content={content} />
            </div>
          </div>
        )}

        {/* Tool calls with results */}
        {hasToolCalls && (
          <div className="space-y-3">
            {toolCalls.map((tool) => (
              <CompletedToolCall
                key={tool.id}
                tool={tool}
                selectedEvent={selectedEvent}
                selectedFlight={selectedFlight}
                onSelectEvent={onSelectEvent}
                onSelectFlight={onSelectFlight}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

// -----------------------------------------------------------------------------
// Completed Tool Call (with results)
// -----------------------------------------------------------------------------

interface CompletedToolCallProps {
  tool: ToolCall
  selectedEvent?: SelectedEvent | null
  selectedFlight?: SelectedFlight | null
  onSelectEvent?: (event: SelectedEvent) => void
  onSelectFlight?: (flight: SelectedFlight) => void
}

function CompletedToolCall({
  tool,
  selectedEvent,
  selectedFlight,
  onSelectEvent,
  onSelectFlight,
}: CompletedToolCallProps) {
  const isError = tool.is_error

  // Convert to store ToolCall format for ToolIndicator
  const storeToolCall: StoreToolCall = {
    id: tool.id,
    name: tool.name,
    input: tool.input,
    result: tool.result,
    isError: tool.is_error,
    status: tool.is_error ? 'error' : 'complete',
  }

  return (
    <div className="space-y-2">
      {/* Status indicator */}
      <ToolIndicator toolCall={storeToolCall} />

      {/* Tool results */}
      {!isError && tool.result && (
        <ToolResultDisplay
          name={tool.name}
          result={tool.result}
          selectedEvent={selectedEvent}
          selectedFlight={selectedFlight}
          onSelectEvent={onSelectEvent}
          onSelectFlight={onSelectFlight}
        />
      )}

      {/* Error message */}
      {isError && tool.result && (
        <div className="text-sm text-destructive bg-destructive/5 rounded-lg p-3">
          {String(tool.result.error || 'an error occurred')}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Tool Result Display
// -----------------------------------------------------------------------------

interface ToolResultDisplayProps {
  name: string
  result: Record<string, unknown>
  selectedEvent?: SelectedEvent | null
  selectedFlight?: SelectedFlight | null
  onSelectEvent?: (event: SelectedEvent) => void
  onSelectFlight?: (flight: SelectedFlight) => void
}

function ToolResultDisplay({
  name,
  result,
  onSelectEvent,
}: ToolResultDisplayProps) {
  // Event results
  if (name === "search_events" && Array.isArray(result.events)) {
    return <EventResultsGrid events={result.events} onSelect={onSelectEvent} />
  }

  // Flight results
  if (name === "search_flights") {
    const outbound = Array.isArray(result.outbound_flights)
      ? result.outbound_flights
      : []
    const returns = Array.isArray(result.return_flights)
      ? result.return_flights
      : undefined

    if (outbound.length > 0) {
      return (
        <FlightResultsGrid
          outboundFlights={outbound}
          returnFlights={returns}
        />
      )
    }
  }

  // Trip saved confirmation
  if (name === 'save_trip' && result.success) {
    return (
      <div className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 rounded-xl p-3">
        trip saved successfully!{' '}
        <Link href="/trips" className="underline hover:no-underline">
          view it in your trips
        </Link>
      </div>
    )
  }

  return null
}

// -----------------------------------------------------------------------------
// Markdown Renderer
// -----------------------------------------------------------------------------

interface MarkdownProps {
  content: string
}

function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc pl-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal pl-4">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            {children}
          </a>
        ),
        code: ({ className, children }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            )
          }
          return (
            <code
              className={cn(
                "block bg-muted-foreground/10 p-3 rounded-lg text-sm font-mono overflow-x-auto",
                className
              )}
            >
              {children}
            </code>
          )
        },
        pre: ({ children }) => <pre className="mb-2">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic">
            {children}
          </blockquote>
        ),
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-1">{children}</h3>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

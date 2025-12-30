"use client"

import { memo, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { AvatarAssistant, AvatarUser } from "@/components/ui/avatar"
import {
  Loader2,
  Check,
  X,
  Copy,
  CheckCheck,
  Calendar,
  MapPin,
  Plane,
  Clock,
} from "lucide-react"
import { useUserStore } from "@/stores/user-store"
import {
  useConversationStore,
  selectSelectedEvent,
  selectSelectedFlight,
  type SelectedEvent,
  type SelectedFlight,
} from "@/stores/conversation-store"

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

interface Message {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  tool_calls?: unknown[]
  created_at: string
}

interface MessageItemProps {
  message: Message
  isLast?: boolean
  className?: string
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const MessageItem = memo(function MessageItem({
  message,
  isLast = false,
  className,
}: MessageItemProps) {
  const user = useUserStore((state) => state.user)
  const selectedEvent = useConversationStore(selectSelectedEvent)
  const selectedFlight = useConversationStore(selectSelectedFlight)
  const selectEvent = useConversationStore((s) => s.selectEvent)
  const selectFlight = useConversationStore((s) => s.selectFlight)

  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  const isStreaming = isLast && message.id === "streaming"

  // Don't render system or tool messages directly
  if (message.role === "system" || message.role === "tool") {
    return null
  }

  const timestamp = formatTimestamp(message.created_at)
  const toolCalls = message.tool_calls as ToolCall[] | undefined

  return (
    <div
      className={cn(
        "group flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row",
        className
      )}
      role="article"
      aria-label={`${isUser ? "Your" : "Assistant"} message`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isAssistant && <AvatarAssistant size="default" />}
        {isUser && (
          <AvatarUser
            src={user?.avatar_url}
            name={user?.name}
            size="default"
          />
        )}
      </div>

      {/* Message content */}
      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {/* Main bubble */}
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted border border-border/50"
          )}
        >
          {/* Text content with markdown */}
          {message.content ? (
            <div
              className={cn(
                "prose prose-sm max-w-none break-words",
                isUser
                  ? "prose-invert prose-p:text-primary-foreground prose-strong:text-primary-foreground"
                  : "prose-neutral dark:prose-invert"
              )}
            >
              <Markdown content={message.content} isUserMessage={isUser} />
              {isStreaming && <StreamingCursor />}
            </div>
          ) : isStreaming ? (
            <ThinkingIndicator />
          ) : null}
        </div>

        {/* Tool calls (outside the bubble for better layout) */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="w-full max-w-[85%] space-y-3 mt-2">
            {toolCalls.map((tool) => (
              <ToolCallCard
                key={tool.id}
                tool={tool}
                selectedEvent={selectedEvent}
                selectedFlight={selectedFlight}
                onSelectEvent={selectEvent}
                onSelectFlight={selectFlight}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span
          className={cn(
            "text-[10px] text-muted-foreground/60 px-1",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
        >
          {timestamp}
        </span>
      </div>
    </div>
  )
})

// -----------------------------------------------------------------------------
// Streaming Cursor
// -----------------------------------------------------------------------------

function StreamingCursor() {
  return (
    <span
      className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5 align-middle rounded-sm"
      aria-label="Typing"
    />
  )
}

// -----------------------------------------------------------------------------
// Thinking Indicator
// -----------------------------------------------------------------------------

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Thinking">
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "0ms", animationDuration: "600ms" }}
      />
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "150ms", animationDuration: "600ms" }}
      />
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "300ms", animationDuration: "600ms" }}
      />
    </div>
  )
}

// -----------------------------------------------------------------------------
// Markdown Renderer
// -----------------------------------------------------------------------------

interface MarkdownProps {
  content: string
  isUserMessage?: boolean
}

function Markdown({ content, isUserMessage = false }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc pl-4 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal pl-4 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline underline-offset-2 hover:no-underline transition-colors",
              isUserMessage
                ? "text-primary-foreground/90 hover:text-primary-foreground"
                : "text-primary hover:text-primary/80"
            )}
          >
            {children}
          </a>
        ),
        code: ({ className, children }) => {
          const isInline = !className
          const codeString = String(children).replace(/\n$/, "")

          if (isInline) {
            return (
              <code
                className={cn(
                  "px-1.5 py-0.5 rounded text-[13px] font-mono",
                  isUserMessage
                    ? "bg-primary-foreground/20"
                    : "bg-muted-foreground/15"
                )}
              >
                {children}
              </code>
            )
          }

          return <CodeBlock code={codeString} className={className} />
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote
            className={cn(
              "border-l-2 pl-3 italic my-2",
              isUserMessage
                ? "border-primary-foreground/40"
                : "border-muted-foreground/40"
            )}
          >
            {children}
          </blockquote>
        ),
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>
        ),
        hr: () => <hr className="my-4 border-muted-foreground/20" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-muted-foreground/20 px-3 py-1.5 text-left font-medium bg-muted/50">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-muted-foreground/20 px-3 py-1.5">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// -----------------------------------------------------------------------------
// Code Block with Copy Button
// -----------------------------------------------------------------------------

interface CodeBlockProps {
  code: string
  className?: string
}

function CodeBlock({ code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  // Extract language from className (e.g., "language-typescript")
  const language = className?.replace("language-", "") || ""

  return (
    <div className="relative group/code my-2 -mx-1">
      {/* Language label */}
      {language && (
        <div className="absolute top-0 left-0 px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded-tl-lg rounded-br">
          {language}
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-1 right-1 p-1.5 rounded-md transition-all",
          "opacity-0 group-hover/code:opacity-100",
          "bg-muted-foreground/10 hover:bg-muted-foreground/20",
          "text-muted-foreground hover:text-foreground"
        )}
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? (
          <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Code content */}
      <pre
        className={cn(
          "p-3 rounded-lg text-[13px] font-mono overflow-x-auto",
          "bg-muted-foreground/10",
          language && "pt-6"
        )}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Tool Call Card
// -----------------------------------------------------------------------------

interface ToolCallCardProps {
  tool: ToolCall
  selectedEvent: SelectedEvent | null
  selectedFlight: SelectedFlight | null
  onSelectEvent: (event: SelectedEvent | null) => void
  onSelectFlight: (flight: SelectedFlight | null) => void
}

const toolDisplayInfo: Record<string, { label: string; activeLabel: string; icon: typeof Loader2 }> = {
  search_events: { label: "Found events", activeLabel: "Searching events", icon: Calendar },
  search_flights: { label: "Found flights", activeLabel: "Searching flights", icon: Plane },
  save_trip: { label: "Trip saved", activeLabel: "Saving trip", icon: Check },
}

function ToolCallCard({
  tool,
  selectedEvent,
  selectedFlight,
  onSelectEvent,
  onSelectFlight,
}: ToolCallCardProps) {
  const isComplete = tool.result !== undefined
  const isError = tool.is_error

  const info = toolDisplayInfo[tool.name] || {
    label: tool.name,
    activeLabel: tool.name,
    icon: Loader2,
  }
  const Icon = info.icon
  const displayName = isComplete ? info.label : info.activeLabel

  return (
    <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
      {/* Status badge */}
      <div
        className={cn(
          "inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1.5",
          "transition-colors duration-200",
          isError
            ? "bg-destructive/10 text-destructive border border-destructive/20"
            : isComplete
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            : "bg-muted text-muted-foreground border border-border"
        )}
      >
        {!isComplete && <Loader2 className="w-3 h-3 animate-spin" />}
        {isComplete && !isError && <Icon className="w-3 h-3" />}
        {isError && <X className="w-3 h-3" />}
        <span>{displayName}</span>
      </div>

      {/* Result content */}
      {isComplete && tool.result && !isError && (
        <ToolResultContent
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
        <div className="text-sm text-destructive bg-destructive/5 rounded-lg p-3 border border-destructive/10">
          {String(tool.result.error || tool.result.message || "An error occurred")}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Tool Result Content
// -----------------------------------------------------------------------------

interface ToolResultContentProps {
  name: string
  result: Record<string, unknown>
  selectedEvent: SelectedEvent | null
  selectedFlight: SelectedFlight | null
  onSelectEvent: (event: SelectedEvent | null) => void
  onSelectFlight: (flight: SelectedFlight | null) => void
}

function ToolResultContent({
  name,
  result,
  selectedEvent,
  selectedFlight,
  onSelectEvent,
  onSelectFlight,
}: ToolResultContentProps) {
  // Event search results
  if (name === "search_events" && Array.isArray(result.events)) {
    const events = result.events as Array<{
      id: string
      name: string
      date: string
      venue: string
      city: string
      image_url?: string
      price_range?: string
    }>

    if (events.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No events found matching your search.
        </p>
      )
    }

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {events.length} event{events.length !== 1 ? "s" : ""} found. Click to select:
        </p>
        <div className="grid gap-2">
          {events.slice(0, 4).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isSelected={selectedEvent?.id === event.id}
              onSelect={() => {
                if (selectedEvent?.id === event.id) {
                  onSelectEvent(null)
                } else {
                  onSelectEvent({
                    id: event.id,
                    name: event.name,
                    date: event.date,
                    venue: event.venue,
                    city: event.city,
                    imageUrl: event.image_url,
                    priceRange: event.price_range,
                  })
                }
              }}
            />
          ))}
        </div>
        {events.length > 4 && (
          <p className="text-xs text-muted-foreground">
            +{events.length - 4} more events
          </p>
        )}
      </div>
    )
  }

  // Flight search results
  if (name === "search_flights" && Array.isArray(result.outbound_flights)) {
    const flights = result.outbound_flights as Array<{
      id: string
      airline: string
      flight_number: string
      departure_airport: string
      departure_time: string
      arrival_airport: string
      arrival_time: string
      price: number
      duration: string
    }>

    if (flights.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No flights found matching your search.
        </p>
      )
    }

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {flights.length} flight{flights.length !== 1 ? "s" : ""} found:
        </p>
        <div className="grid gap-2">
          {flights.slice(0, 3).map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              isSelected={selectedFlight?.id === flight.id}
              onSelect={() => {
                if (selectedFlight?.id === flight.id) {
                  onSelectFlight(null)
                } else {
                  onSelectFlight({
                    id: flight.id,
                    airline: flight.airline,
                    flightNumber: flight.flight_number,
                    departure: {
                      airport: flight.departure_airport,
                      time: flight.departure_time,
                      date: "",
                    },
                    arrival: {
                      airport: flight.arrival_airport,
                      time: flight.arrival_time,
                      date: "",
                    },
                    price: flight.price,
                    duration: flight.duration,
                  })
                }
              }}
            />
          ))}
        </div>
        {flights.length > 3 && (
          <p className="text-xs text-muted-foreground">
            +{flights.length - 3} more flights
          </p>
        )}
      </div>
    )
  }

  // Trip saved confirmation
  if (name === "save_trip" && result.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
        <Check className="w-4 h-4" />
        <span>Trip saved successfully! View it in your trips.</span>
      </div>
    )
  }

  return null
}

// -----------------------------------------------------------------------------
// Event Card
// -----------------------------------------------------------------------------

interface EventCardProps {
  event: {
    id: string
    name: string
    date: string
    venue: string
    city: string
    image_url?: string
    price_range?: string
  }
  isSelected: boolean
  onSelect: () => void
}

function EventCard({ event, isSelected, onSelect }: EventCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-sm",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-background hover:bg-accent/50"
      )}
    >
      <div className="flex gap-3">
        {event.image_url && (
          <div className="flex-shrink-0 w-14 h-14 rounded-md overflow-hidden bg-muted">
            <img
              src={event.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm truncate">{event.name}</h4>
            {isSelected && (
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </div>
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatEventDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{event.venue}, {event.city}</span>
            </div>
          </div>
          {event.price_range && (
            <p className="mt-1.5 text-xs font-medium text-primary">
              {event.price_range}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// -----------------------------------------------------------------------------
// Flight Card
// -----------------------------------------------------------------------------

interface FlightCardProps {
  flight: {
    id: string
    airline: string
    flight_number: string
    departure_airport: string
    departure_time: string
    arrival_airport: string
    arrival_time: string
    price: number
    duration: string
  }
  isSelected: boolean
  onSelect: () => void
}

function FlightCard({ flight, isSelected, onSelect }: FlightCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-sm",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-background hover:bg-accent/50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            <Plane className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{flight.airline}</p>
            <p className="text-xs text-muted-foreground">{flight.flight_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-sm font-medium">{flight.departure_time}</p>
            <p className="text-xs text-muted-foreground">{flight.departure_airport}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{flight.duration}</span>
            </div>
            <div className="w-12 h-px bg-border my-1" />
          </div>
          <div>
            <p className="text-sm font-medium">{flight.arrival_time}</p>
            <p className="text-xs text-muted-foreground">{flight.arrival_airport}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-primary">${flight.price}</p>
          {isSelected && <Check className="w-4 h-4 text-primary" />}
        </div>
      </div>
    </button>
  )
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatTimestamp(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

function formatEventDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateString
  }
}

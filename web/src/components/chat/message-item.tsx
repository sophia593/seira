"use client"

import { memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { AvatarAssistant, AvatarUser } from "@/components/ui/avatar"
import { Loader2, Check, X } from "lucide-react"
import { useUserStore } from "@/stores/user-store"

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
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const MessageItem = memo(function MessageItem({
  message,
  isLast = false,
}: MessageItemProps) {
  const user = useUserStore((state) => state.user)
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  const isStreaming = isLast && message.id === "streaming"

  // Don't render system or tool messages directly
  if (message.role === "system" || message.role === "tool") {
    return null
  }

  return (
    <div
      className={cn(
        "flex gap-3 px-4",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      {isAssistant && <AvatarAssistant size="default" />}
      {isUser && (
        <AvatarUser
          src={user?.avatar_url}
          name={user?.name}
          size="default"
        />
      )}

      {/* Message content */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {/* Text content with markdown */}
        {message.content ? (
          <div
            className={cn(
              "prose prose-sm max-w-none break-words",
              isUser
                ? "prose-invert"
                : "prose-neutral dark:prose-invert"
            )}
          >
            <Markdown content={message.content} />
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        ) : isStreaming ? (
          <ThinkingIndicator />
        ) : null}

        {/* Tool calls */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-3 space-y-2">
            {(message.tool_calls as ToolCall[]).map((tool) => (
              <ToolCallCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

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
        // Override default elements for better styling
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
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
        code: ({ className, children, ...props }) => {
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
              {...props}
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
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function ThinkingIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Loader2 className="w-3 h-3 animate-spin" />
      <span className="text-sm">Thinking...</span>
    </span>
  )
}

interface ToolCallCardProps {
  tool: ToolCall
}

function ToolCallCard({ tool }: ToolCallCardProps) {
  const isComplete = tool.result !== undefined
  const isError = tool.is_error

  const toolDisplayNames: Record<string, string> = {
    search_events: "Searching events",
    search_flights: "Searching flights",
    save_trip: "Saving trip",
  }

  const displayName = toolDisplayNames[tool.name] || tool.name

  return (
    <div
      className={cn(
        "text-xs rounded-lg px-3 py-2 border",
        isError
          ? "bg-destructive/10 border-destructive/20"
          : isComplete
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-background border-border"
      )}
    >
      <div className="flex items-center gap-2">
        {!isComplete && (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        )}
        {isComplete && !isError && (
          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        )}
        {isError && <X className="w-3 h-3 text-destructive" />}
        <span
          className={cn(
            "font-medium",
            isError
              ? "text-destructive"
              : isComplete
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-foreground"
          )}
        >
          {displayName}
        </span>
      </div>

      {/* Result preview */}
      {isComplete && tool.result && !isError && (
        <ToolResultSummary name={tool.name} result={tool.result} />
      )}
    </div>
  )
}

interface ToolResultSummaryProps {
  name: string
  result: Record<string, unknown>
}

function ToolResultSummary({ name, result }: ToolResultSummaryProps) {
  if (name === "search_events" && typeof result.count === "number") {
    return (
      <p className="mt-1 text-muted-foreground">
        Found {result.count} event{result.count !== 1 ? "s" : ""}
      </p>
    )
  }

  if (name === "search_flights" && Array.isArray(result.outbound_flights)) {
    const count = result.outbound_flights.length
    return (
      <p className="mt-1 text-muted-foreground">
        Found {count} flight{count !== 1 ? "s" : ""}
      </p>
    )
  }

  if (name === "save_trip" && result.success) {
    return (
      <p className="mt-1 text-muted-foreground">Trip saved successfully</p>
    )
  }

  return null
}

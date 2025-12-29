"use client"

import { memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { AvatarAssistant } from "@/components/ui/avatar"
import { Loader2, Check, X } from "lucide-react"
import type { ToolCall } from "@/stores/conversation-store"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface StreamingMessageProps {
  content: string
  toolCalls?: ToolCall[]
  className?: string
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const StreamingMessage = memo(function StreamingMessage({
  content,
  toolCalls = [],
  className,
}: StreamingMessageProps) {
  const hasContent = content.length > 0
  const hasToolCalls = toolCalls.length > 0

  return (
    <div className={cn("flex gap-3 px-4", className)}>
      {/* Avatar */}
      <AvatarAssistant size="default" />

      {/* Message content */}
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
        {/* Typing indicator before first token */}
        {!hasContent && !hasToolCalls && <TypingIndicator />}

        {/* Streaming text content */}
        {hasContent && (
          <div className="prose prose-sm max-w-none break-words prose-neutral dark:prose-invert">
            <Markdown content={content} />
            <StreamingCursor />
          </div>
        )}

        {/* Tool calls */}
        {hasToolCalls && (
          <div className={cn("space-y-2", hasContent && "mt-3")}>
            {toolCalls.map((tool) => (
              <ToolCallCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

// -----------------------------------------------------------------------------
// Typing Indicator (before first token)
// -----------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="sr-only">Thinking</span>
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
// Streaming Cursor
// -----------------------------------------------------------------------------

function StreamingCursor() {
  return (
    <span
      className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-middle"
      aria-hidden="true"
    />
  )
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

// -----------------------------------------------------------------------------
// Tool Call Card
// -----------------------------------------------------------------------------

interface ToolCallCardProps {
  tool: ToolCall
}

const toolDisplayNames: Record<string, string> = {
  search_events: "Searching events",
  search_flights: "Searching flights",
  save_trip: "Saving trip",
}

function ToolCallCard({ tool }: ToolCallCardProps) {
  const isComplete = tool.status === "complete"
  const isError = tool.status === "error"
  const isRunning = tool.status === "running"

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
        {isRunning && (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        )}
        {isComplete && (
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

// -----------------------------------------------------------------------------
// Tool Result Summary
// -----------------------------------------------------------------------------

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

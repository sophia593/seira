"use client"

import { memo } from "react"
import { Plane, Calendar, Music, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
  className?: string
}

const suggestions = [
  {
    icon: Music,
    text: "Taylor Swift concerts near me",
  },
  {
    icon: Ticket,
    text: "Find Lakers games in February",
  },
  {
    icon: Calendar,
    text: "Comedy shows in NYC this weekend",
  },
]

export const EmptyState = memo(function EmptyState({
  onSuggestionClick,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] text-center px-4",
        className
      )}
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Plane className="w-8 h-8 text-primary" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold mb-2">Plan your next adventure</h2>

      {/* Subheading */}
      <p className="text-muted-foreground max-w-md mb-8">
        Tell me about an event you want to attend, and I&apos;ll help you plan
        the perfect trip with flights and everything coordinated.
      </p>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {suggestions.map((suggestion) => (
          <SuggestionChip
            key={suggestion.text}
            icon={suggestion.icon}
            text={suggestion.text}
            onClick={() => onSuggestionClick(suggestion.text)}
          />
        ))}
      </div>
    </div>
  )
})

// -----------------------------------------------------------------------------
// Suggestion Chip
// -----------------------------------------------------------------------------

interface SuggestionChipProps {
  icon: React.ComponentType<{ className?: string }>
  text: string
  onClick: () => void
}

function SuggestionChip({ icon: Icon, text, onClick }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-sm",
        "bg-secondary hover:bg-secondary/80 rounded-full",
        "transition-colors cursor-pointer",
        "border border-transparent hover:border-primary/20"
      )}
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span>{text}</span>
    </button>
  )
}

"use client"

import { memo } from "react"
import { Plane, Calendar, Music, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
  className?: string
}

// Fixed suggestions to avoid hydration mismatch (no Math.random())
const suggestions = [
  { icon: Music, text: "Taylor Swift concerts near me" },
  { icon: Ticket, text: "NBA games in Los Angeles" },
  { icon: Calendar, text: "Comedy shows in NYC this weekend" },
]

export const EmptyState = memo(function EmptyState({
  onSuggestionClick,
  className,
}: EmptyStateProps) {

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] text-center px-4",
        className
      )}
    >
      {/* Icon */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
        <Plane className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
      </div>

      {/* Heading */}
      <h2 className="text-xl sm:text-2xl font-semibold mb-2 lowercase">plan your next adventure</h2>

      {/* Subheading */}
      <p className="text-sm sm:text-base text-muted-foreground max-w-sm sm:max-w-md mb-6 sm:mb-8">
        tell me about an event you want to attend, and i&apos;ll help you plan
        the perfect trip with flights and everything coordinated.
      </p>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 justify-center max-w-xs sm:max-w-lg">
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
        "inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm",
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

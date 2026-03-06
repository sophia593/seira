import { cn } from "@/lib/utils"

// =============================================================================
// Badge config — maps type + value to color and display label
// =============================================================================

const BADGE_CONFIG: Record<string, Record<string, { color: string; label: string }>> = {
  status: {
    development:     { color: "#3B82F6", label: "Development" },
    pre_production:  { color: "#F59E0B", label: "Pre-Production" },
    production:      { color: "#10B981", label: "Production" },
    post_production: { color: "#6366F1", label: "Post-Production" },
    wrapped:         { color: "#71717A", label: "Wrapped" },
  },
  priority: {
    urgent: { color: "#E5484D", label: "Urgent" },
    high:   { color: "#F97316", label: "High" },
    medium: { color: "#F59E0B", label: "Medium" },
    low:    { color: "#71717A", label: "Low" },
  },
  "call-sheet": {
    draft:     { color: "#71717A", label: "Draft" },
    published: { color: "#3B82F6", label: "Published" },
    live:      { color: "#10B981", label: "Live" },
    wrapped:   { color: "#71717A", label: "Wrapped" },
  },
  confirmation: {
    confirmed: { color: "#10B981", label: "Confirmed" },
    viewed:    { color: "#3B82F6", label: "Viewed" },
    pending:   { color: "#71717A", label: "Pending" },
  },
}

const FALLBACK = { color: "#71717A" }

// =============================================================================
// Size config
// =============================================================================

const SIZE_CONFIG = {
  sm: { dot: 5, text: 11, padding: "2px 6px" },
  md: { dot: 6, text: 12, padding: "4px 8px" },
} as const

// =============================================================================
// Badge
// =============================================================================

interface BadgeProps {
  type: "status" | "priority" | "call-sheet" | "confirmation"
  value: string
  size?: "sm" | "md"
  showDot?: boolean
  showBackground?: boolean
  className?: string
}

function Badge({
  type,
  value,
  size = "md",
  showDot = true,
  showBackground = true,
  className,
}: BadgeProps) {
  const config = BADGE_CONFIG[type]?.[value]
  const color = config?.color ?? FALLBACK.color
  const label = config?.label ?? value

  const sizeConfig = SIZE_CONFIG[size]
  const isUrgentPulse = type === "priority" && value === "urgent"

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-[4px]", className)}
      style={{
        backgroundColor: showBackground ? `${color}20` : undefined,
        padding: showBackground ? sizeConfig.padding : undefined,
      }}
    >
      {showDot && (
        <span
          className="shrink-0 rounded-full"
          style={{
            width: sizeConfig.dot,
            height: sizeConfig.dot,
            backgroundColor: color,
            animation: isUrgentPulse
              ? "badgePulse 2s ease-in-out infinite"
              : undefined,
          }}
        />
      )}
      <span
        style={{
          color,
          fontSize: sizeConfig.text,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </span>
  )
}

export { Badge, BADGE_CONFIG }
export type { BadgeProps }

import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// EmptyState
// =============================================================================

interface EmptyStateProps {
  icon?: React.ElementType
  illustration?: string
  headline: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

function EmptyState({
  icon: Icon,
  illustration,
  headline,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center min-h-[300px] max-w-[400px] mx-auto px-4",
        className
      )}
    >
      {/* Icon or illustration */}
      {illustration ? (
        <img
          src={illustration}
          alt=""
          className="w-[120px] h-auto"
          aria-hidden="true"
        />
      ) : Icon ? (
        <Icon className="size-12 text-[#A1A1AA]" aria-hidden="true" />
      ) : null}

      {/* Headline */}
      <h3
        className={cn(
          "text-[16px] font-semibold text-[#18181B]",
          (Icon || illustration) && "mt-4"
        )}
      >
        {headline}
      </h3>

      {/* Description */}
      <p className="text-[13px] text-[#71717A] max-w-[320px] leading-relaxed mt-2">
        {description}
      </p>

      {/* Action link */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="group flex items-center gap-1 mt-5 text-[13px] font-medium text-[#71717A] hover:text-[#18181B] transition-colors duration-150 cursor-pointer"
        >
          {action.label}
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }

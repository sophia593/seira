"use client"

import * as React from "react"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// InlineFeedback
// =============================================================================

interface InlineFeedbackProps {
  type: "success" | "error"
  message: string
  show: boolean
  autoDismiss?: boolean
  dismissAfter?: number
  onDismiss?: () => void
  className?: string
}

const VARIANT = {
  success: {
    icon: CheckCircle,
    color: "text-[#10B981]",
  },
  error: {
    icon: AlertTriangle,
    color: "text-[#E5484D]",
  },
} as const

function InlineFeedback({
  type,
  message,
  show,
  autoDismiss,
  dismissAfter = 3000,
  onDismiss,
  className,
}: InlineFeedbackProps) {
  // Default autoDismiss: true for success, false for error
  const shouldAutoDismiss = autoDismiss ?? type === "success"

  React.useEffect(() => {
    if (!show || !shouldAutoDismiss) return
    const timer = setTimeout(() => {
      onDismiss?.()
    }, dismissAfter)
    return () => clearTimeout(timer)
  }, [show, shouldAutoDismiss, dismissAfter, onDismiss])

  if (!show) return null

  const { icon: Icon, color } = VARIANT[type]

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 mt-2",
        color,
        className
      )}
      style={{ animation: "inlineFeedbackIn 200ms ease-out" }}
      role="status"
    >
      <Icon className="size-4 shrink-0" />
      <span className="text-[13px]">{message}</span>
      {type === "error" && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto text-[13px] text-[#E5484D] hover:underline cursor-pointer shrink-0"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}

export { InlineFeedback }
export type { InlineFeedbackProps }

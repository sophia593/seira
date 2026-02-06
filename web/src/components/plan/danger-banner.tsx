"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConstraintFlag } from "@/lib/types"

interface DangerBannerProps {
  flags: ConstraintFlag[]
  onScrollToTarget?: (targetId: string) => void
  className?: string
}

export function DangerBanner({
  flags,
  onScrollToTarget,
  className,
}: DangerBannerProps) {
  const [expanded, setExpanded] = useState(false)
  const dangerFlags = flags.filter((f) => f.severity === "danger")

  if (dangerFlags.length === 0) return null

  return (
    <div
      className={cn(
        "rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30",
        className,
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/40">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 stroke-[2]" />
          </div>
          <span className="text-sm font-medium text-rose-800 dark:text-rose-300 lowercase tracking-tight">
            {dangerFlags.length}{" "}
            {dangerFlags.length === 1 ? "issue" : "issues"} needs attention
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-rose-500 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {dangerFlags.map((flag) => (
            <div
              key={flag.id}
              className="text-sm text-rose-700 dark:text-rose-300/90 leading-relaxed"
            >
              <span>{flag.message}</span>
              {flag.targetId && onScrollToTarget && (
                <button
                  onClick={() => onScrollToTarget(flag.targetId!)}
                  className="ml-2 text-xs text-rose-600 dark:text-rose-400 underline underline-offset-2 hover:no-underline lowercase"
                >
                  view
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { Car, Footprints, TrainFront } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TransportSegment } from "@/lib/types"

interface TransportRowProps {
  segment: TransportSegment
  className?: string
}

export function TransportRow({ segment, className }: TransportRowProps) {
  // Infer mode icon from distance / label
  const isWalking =
    segment.distance.includes("0.") || segment.estimatedMinutes <= 10
  const ModeIcon = isWalking ? Footprints : Car

  return (
    <div className={cn("py-4", className)}>
      {/* Main row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ModeIcon className="h-4 w-4 text-muted-foreground/40 stroke-[1.5] shrink-0" />
          <span className="text-sm lowercase tracking-tight truncate">
            {segment.label.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-right">
          <span className="text-data text-sm font-medium">
            {segment.distance}
          </span>
          <span className="text-muted-foreground/20">&middot;</span>
          <span className="text-data text-sm text-muted-foreground/60">
            ~{segment.estimatedMinutes} min
          </span>
          <span className="text-muted-foreground/20">&middot;</span>
          <span className="text-data text-sm font-medium">
            ${segment.rideshareEstimate}
          </span>
        </div>
      </div>

      {/* Transit note */}
      {segment.transitNote && (
        <div className="mt-2 flex items-start gap-3 pl-7">
          <TrainFront className="h-3 w-3 text-muted-foreground/30 stroke-[1.5] shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground/50 leading-relaxed">
            {segment.transitNote}
          </p>
        </div>
      )}

      {/* Late-night note */}
      {segment.lateNightNote && (
        <div className="mt-2 pl-7">
          <p className="text-xs text-amber-600 dark:text-amber-400/80 leading-relaxed">
            {segment.lateNightNote}
          </p>
        </div>
      )}
    </div>
  )
}

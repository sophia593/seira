"use client"

import { Share2, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CostEstimate } from "@/lib/types"

interface CostSummaryProps {
  costEstimate: CostEstimate
  selectedTotal?: number | null
  onShare?: () => void
  onSave?: () => void
  className?: string
}

export function CostSummary({
  costEstimate,
  selectedTotal,
  onShare,
  onSave,
  className,
}: CostSummaryProps) {
  return (
    <section className={cn(className)}>
      <h2 className="text-label mb-8">estimated trip cost</h2>

      {/* Total range */}
      <div className="mb-8">
        <p className="text-data text-4xl sm:text-5xl font-bold tracking-tight mb-2">
          ${costEstimate.min}&ndash;${costEstimate.max}
        </p>
        {selectedTotal && (
          <p className="text-sm text-muted-foreground/60">
            your selections:{" "}
            <span className="text-data font-semibold text-foreground">
              ${selectedTotal}
            </span>
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-4 mb-10">
        {costEstimate.breakdown.map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-muted-foreground/60 lowercase">
              {item.category}
            </span>
            <span className="text-data text-sm font-medium">
              ${item.min}&ndash;${item.max}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={onShare} size="lg" className="flex-1">
          <Share2 className="h-4 w-4 mr-2 stroke-[1.5]" />
          share this plan
        </Button>
        <Button onClick={onSave} variant="outline" size="lg" className="flex-1">
          <Bookmark className="h-4 w-4 mr-2 stroke-[1.5]" />
          save plan
        </Button>
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import { Share2, Bookmark, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { CostEstimate } from "@/lib/types"

interface MobileCostBarProps {
  costEstimate: CostEstimate
  selectedTotal?: number | null
  onShare?: () => void
  onSave?: () => void
  className?: string
}

export function MobileCostBar({
  costEstimate,
  selectedTotal,
  onShare,
  onSave,
  className,
}: MobileCostBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      {/* Fixed bottom bar - only visible on mobile */}
      <div
        className={cn(
          "md:hidden fixed bottom-16 left-0 right-0 z-40",
          "bg-background/95 backdrop-blur-md",
          "border-t border-border/30",
          "px-4 py-3",
          "pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Cost tap target */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 min-w-0"
          >
            <span className="text-data text-lg font-bold">
              {selectedTotal
                ? `$${selectedTotal}`
                : `$${costEstimate.min}–$${costEstimate.max}`}
            </span>
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/40 stroke-[2]" />
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={onShare}
              size="sm"
              className="h-9 px-3.5"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
              share
            </Button>
            <Button
              onClick={onSave}
              variant="outline"
              size="icon-sm"
              className="h-9 w-9"
            >
              <Bookmark className="h-3.5 w-3.5 stroke-[1.5]" />
              <span className="sr-only">save plan</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom sheet for full breakdown */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[60vh]">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="text-lg font-semibold lowercase tracking-tight">
              estimated trip cost
            </SheetTitle>
            <SheetDescription className="sr-only">
              Full cost breakdown for this trip plan
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-8">
            {/* Total */}
            <p className="text-data text-3xl font-bold tracking-tight mb-1">
              ${costEstimate.min}&ndash;${costEstimate.max}
            </p>
            {selectedTotal && (
              <p className="text-sm text-muted-foreground/60 mb-6">
                your selections:{" "}
                <span className="text-data font-semibold text-foreground">
                  ${selectedTotal}
                </span>
              </p>
            )}

            {/* Breakdown */}
            <div className="space-y-4 mt-6">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

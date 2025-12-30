"use client"

import { memo } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ScrollToBottomProps {
  show: boolean
  onClick: () => void
  className?: string
}

export const ScrollToBottom = memo(function ScrollToBottom({
  show,
  onClick,
  className,
}: ScrollToBottomProps) {
  if (!show) return null

  return (
    <div
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-10",
        className
      )}
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={onClick}
        className="rounded-full shadow-lg gap-1 px-3"
      >
        <ChevronDown className="w-4 h-4" />
        <span className="text-xs">New messages</span>
      </Button>
    </div>
  )
})

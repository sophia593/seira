"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

type ScrollAreaProps = React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.Root
> & {
  /** Forward a ref to the Radix Viewport element (critical for programmatic scrolling) */
  viewportRef?: React.Ref<HTMLDivElement>
  /** Optional className for the viewport itself (padding, etc.) */
  viewportClassName?: string
}

function ScrollArea({
  className,
  children,
  viewportRef,
  viewportClassName,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        ref={viewportRef}
        className={cn(
          // Fill available space; smooth but performant
          "h-full w-full scroll-smooth",
          viewportClassName
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      <ScrollBar />
      <ScrollBar orientation="horizontal" />

      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  )
}

type ScrollBarProps = React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.Scrollbar
>

function ScrollBar({ className, orientation = "vertical", ...props }: ScrollBarProps) {
  const isHorizontal = orientation === "horizontal"

  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        // Subtle/transparent track, shadcn-ish
        "flex touch-none select-none transition-colors",
        isHorizontal
          ? "h-2.5 w-full flex-col border-t border-transparent p-[2px]"
          : "h-full w-2.5 border-l border-transparent p-[2px]",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          // Thumb: subtle, darker on hover, always grabbable
          "relative flex-1 rounded-full bg-border hover:bg-muted-foreground/50",
          // Min size so it's always usable
          isHorizontal ? "min-w-[30px]" : "min-h-[30px]"
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
export type { ScrollAreaProps, ScrollBarProps }

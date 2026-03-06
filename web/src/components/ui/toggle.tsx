"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// =============================================================================
// Toggle
// =============================================================================

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: ToggleProps) {
  const id = React.useId()

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start justify-between gap-4",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {/* Left: label + description */}
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] font-medium text-[#18181B] select-none">
          {label}
        </span>
        {description && (
          <span className="text-[12px] text-[#71717A] mt-0.5 select-none">
            {description}
          </span>
        )}
      </div>

      {/* Right: toggle switch */}
      <div className="relative shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />

        {/* Track */}
        <div
          className={cn(
            "w-[44px] h-[24px] rounded-full transition-colors duration-200 ease-in-out",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[#C4363A] peer-focus-visible:ring-offset-2",
            checked ? "bg-[#C4363A]" : "bg-[#E4E4E7]"
          )}
        />

        {/* Thumb */}
        <div
          className={cn(
            "absolute top-[2px] left-[2px]",
            "w-[20px] h-[20px] rounded-full bg-white",
            "shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
            "transition-transform duration-200 ease-in-out",
            "pointer-events-none",
            checked && "translate-x-[20px]"
          )}
        />
      </div>
    </label>
  )
}

export { Toggle }
export type { ToggleProps }

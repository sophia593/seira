"use client"

import * as React from "react"
import { ChevronDown, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Base select classes (shared styling with Input)
// =============================================================================

const SELECT_BASE = [
  "flex h-9 rounded-[4px] border bg-white px-3 pr-9 text-[13px] text-[#18181B]",
  "appearance-none outline-none cursor-pointer",
  "transition-[border-color,box-shadow] duration-150 ease-in-out",
].join(" ")

const SELECT_NORMAL =
  "border-[#E4E4E7] hover:border-[#C4C4CC] focus:border-[#C4363A] focus:ring-[3px] focus:ring-[#C4363A]/12"

const SELECT_ERROR =
  "border-[#E5484D] focus:border-[#E5484D] focus:ring-[3px] focus:ring-[#E5484D]/12"

const SELECT_DISABLED =
  "disabled:bg-[#F4F4F5] disabled:text-[#A1A1AA] disabled:border-[#E4E4E7] disabled:cursor-not-allowed disabled:hover:border-[#E4E4E7]"

// =============================================================================
// Select
// =============================================================================

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string
  options: { value: string; label: string }[]
  placeholder?: string
  helperText?: string
  error?: string
  fullWidth?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options,
      placeholder,
      helperText,
      error,
      fullWidth = true,
      id: idProp,
      value,
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId()
    const id = idProp ?? generatedId

    // Detect if placeholder is showing (no value selected)
    const isPlaceholderVisible = value === "" || value === undefined

    return (
      <div className={cn(fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={id}
            className="block text-[12px] font-medium text-[#18181B] mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={id}
            data-slot="select"
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            value={value}
            className={cn(
              SELECT_BASE,
              error ? SELECT_ERROR : SELECT_NORMAL,
              SELECT_DISABLED,
              fullWidth && "w-full",
              isPlaceholderVisible && "text-[#A1A1AA]",
              className
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="size-4 text-[#71717A]" />
          </span>
        </div>

        {error ? (
          <p
            id={`${id}-error`}
            className="flex items-center gap-1 mt-1 text-[12px] text-[#E5484D] animate-in fade-in duration-150"
          >
            <AlertTriangle className="size-3.5 shrink-0" />
            {error}
          </p>
        ) : helperText ? (
          <p id={`${id}-helper`} className="mt-1 text-[12px] text-[#71717A]">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
export type { SelectProps }

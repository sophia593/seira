"use client"

import * as React from "react"
import { Calendar, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Base classes (matches Input styling)
// =============================================================================

const DATE_BASE = [
  "flex h-9 rounded-[4px] border bg-white px-3 pr-9 text-[13px] text-[#18181B]",
  "font-mono outline-none cursor-pointer",
  "transition-[border-color,box-shadow] duration-150 ease-in-out",
].join(" ")

const DATE_NORMAL =
  "border-[#E4E4E7] hover:border-[#C4C4CC] focus:border-[#C4363A] focus:ring-[3px] focus:ring-[#C4363A]/12"

const DATE_ERROR =
  "border-[#E5484D] focus:border-[#E5484D] focus:ring-[3px] focus:ring-[#E5484D]/12"

const DATE_DISABLED =
  "disabled:bg-[#F4F4F5] disabled:text-[#A1A1AA] disabled:border-[#E4E4E7] disabled:cursor-not-allowed disabled:hover:border-[#E4E4E7]"

// =============================================================================
// DateInput
// =============================================================================

interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string
  helperText?: string
  error?: string
  fullWidth?: boolean
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      fullWidth = true,
      id: idProp,
      value,
      defaultValue,
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId()
    const id = idProp ?? generatedId

    // Compute human-readable date
    const humanDate = React.useMemo(() => {
      const dateStr = ((value ?? defaultValue) as string) || ""
      if (!dateStr) return null
      const parsed = new Date(dateStr + "T00:00:00")
      if (isNaN(parsed.getTime())) return null
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(parsed)
    }, [value, defaultValue])

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
          <input
            ref={ref}
            id={id}
            type="date"
            data-slot="date-input"
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            value={value}
            defaultValue={defaultValue}
            className={cn(
              DATE_BASE,
              error ? DATE_ERROR : DATE_NORMAL,
              DATE_DISABLED,
              fullWidth && "w-full",
              "[&::-webkit-calendar-picker-indicator]:opacity-0",
              "[&::-webkit-calendar-picker-indicator]:absolute",
              "[&::-webkit-calendar-picker-indicator]:inset-0",
              "[&::-webkit-calendar-picker-indicator]:w-full",
              "[&::-webkit-calendar-picker-indicator]:h-full",
              "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
              className
            )}
            {...rest}
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Calendar className="size-4 text-[#71717A]" />
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
        ) : (
          <>
            {humanDate && (
              <p className="mt-1 text-[12px] text-[#71717A]">{humanDate}</p>
            )}
            {helperText && (
              <p id={`${id}-helper`} className="mt-1 text-[12px] text-[#71717A]">
                {helperText}
              </p>
            )}
          </>
        )}
      </div>
    )
  }
)
DateInput.displayName = "DateInput"

export { DateInput }
export type { DateInputProps }

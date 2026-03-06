"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Base input classes
// =============================================================================

const INPUT_BASE = [
  "flex h-9 rounded-[4px] border bg-white px-3 text-[13px] text-[#18181B]",
  "placeholder:text-[#A1A1AA] outline-none",
  "transition-[border-color,box-shadow] duration-150 ease-in-out",
].join(" ")

const INPUT_NORMAL =
  "border-[#E4E4E7] hover:border-[#C4C4CC] focus:border-[#C4363A] focus:ring-[3px] focus:ring-[#C4363A]/12"

const INPUT_ERROR =
  "border-[#E5484D] focus:border-[#E5484D] focus:ring-[3px] focus:ring-[#E5484D]/12"

const INPUT_DISABLED =
  "disabled:bg-[#F4F4F5] disabled:text-[#A1A1AA] disabled:border-[#E4E4E7] disabled:cursor-not-allowed disabled:hover:border-[#E4E4E7]"

// =============================================================================
// Input
// =============================================================================

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ElementType
  rightElement?: React.ReactNode
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon: LeftIcon,
      rightElement,
      fullWidth = true,
      id: idProp,
      type = "text",
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId()
    const id = idProp ?? generatedId

    const inputClasses = cn(
      INPUT_BASE,
      error ? INPUT_ERROR : INPUT_NORMAL,
      INPUT_DISABLED,
      fullWidth && "w-full",
      LeftIcon && "pl-9",
      rightElement && "pr-9",
      className
    )

    // Backward compat: no wrapper features → plain <input>
    if (!label && !error && !helperText && !LeftIcon && !rightElement) {
      return (
        <input
          ref={ref}
          id={id}
          type={type}
          data-slot="input"
          className={inputClasses}
          {...rest}
        />
      )
    }

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
          {LeftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <LeftIcon className="size-4 text-[#A1A1AA]" />
            </span>
          )}

          <input
            ref={ref}
            id={id}
            type={type}
            data-slot="input"
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            className={inputClasses}
            {...rest}
          />

          {rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </span>
          )}
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
Input.displayName = "Input"

export { Input }
export type { InputProps }

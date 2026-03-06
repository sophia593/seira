"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Base textarea classes (shared with Input)
// =============================================================================

const TEXTAREA_BASE = [
  "flex rounded-[4px] border bg-white px-3 py-2 text-[13px] text-[#18181B]",
  "placeholder:text-[#A1A1AA] outline-none resize-none",
  "transition-[border-color,box-shadow] duration-150 ease-in-out",
  "min-h-[80px] max-h-[200px] overflow-y-auto",
].join(" ")

const TEXTAREA_NORMAL =
  "border-[#E4E4E7] hover:border-[#C4C4CC] focus:border-[#C4363A] focus:ring-[3px] focus:ring-[#C4363A]/12"

const TEXTAREA_ERROR =
  "border-[#E5484D] focus:border-[#E5484D] focus:ring-[3px] focus:ring-[#E5484D]/12"

const TEXTAREA_DISABLED =
  "disabled:bg-[#F4F4F5] disabled:text-[#A1A1AA] disabled:border-[#E4E4E7] disabled:cursor-not-allowed disabled:hover:border-[#E4E4E7]"

// =============================================================================
// Textarea
// =============================================================================

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  fullWidth?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      fullWidth = true,
      maxLength,
      id: idProp,
      value,
      defaultValue,
      onChange,
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId()
    const id = idProp ?? generatedId

    const internalRef = React.useRef<HTMLTextAreaElement | null>(null)

    // Merge refs
    const setRefs = React.useCallback(
      (el: HTMLTextAreaElement | null) => {
        internalRef.current = el
        if (typeof ref === "function") {
          ref(el)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
        }
      },
      [ref]
    )

    // Track current length for character count
    const [currentLength, setCurrentLength] = React.useState(() => {
      const initial = (value ?? defaultValue ?? "") as string
      return initial.length
    })

    // Auto-grow
    const adjustHeight = React.useCallback(() => {
      const el = internalRef.current
      if (!el) return
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }, [])

    React.useEffect(() => {
      adjustHeight()
    }, [value, adjustHeight])

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      setCurrentLength(e.target.value.length)
      adjustHeight()
      onChange?.(e)
    }

    // Character count color
    let countColor = "#A1A1AA"
    if (maxLength) {
      const ratio = currentLength / maxLength
      if (ratio >= 1) {
        countColor = "#E5484D"
      } else if (ratio >= 0.9) {
        countColor = "#F59E0B"
      }
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
          <textarea
            ref={setRefs}
            id={id}
            data-slot="textarea"
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            className={cn(
              TEXTAREA_BASE,
              error ? TEXTAREA_ERROR : TEXTAREA_NORMAL,
              TEXTAREA_DISABLED,
              fullWidth && "w-full",
              maxLength && "pb-6",
              className
            )}
            {...rest}
          />

          {maxLength && (
            <span
              className="absolute bottom-2 right-2 text-[11px] pointer-events-none select-none"
              style={{ color: countColor }}
            >
              {currentLength} / {maxLength}
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
Textarea.displayName = "Textarea"

export { Textarea }
export type { TextareaProps }

"use client"

import * as React from "react"
import { Clock, Search, Check, Pencil, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Trigger classes (matches Input styling)
// =============================================================================

const TRIGGER_BASE = [
  "flex items-center h-9 rounded-[4px] border bg-white px-3 text-[13px] text-[#18181B]",
  "outline-none select-none",
  "transition-[border-color,box-shadow] duration-150 ease-in-out",
].join(" ")

const TRIGGER_NORMAL =
  "border-[#E4E4E7] hover:border-[#C4C4CC] focus:border-[#C4363A] focus:ring-[3px] focus:ring-[#C4363A]/12"

const TRIGGER_ERROR =
  "border-[#E5484D] focus:border-[#E5484D] focus:ring-[3px] focus:ring-[#E5484D]/12"

const INPUT_BASE = [
  "flex h-9 rounded-[4px] border bg-white px-3 text-[13px] text-[#18181B]",
  "placeholder:text-[#A1A1AA] outline-none",
  "transition-[border-color,box-shadow] duration-150 ease-in-out",
].join(" ")

const INPUT_NORMAL =
  "border-[#E4E4E7] hover:border-[#C4C4CC] focus:border-[#C4363A] focus:ring-[3px] focus:ring-[#C4363A]/12"

const INPUT_ERROR_STYLE =
  "border-[#E5484D] focus:border-[#E5484D] focus:ring-[3px] focus:ring-[#E5484D]/12"

// =============================================================================
// Utilities
// =============================================================================

function formatTimeDisplay(time24: string): string {
  const [hStr, mStr] = time24.split(":")
  let h = parseInt(hStr, 10)
  const m = mStr ?? "00"
  if (isNaN(h)) return time24
  const period = h >= 12 ? "PM" : "AM"
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${m} ${period}`
}

function parseTimeInput(raw: string): string | null {
  const s = raw.toLowerCase().replace(/\s+/g, "")
  if (!s) return null

  // "5:30am", "5:30pm", "5:30"
  let match = s.match(/^(\d{1,2}):(\d{2})(am|pm)?$/)
  if (match) {
    let h = parseInt(match[1], 10)
    const m = parseInt(match[2], 10)
    const period = match[3]
    if (m < 0 || m > 59) return null
    if (period) {
      if (h < 1 || h > 12) return null
      if (period === "am" && h === 12) h = 0
      else if (period === "pm" && h !== 12) h += 12
    } else {
      if (h < 0 || h > 23) return null
    }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  // "530am" (without colon, 3+ digits)
  match = s.match(/^(\d{1,2})(\d{2})(am|pm)?$/)
  if (match && match[1].length + match[2].length >= 3) {
    let h = parseInt(match[1], 10)
    const m = parseInt(match[2], 10)
    const period = match[3]
    if (m < 0 || m > 59) return null
    if (period) {
      if (h < 1 || h > 12) return null
      if (period === "am" && h === 12) h = 0
      else if (period === "pm" && h !== 12) h += 12
    } else {
      if (h < 0 || h > 23) return null
    }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  // "5am", "5pm" (hour only)
  match = s.match(/^(\d{1,2})(am|pm)$/)
  if (match) {
    let h = parseInt(match[1], 10)
    const period = match[2]
    if (h < 1 || h > 12) return null
    if (period === "am" && h === 12) h = 0
    else if (period === "pm" && h !== 12) h += 12
    return `${String(h).padStart(2, "0")}:00`
  }

  return null
}

// =============================================================================
// Time slots
// =============================================================================

interface TimeSlot {
  value: string
  display: string
  group: "common" | "all"
}

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = []

  // Common call times: 5:00 AM to 8:00 AM
  for (let h = 5; h <= 8; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 8 && m > 0) break
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      slots.push({ value, display: formatTimeDisplay(value), group: "common" })
    }
  }

  // All times: 8:15 AM to 10:00 PM
  for (let h = 8; h <= 22; h++) {
    for (let m = h === 8 ? 15 : 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      slots.push({ value, display: formatTimeDisplay(value), group: "all" })
    }
  }

  return slots
}

const TIME_SLOTS = generateTimeSlots()

// =============================================================================
// TimePicker
// =============================================================================

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

function TimePicker({
  value,
  onChange,
  label,
  placeholder = "Select time",
  error,
  disabled = false,
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [customMode, setCustomMode] = React.useState(false)
  const [customInput, setCustomInput] = React.useState("")
  const [customError, setCustomError] = React.useState("")

  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const customInputRef = React.useRef<HTMLInputElement>(null)
  const generatedId = React.useId()

  // ---------------------------------------------------------------------------
  // Filtered slots
  // ---------------------------------------------------------------------------

  const filteredSlots = React.useMemo(() => {
    if (!search) return TIME_SLOTS
    const q = search.toLowerCase()
    return TIME_SLOTS.filter(
      (s) => s.display.toLowerCase().includes(q) || s.value.includes(q)
    )
  }, [search])

  const commonSlots = React.useMemo(
    () => filteredSlots.filter((s) => s.group === "common"),
    [filteredSlots]
  )

  const allSlots = React.useMemo(
    () => filteredSlots.filter((s) => s.group === "all"),
    [filteredSlots]
  )

  // ---------------------------------------------------------------------------
  // Click outside
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setCustomMode(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen])

  // ---------------------------------------------------------------------------
  // Focus management
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (isOpen && !customMode) {
      setSearch("")
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [isOpen, customMode])

  React.useEffect(() => {
    if (customMode) {
      requestAnimationFrame(() => customInputRef.current?.focus())
    }
  }, [customMode])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectTime = React.useCallback(
    (timeValue: string) => {
      onChange(timeValue)
      setIsOpen(false)
      setCustomMode(false)
    },
    [onChange]
  )

  const handleCustomDone = React.useCallback(() => {
    const parsed = parseTimeInput(customInput)
    if (!parsed) {
      setCustomError("Invalid time format")
      return
    }
    onChange(parsed)
    setIsOpen(false)
    setCustomMode(false)
    setCustomError("")
  }, [customInput, onChange])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setIsOpen(false)
        setCustomMode(false)
      }
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={generatedId}
          className="block text-[12px] font-medium text-[#18181B] mb-1"
        >
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
        {/* Trigger */}
        <button
          id={generatedId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          className={cn(
            TRIGGER_BASE,
            error ? TRIGGER_ERROR : TRIGGER_NORMAL,
            "w-full cursor-pointer gap-2",
            disabled &&
              "bg-[#F4F4F5] text-[#A1A1AA] border-[#E4E4E7] cursor-not-allowed hover:border-[#E4E4E7]"
          )}
        >
          <span className="flex-1 min-w-0 text-left">
            {value ? (
              <span className="font-mono">{formatTimeDisplay(value)}</span>
            ) : (
              <span className="text-[#A1A1AA]">{placeholder}</span>
            )}
          </span>
          <Clock className="size-4 text-[#71717A] shrink-0" />
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+4px)] z-40",
              "bg-white rounded-[4px] border border-[#E4E4E7]",
              "shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
              "animate-in fade-in slide-in-from-top-1 duration-150",
              "flex flex-col"
            )}
          >
            {customMode ? (
              /* Custom time entry */
              <div className="p-3 space-y-3">
                <p className="text-[12px] font-medium text-[#18181B]">
                  Enter a custom time
                </p>
                <input
                  ref={customInputRef}
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value)
                    setCustomError("")
                  }}
                  placeholder="e.g. 5:30 AM"
                  className={cn(
                    INPUT_BASE,
                    customError ? INPUT_ERROR_STYLE : INPUT_NORMAL,
                    "w-full font-mono"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleCustomDone()
                    }
                  }}
                />
                {customError && (
                  <p className="flex items-center gap-1 text-[12px] text-[#E5484D]">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    {customError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMode(false)
                      setCustomError("")
                    }}
                    className="h-8 px-3 text-[13px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-[4px] transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomDone}
                    className="h-8 px-3 text-[13px] font-medium text-white bg-[#C4363A] hover:bg-[#D44448] rounded-[4px] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="p-2 border-b border-[#E4E4E7] shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#A1A1AA] pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter times..."
                      className={cn(
                        "w-full h-8 pl-8 pr-3 rounded-[4px] text-[13px] text-[#18181B]",
                        "placeholder:text-[#A1A1AA] outline-none border border-[#E4E4E7]",
                        "focus:border-[#C4363A] focus:ring-[3px] focus:ring-[#C4363A]/12",
                        "transition-[border-color,box-shadow] duration-150"
                      )}
                    />
                  </div>
                </div>

                {/* Time slots */}
                <div className="max-h-[320px] overflow-y-auto seira-scroll">
                  {commonSlots.length === 0 && allSlots.length === 0 ? (
                    <p className="px-3 py-6 text-center text-[13px] text-[#A1A1AA]">
                      No matching times
                    </p>
                  ) : (
                    <>
                      {commonSlots.length > 0 && (
                        <>
                          <div className="px-3 pt-3 pb-1.5 text-[12px] font-medium uppercase text-[#71717A] tracking-[0.05em] select-none">
                            Common call times
                          </div>
                          {commonSlots.map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => handleSelectTime(slot.value)}
                              className={cn(
                                "flex items-center justify-between w-full px-3 h-9 text-[13px] font-mono",
                                "transition-colors duration-100 cursor-pointer",
                                value === slot.value
                                  ? "bg-[#C4363A]/[0.12]"
                                  : "hover:bg-[#F4F4F5]"
                              )}
                            >
                              {slot.display}
                              {value === slot.value && (
                                <Check className="size-4 text-[#C4363A]" />
                              )}
                            </button>
                          ))}
                        </>
                      )}

                      {allSlots.length > 0 && (
                        <>
                          <div
                            className={cn(
                              "px-3 pt-3 pb-1.5 text-[12px] font-medium uppercase text-[#71717A] tracking-[0.05em] select-none",
                              commonSlots.length > 0 &&
                                "border-t border-[#E4E4E7] mt-1"
                            )}
                          >
                            All times
                          </div>
                          {allSlots.map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => handleSelectTime(slot.value)}
                              className={cn(
                                "flex items-center justify-between w-full px-3 h-9 text-[13px] font-mono",
                                "transition-colors duration-100 cursor-pointer",
                                value === slot.value
                                  ? "bg-[#C4363A]/[0.12]"
                                  : "hover:bg-[#F4F4F5]"
                              )}
                            >
                              {slot.display}
                              {value === slot.value && (
                                <Check className="size-4 text-[#C4363A]" />
                              )}
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  )}

                  {/* Custom time */}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMode(true)
                      setCustomInput(value ? formatTimeDisplay(value) : "")
                      setCustomError("")
                    }}
                    className="flex items-center gap-2 w-full px-3 h-9 text-[13px] text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors border-t border-[#E4E4E7] cursor-pointer"
                  >
                    <Pencil className="size-3.5" />
                    Custom time
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 mt-1 text-[12px] text-[#E5484D] animate-in fade-in duration-150">
          <AlertTriangle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export { TimePicker, formatTimeDisplay, parseTimeInput }
export type { TimePickerProps }

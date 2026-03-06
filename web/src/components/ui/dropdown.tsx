"use client"

import * as React from "react"
import { ChevronDown, Search, Check, X, AlertTriangle } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
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

// =============================================================================
// Types
// =============================================================================

interface DropdownOption {
  id: string
  label: string
  sublabel?: string
  group?: string
  avatar?: string
  avatarFallback?: string
  avatarColor?: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  mode: "single" | "multi"
  placeholder?: string
  searchPlaceholder?: string
  label?: string
  error?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

// =============================================================================
// Render list item types
// =============================================================================

type RenderItem =
  | { type: "header"; group: string }
  | { type: "option"; option: DropdownOption; flatIndex: number }

// =============================================================================
// Dropdown
// =============================================================================

function Dropdown({
  options,
  value,
  onChange,
  mode,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  label,
  error,
  emptyMessage = "No results found",
  disabled = false,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [highlightIndex, setHighlightIndex] = React.useState(-1)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const generatedId = React.useId()

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const selectedIds = React.useMemo(() => {
    if (mode === "single") return value ? [value as string] : []
    return (value as string[]) ?? []
  }, [value, mode])

  const selectedOptions = React.useMemo(
    () => options.filter((o) => selectedIds.includes(o.id)),
    [options, selectedIds]
  )

  // Build grouped + filtered render list
  const renderList = React.useMemo(() => {
    const q = search.toLowerCase()
    const filtered = q
      ? options.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            (o.sublabel && o.sublabel.toLowerCase().includes(q))
        )
      : options

    // Group options
    const groups = new Map<string, DropdownOption[]>()
    const ungrouped: DropdownOption[] = []
    for (const opt of filtered) {
      if (opt.group) {
        const list = groups.get(opt.group) ?? []
        list.push(opt)
        groups.set(opt.group, list)
      } else {
        ungrouped.push(opt)
      }
    }

    const items: RenderItem[] = []
    let flatIndex = 0
    for (const [group, opts] of groups) {
      items.push({ type: "header", group })
      for (const opt of opts) {
        items.push({ type: "option", option: opt, flatIndex })
        flatIndex++
      }
    }
    if (ungrouped.length > 0) {
      if (groups.size > 0) {
        items.push({ type: "header", group: "Other" })
      }
      for (const opt of ungrouped) {
        items.push({ type: "option", option: opt, flatIndex })
        flatIndex++
      }
    }

    return items
  }, [options, search])

  // Indices of selectable items (options, not headers)
  const selectableIndices = React.useMemo(
    () =>
      renderList
        .map((item, i) => (item.type === "option" ? i : -1))
        .filter((i) => i >= 0),
    [renderList]
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
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen])

  // ---------------------------------------------------------------------------
  // Focus search on open
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (isOpen) {
      setSearch("")
      setHighlightIndex(-1)
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [isOpen])

  // ---------------------------------------------------------------------------
  // Scroll highlighted into view
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    const el = listRef.current.children[highlightIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [highlightIndex])

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  const handleSelect = React.useCallback(
    (optionId: string) => {
      if (mode === "single") {
        const next = selectedIds.includes(optionId) ? "" : optionId
        onChange(next)
        setIsOpen(false)
      } else {
        const next = selectedIds.includes(optionId)
          ? selectedIds.filter((id) => id !== optionId)
          : [...selectedIds, optionId]
        onChange(next)
      }
    },
    [mode, selectedIds, onChange]
  )

  const removeOption = React.useCallback(
    (optionId: string) => {
      if (mode === "multi") {
        onChange(selectedIds.filter((id) => id !== optionId))
      }
    },
    [mode, selectedIds, onChange]
  )

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      if (e.key === "Escape") {
        e.preventDefault()
        setIsOpen(false)
        return
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightIndex((prev) => {
          const curPos = selectableIndices.indexOf(prev)
          const nextPos =
            curPos < selectableIndices.length - 1 ? curPos + 1 : 0
          return selectableIndices[nextPos] ?? -1
        })
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightIndex((prev) => {
          const curPos = selectableIndices.indexOf(prev)
          const nextPos =
            curPos > 0 ? curPos - 1 : selectableIndices.length - 1
          return selectableIndices[nextPos] ?? -1
        })
        return
      }

      if (e.key === "Enter") {
        e.preventDefault()
        const item = renderList[highlightIndex]
        if (item?.type === "option") {
          handleSelect(item.option.id)
        }
      }
    },
    [isOpen, selectableIndices, renderList, highlightIndex, handleSelect]
  )

  // ---------------------------------------------------------------------------
  // Render trigger content
  // ---------------------------------------------------------------------------

  function renderTriggerContent() {
    if (selectedOptions.length === 0) {
      return <span className="text-[#A1A1AA] truncate">{placeholder}</span>
    }

    if (mode === "single") {
      return <span className="truncate">{selectedOptions[0].label}</span>
    }

    // Multi-select: pills
    return (
      <span className="flex items-center gap-1 overflow-hidden min-w-0">
        {selectedOptions.slice(0, 2).map((opt) => (
          <span
            key={opt.id}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-[4px] bg-[#C4363A]/[0.12] text-[#C4363A] text-[13px] font-medium shrink-0 max-w-[120px]"
          >
            <span className="truncate">{opt.label}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeOption(opt.id)
              }}
              className="shrink-0 hover:text-[#D44448] transition-colors"
              aria-label={`Remove ${opt.label}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {selectedOptions.length > 2 && (
          <span className="text-[13px] text-[#71717A] shrink-0">
            +{selectedOptions.length - 2} more
          </span>
        )}
      </span>
    )
  }

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
          aria-haspopup="listbox"
          className={cn(
            TRIGGER_BASE,
            error ? TRIGGER_ERROR : TRIGGER_NORMAL,
            "w-full cursor-pointer gap-2",
            disabled &&
              "bg-[#F4F4F5] text-[#A1A1AA] border-[#E4E4E7] cursor-not-allowed hover:border-[#E4E4E7]"
          )}
        >
          <span className="flex-1 min-w-0 flex items-center">
            {renderTriggerContent()}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-[#71717A] shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
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
            style={{ minWidth: 280 }}
          >
            {/* Search */}
            <div className="p-2 border-b border-[#E4E4E7] shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#A1A1AA] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setHighlightIndex(-1)
                  }}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "w-full h-8 pl-8 pr-3 rounded-[4px] text-[13px] text-[#18181B]",
                    "placeholder:text-[#A1A1AA] outline-none border border-[#E4E4E7]",
                    "focus:border-[#C4363A] focus:ring-[3px] focus:ring-[#C4363A]/12",
                    "transition-[border-color,box-shadow] duration-150"
                  )}
                />
              </div>
            </div>

            {/* Option list */}
            <div
              ref={listRef}
              className="max-h-[320px] overflow-y-auto seira-scroll py-1"
              role="listbox"
            >
              {renderList.length === 0 ? (
                <p className="px-3 py-6 text-center text-[13px] text-[#A1A1AA]">
                  {emptyMessage}
                </p>
              ) : (
                renderList.map((item, i) => {
                  if (item.type === "header") {
                    return (
                      <div
                        key={`group-${item.group}`}
                        className={cn(
                          "px-3 pt-3 pb-1.5 text-[12px] font-medium uppercase text-[#71717A] tracking-[0.05em] select-none",
                          i > 0 && "border-t border-[#E4E4E7] mt-1"
                        )}
                      >
                        {item.group}
                      </div>
                    )
                  }

                  const opt = item.option
                  const isSelected = selectedIds.includes(opt.id)
                  const isHighlighted = i === highlightIndex

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 text-left h-10 text-[13px]",
                        "transition-colors duration-100 cursor-pointer",
                        isSelected && "bg-[#C4363A]/[0.12]",
                        isHighlighted && !isSelected && "bg-[#F4F4F5]",
                        !isSelected && !isHighlighted && "hover:bg-[#F4F4F5]"
                      )}
                      onClick={() => handleSelect(opt.id)}
                      onMouseEnter={() => setHighlightIndex(i)}
                    >
                      {opt.avatarFallback && (
                        <Avatar
                          name={opt.avatarFallback}
                          src={opt.avatar}
                          size="sm"
                          color={opt.avatarColor}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="truncate">
                          {opt.label}
                          {opt.sublabel && (
                            <span className="text-[#71717A]">
                              {" "}
                              — {opt.sublabel}
                            </span>
                          )}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="size-4 text-[#C4363A] shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
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

export { Dropdown }
export type { DropdownProps, DropdownOption }

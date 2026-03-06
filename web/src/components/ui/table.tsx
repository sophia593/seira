"use client"

import * as React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

interface Column<T> {
  key: string
  header: string
  width?: string
  sortable?: boolean
  render: (row: T, index: number) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: string
  onRowClick?: (row: T) => void
  sortBy?: string
  sortDirection?: "asc" | "desc"
  onSort?: (key: string) => void
  stickyHeader?: boolean
  alternateRows?: boolean
  showRowActions?: boolean
  emptyMessage?: string
  footer?: React.ReactNode
  className?: string
}

// =============================================================================
// Table
// =============================================================================

function Table<T>({
  columns,
  data,
  keyField,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  stickyHeader = true,
  alternateRows = true,
  showRowActions = false,
  emptyMessage = "No data",
  footer,
  className,
}: TableProps<T>) {
  // Build grid-template-columns from column widths
  const gridCols = columns.map((c) => c.width ?? "1fr")
  // Add a narrow column for the row actions button
  if (showRowActions) gridCols.push("48px")
  const gridTemplate = gridCols.join(" ")

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "overflow-x-auto bg-white rounded-[4px] border border-[#E4E4E7]",
          className
        )}
      >
        <p className="text-[13px] text-[#71717A] text-center py-12">
          {emptyMessage}
        </p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className={cn(
        "overflow-x-auto bg-white rounded-[4px] border border-[#E4E4E7]",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "grid bg-[#F4F4F5] border-b border-[#E4E4E7]",
          stickyHeader && "sticky top-0 z-[1]"
        )}
        style={{ gridTemplateColumns: gridTemplate }}
        role="row"
      >
        {columns.map((col) => {
          const isSorted = sortBy === col.key
          const isClickable = col.sortable && onSort

          return (
            <div
              key={col.key}
              role="columnheader"
              onClick={isClickable ? () => onSort(col.key) : undefined}
              className={cn(
                "flex items-center gap-1 px-3 py-2.5",
                "text-[12px] font-medium uppercase tracking-[0.05em] text-[#71717A]",
                "select-none",
                isClickable && "cursor-pointer hover:text-[#18181B]"
              )}
            >
              {col.header}
              {col.sortable && (
                <span className="shrink-0 transition-opacity duration-150">
                  {isSorted ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="size-3 text-[#A1A1AA]" />
                  )}
                </span>
              )}
            </div>
          )
        })}
        {/* Spacer cell for row actions column */}
        {showRowActions && <div />}
      </div>

      {/* Body */}
      {data.map((row, rowIndex) => {
        const key = String((row as Record<string, unknown>)[keyField] ?? rowIndex)
        const isLast = rowIndex === data.length - 1

        return (
          <div
            key={key}
            role="row"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "group grid items-center h-12 transition-colors duration-150",
              !isLast && "border-b border-[#E4E4E7]",
              alternateRows && rowIndex % 2 === 1 && "bg-[#FAFAFA]",
              "hover:bg-[#F4F4F5]",
              onRowClick ? "cursor-pointer" : "cursor-default"
            )}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className="px-3 text-[13px] text-[#18181B] min-w-0 truncate"
              >
                {col.render(row, rowIndex)}
              </div>
            ))}
            {/* Row action button */}
            {showRowActions && (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "flex items-center justify-center size-7 rounded-[4px]",
                    "text-[#71717A] hover:bg-[#E4E4E7] hover:text-[#18181B]",
                    "transition-all duration-150",
                    "opacity-0 group-hover:opacity-100"
                  )}
                  aria-label="Row actions"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Footer */}
      {footer && (
        <div className="px-3 py-2.5 bg-[#F4F4F5] border-t border-[#E4E4E7] text-[13px] font-medium text-[#71717A]">
          {footer}
        </div>
      )}
    </div>
  )
}

export { Table }
export type { TableProps, Column }

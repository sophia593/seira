"use client"

import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

interface TabItem {
  key: string
  label: string
  count?: number
}

interface FilterTabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (key: string) => void
  className?: string
}

// =============================================================================
// FilterTabs
// =============================================================================

function FilterTabs({ tabs, activeTab, onChange, className }: FilterTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-6 border-b border-[#E4E4E7] mb-6",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative pb-3 text-[14px] font-medium cursor-pointer",
              "transition-colors duration-150 ease-in-out",
              "outline-none focus-visible:ring-2 focus-visible:ring-[#C4363A]/30 focus-visible:rounded-sm",
              isActive
                ? "text-[#C4363A]"
                : "text-[#71717A] hover:text-[#18181B]"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-1",
                  isActive ? "text-[#C4363A]/70" : "text-[#A1A1AA]"
                )}
              >
                ({tab.count})
              </span>
            )}

            {/* Active underline */}
            {isActive && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#C4363A]" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export { FilterTabs }
export type { FilterTabsProps, TabItem }

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Plane, Search, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserMenu } from "./user-menu"

// =============================================================================
// Types
// =============================================================================

interface SidebarProps {
  isMobile?: boolean
}

// =============================================================================
// Navigation
// =============================================================================

const NAV_ITEMS = [
  { href: "/search", label: "search", icon: Search },
  { href: "/trips", label: "my trips", icon: Plane },
  { href: "/settings", label: "settings", icon: Settings },
]

// =============================================================================
// Main Sidebar Component
// =============================================================================

export function Sidebar({ isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed: storedCollapsed, toggle } = useSidebar()
  const isCollapsed = isMobile ? false : storedCollapsed

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r bg-background/95 backdrop-blur-sm",
          "transition-[width] duration-300 ease-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-14 items-center border-b px-3 shrink-0",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 font-semibold lowercase",
              "transition-opacity duration-200 hover:opacity-80",
              isCollapsed && "opacity-0 w-0 overflow-hidden"
            )}
          >
            <Plane className="h-5 w-5 shrink-0" />
            <span className="truncate">seira</span>
          </Link>

          {isCollapsed && (
            <Plane className="h-5 w-5 shrink-0" />
          )}

          {!isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggle}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    isCollapsed && "absolute right-1"
                  )}
                >
                  <ChevronLeft
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isCollapsed && "rotate-180"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "expand" : "collapse"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              const Icon = item.icon

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium",
                        "transition-all duration-150",
                        "hover:bg-accent active:scale-[0.98]",
                        isActive && "bg-accent shadow-sm",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "transition-all duration-200",
                          isCollapsed && "opacity-0 w-0 overflow-hidden"
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </nav>

        {/* User Menu */}
        <div className="shrink-0 border-t px-2 py-2">
          <UserMenu isCollapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  )
}

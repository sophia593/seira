"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Compass, Search, Bookmark, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Tab Items
// =============================================================================

const tabs = [
  { href: "/", label: "home", icon: Compass },
  { href: "/events", label: "events", icon: Search },
  { href: "/saved", label: "saved", icon: Bookmark },
  { href: "/settings", label: "settings", icon: Settings },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

// =============================================================================
// Tab Bar (Mobile)
// =============================================================================

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "flex items-center justify-around",
        "h-16 border-t border-border/30 bg-background/95 backdrop-blur-md",
        "pb-[env(safe-area-inset-bottom)]"
      )}
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
              "w-16 h-full",
              "text-[10px] font-medium lowercase tracking-tight",
              "transition-all duration-200",
              active
                ? "text-foreground"
                : "text-muted-foreground/50"
            )}
          >
            <tab.icon
              className={cn(
                "h-5 w-5 stroke-[1.5]",
                active && "text-primary scale-105",
                !active && "scale-100"
              )}
            />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

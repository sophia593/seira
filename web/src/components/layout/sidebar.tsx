"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Compass, Search, Bookmark, Settings } from "lucide-react"
import { LogoFull, LogoIcon } from "@/components/logo"
import { UserMenu } from "./user-menu"
import { cn } from "@/lib/utils"

// =============================================================================
// Nav Items
// =============================================================================

const navItems = [
  { href: "/", label: "home", icon: Compass },
  { href: "/events", label: "browse events", icon: Search },
  { href: "/saved", label: "saved plans", icon: Bookmark },
  { href: "/settings", label: "settings", icon: Settings },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

// =============================================================================
// Sidebar
// =============================================================================

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-full",
        "w-[220px] xl:w-[240px]",
        "border-r border-border/40 bg-sidebar text-sidebar-foreground",
        "py-8 px-4"
      )}
    >
      {/* Logo */}
      <div className="px-2 mb-12">
        <LogoFull size="default" animated />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3",
                "text-[15px] font-medium lowercase tracking-tight",
                "transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/90 hover:bg-sidebar-accent/30"
              )}
            >
              <item.icon className="h-[19px] w-[19px] shrink-0 stroke-[1.5]" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User menu at bottom */}
      <div className="mt-auto pt-6 border-t border-border/30">
        <UserMenu />
      </div>
    </aside>
  )
}

// =============================================================================
// Collapsed Sidebar (for medium screens)
// =============================================================================

export function SidebarCollapsed() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "hidden md:flex lg:hidden flex-col items-center h-full",
        "w-16",
        "border-r border-border/40 bg-sidebar text-sidebar-foreground",
        "py-8 px-2"
      )}
    >
      {/* Logo icon */}
      <div className="mb-12">
        <LogoIcon size="default" animated />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center justify-center rounded-lg w-11 h-11",
                "transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/90 hover:bg-sidebar-accent/30"
              )}
            >
              <item.icon className="h-5 w-5 stroke-[1.5]" />
              <span className="sr-only">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User menu at bottom */}
      <div className="mt-auto pt-6 border-t border-border/30">
        <UserMenu isCollapsed />
      </div>
    </aside>
  )
}

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
        "border-r bg-sidebar text-sidebar-foreground",
        "py-6 px-3"
      )}
    >
      {/* Logo */}
      <div className="px-3 mb-8">
        <LogoFull size="default" animated />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5",
                "text-sm font-medium lowercase",
                "transition-colors duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User menu at bottom */}
      <div className="mt-auto pt-4 border-t border-sidebar-border">
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
        "border-r bg-sidebar text-sidebar-foreground",
        "py-6 px-2"
      )}
    >
      {/* Logo icon */}
      <div className="mb-8">
        <LogoIcon size="default" animated />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center justify-center rounded-xl w-10 h-10",
                "transition-colors duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User menu at bottom */}
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <UserMenu isCollapsed />
      </div>
    </aside>
  )
}

"use client"

import { LogoIcon } from "@/components/logo"
import { UserMenu } from "./user-menu"
import { cn } from "@/lib/utils"

// =============================================================================
// Mobile Header (top bar with logo + avatar)
// =============================================================================

export function MobileHeader() {
  return (
    <header
      className={cn(
        "md:hidden flex items-center justify-between",
        "h-14 border-b bg-background px-4",
        "pt-[env(safe-area-inset-top)]"
      )}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <LogoIcon size="sm" className="text-foreground" />
        <span className="font-semibold text-sm lowercase">seira</span>
      </div>

      {/* Right: User avatar */}
      <UserMenu isCollapsed />
    </header>
  )
}

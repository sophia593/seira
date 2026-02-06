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
        "h-14 border-b border-border/40 bg-background px-5",
        "pt-[env(safe-area-inset-top)]"
      )}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <LogoIcon size="sm" className="text-foreground" />
        <span className="font-semibold text-[15px] lowercase tracking-tight">
          seira
        </span>
      </div>

      {/* Right: User avatar */}
      <UserMenu isCollapsed />
    </header>
  )
}

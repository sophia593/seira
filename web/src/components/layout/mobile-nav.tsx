"use client"

import { Menu, MessageSquare, X } from "lucide-react"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import { UserMenu } from "./user-menu"

export function MobileNav() {
  const { isMobileOpen, setMobileOpen } = useSidebar()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => setMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <div className="flex items-center gap-2 font-semibold">
        <MessageSquare className="h-5 w-5" />
        <span>Seira</span>
      </div>

      <UserMenu isCollapsed />
    </header>
  )
}

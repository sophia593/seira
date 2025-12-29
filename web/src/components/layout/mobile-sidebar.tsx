"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"

export function MobileSidebar() {
  const pathname = usePathname()
  const { isMobileOpen, closeMobile } = useSidebar()

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile()
  }, [pathname, closeMobile])

  return (
    <>
      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-200",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>
    </>
  )
}

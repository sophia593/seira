"use client"

import { User } from "lucide-react"

export function Header() {
  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
      {/* Mobile wordmark */}
      <span className="md:hidden text-lg font-bold tracking-tight text-foreground">
        seira
      </span>

      {/* Spacer on desktop */}
      <div className="hidden md:block" />

      {/* User avatar placeholder */}
      <button
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
          <User size={14} />
        </div>
        <span className="hidden md:inline text-sm">account</span>
      </button>
    </header>
  )
}

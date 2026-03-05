'use client'

import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/layout/user-menu'
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher'
import { LogoIcon } from '@/components/logo'

// =============================================================================
// Sidebar
// =============================================================================

function Sidebar() {
  return (
    <aside className="hidden md:flex print:!hidden flex-col w-60 border-r border-white/10 bg-kurobeni text-white h-full overflow-hidden">
      {/* Workspace header */}
      <WorkspaceSwitcher />

      {/* Navigation placeholder */}
      <nav className="flex-1 overflow-y-auto px-3" />

      {/* User section */}
      <div className="border-t border-white/10 px-3 py-3">
        <UserMenu variant="sidebar" />
      </div>
    </aside>
  )
}

// =============================================================================
// Top Bar (for desktop)
// =============================================================================

function TopBar() {
  return (
    <header className="hidden md:flex print:!hidden h-14 items-center justify-end px-6 border-b bg-background">
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  )
}

// =============================================================================
// Mobile Header
// =============================================================================

function MobileHeader() {
  return (
    <header className="md:hidden print:!hidden flex h-14 items-center justify-between px-4 border-b border-white/10 bg-kurobeni text-white">
      <div className="flex items-center gap-2">
        <LogoIcon size="sm" className="text-copper" />
        <span className="text-white/30">/</span>
        <span className="font-medium text-sm">seira</span>
      </div>
      <div className="flex items-center gap-1">
        <UserMenu isCollapsed variant="sidebar" />
      </div>
    </header>
  )
}

// =============================================================================
// App Shell
// =============================================================================

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar */}
        <TopBar />

        {/* Mobile Header */}
        <MobileHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 print:pb-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  )
}

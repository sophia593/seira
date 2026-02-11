'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/layout/user-menu'
import { LogoIcon } from '@/components/logo'
import { useOrgStore } from '@/stores/org-store'

// =============================================================================
// Navigation Items
// =============================================================================

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
]

// =============================================================================
// Sidebar
// =============================================================================

function Sidebar() {
  const pathname = usePathname()
  const orgName = useOrgStore((state) => state.orgName)

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-white/10 bg-kurobeni text-white h-full">
      {/* Org name */}
      <div className="h-14 flex items-center px-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoIcon size="sm" className="text-copper" />
          <span className="font-semibold text-lg truncate">{orgName || 'Workspace'}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User menu at bottom */}
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
    <header className="hidden lg:flex h-14 items-center justify-end px-6 border-b bg-background">
      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  )
}

// =============================================================================
// Mobile Header
// =============================================================================

function MobileHeader() {
  const pathname = usePathname()

  // Get current page label
  const currentItem = NAV_ITEMS.find(item =>
    pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const pageLabel = currentItem?.label || 'seira'

  return (
    <header className="lg:hidden flex h-14 items-center justify-between px-4 border-b border-white/10 bg-kurobeni text-white">
      <div className="flex items-center gap-2">
        <LogoIcon size="sm" className="text-copper" />
        <span className="text-white/30">/</span>
        <span className="font-medium text-sm">{pageLabel}</span>
      </div>
      <UserMenu isCollapsed variant="sidebar" />
    </header>
  )
}

// =============================================================================
// Mobile Bottom Nav
// =============================================================================

function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-white/10 bg-kurobeni/95 backdrop-blur-sm z-50">
      <ul className="flex h-full">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-1 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-white/40'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only">{item.label.split(' ')[0]}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
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
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  )
}

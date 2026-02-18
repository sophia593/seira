'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CalendarDays, Settings, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/layout/user-menu'
import { NotificationBell } from '@/components/layout/notification-bell'
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher'
import { LogoIcon } from '@/components/logo'
import { EVENT_DOT_COLOR } from '@/lib/constants'
import { useOrg } from '@/hooks/use-org'

// =============================================================================
// Navigation Items
// =============================================================================

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
]

// =============================================================================
// Types
// =============================================================================

interface RecentEvent {
  id: string
  name: string
  status: string
}

// =============================================================================
// Sidebar
// =============================================================================

function Sidebar({ recentEvents = [] }: { recentEvents?: RecentEvent[] }) {
  const pathname = usePathname()
  const { canEdit } = useOrg()

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-white/10 bg-kurobeni text-white h-full overflow-hidden">
      {/* Workspace header */}
      <WorkspaceSwitcher />

      {/* Quick action */}
      {canEdit && (
        <div className="px-3 pt-3">
          <Link
            href="/events"
            className="flex items-center gap-2 w-full h-8 rounded-md border border-white/10 px-3 text-white/50 text-xs hover:bg-white/5 hover:text-white/70 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New event</span>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        {/* Workspace section */}
        <p className="text-[10px] uppercase tracking-widest text-white/20 px-3 mt-4 mb-1">Workspace</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Recent events section */}
        {recentEvents.length > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-white/20 px-3 mt-6 mb-1">Recent</p>
            <ul className="space-y-0.5">
              {recentEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-1 rounded-md text-xs transition-colors',
                      pathname === `/events/${event.id}`
                        ? 'text-white/70 bg-white/5'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', EVENT_DOT_COLOR[event.status as keyof typeof EVENT_DOT_COLOR] || 'bg-gray-500')} />
                    <span className="truncate">{event.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

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
    <header className="hidden md:flex h-14 items-center justify-end px-6 border-b bg-background">
      <div className="flex items-center gap-2">
        <NotificationBell />
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
    <header className="md:hidden flex h-14 items-center justify-between px-4 border-b border-white/10 bg-kurobeni text-white">
      <div className="flex items-center gap-2">
        <LogoIcon size="sm" className="text-copper" />
        <span className="text-white/30">/</span>
        <span className="font-medium text-sm">{pageLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <UserMenu isCollapsed variant="sidebar" />
      </div>
    </header>
  )
}

// =============================================================================
// Mobile Bottom Nav
// =============================================================================

function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-white/10 bg-kurobeni/95 backdrop-blur-sm z-50">
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
  recentEvents?: RecentEvent[]
}

export function AppShell({ children, recentEvents }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar recentEvents={recentEvents} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar */}
        <TopBar />

        {/* Mobile Header */}
        <MobileHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  )
}

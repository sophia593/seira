'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/layout/user-menu'
import { LogoIcon } from '@/components/logo'

// =============================================================================
// Navigation Items
// =============================================================================

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
]

// =============================================================================
// Sidebar
// =============================================================================

function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r bg-background h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon size="sm" className="text-foreground" />
          <span className="font-semibold text-lg">seira</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
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
    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  )
  const pageLabel = currentItem?.label || 'seira'

  return (
    <header className="lg:hidden flex h-14 items-center justify-between px-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <LogoIcon size="sm" className="text-foreground" />
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-sm">{pageLabel}</span>
      </div>
      <UserMenu isCollapsed />
    </header>
  )
}

// =============================================================================
// Mobile Bottom Nav
// =============================================================================

function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t bg-background/95 backdrop-blur-sm z-50">
      <ul className="flex h-full">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-1 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
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

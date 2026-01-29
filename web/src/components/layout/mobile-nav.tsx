'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Search, Plus } from 'lucide-react'
import { useSidebar } from '@/hooks/use-sidebar'
import { Button } from '@/components/ui/button'
import { Logo, LogoIcon } from '@/components/logo'
import { UserMenu } from './user-menu'
import { cn } from '@/lib/utils'

// =============================================================================
// Page Title Map
// =============================================================================

const PAGE_TITLES: Record<string, string> = {
  '/search': 'search',
  '/trips': 'trips',
  '/settings': 'settings',
  '/settings/profile': 'profile',
  '/settings/preferences': 'preferences',
  '/settings/notifications': 'notifications',
}

function getPageTitle(pathname: string): string | null {
  // Exact match
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname]
  }

  // Check for dynamic routes
  if (pathname.startsWith('/trip/')) {
    // Check for review page
    if (pathname.endsWith('/review')) {
      return 'review'
    }
    return 'trip'
  }

  if (pathname.startsWith('/trips/')) {
    return 'trip details'
  }

  if (pathname.startsWith('/settings')) {
    return 'settings'
  }

  return null
}

// =============================================================================
// Main Component
// =============================================================================

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobileOpen, openMobile, closeMobile } = useSidebar()

  const pageTitle = getPageTitle(pathname)
  const isOnSearch = pathname === '/search'

  // Handle new trip (go to search)
  function handleNewTrip() {
    router.push('/search')
  }

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden',
        // Safe area for iPhone notch
        'pt-[env(safe-area-inset-top)]'
      )}
    >
      {/* Left: Menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0"
        onClick={() => (isMobileOpen ? closeMobile() : openMobile())}
        aria-label={isMobileOpen ? 'close menu' : 'open menu'}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Center: Logo + Page Title */}
      <div className="flex items-center gap-2 min-w-0">
        <LogoIcon size="sm" className="shrink-0 text-foreground" />
        {pageTitle ? (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-sm lowercase truncate">
              {pageTitle}
            </span>
          </>
        ) : (
          <span className="font-semibold lowercase">seira</span>
        )}
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-1 shrink-0">
        {/* New Trip / Search */}
        {!isOnSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={handleNewTrip}
            aria-label="new trip"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}

        {/* User Menu */}
        <UserMenu isCollapsed />
      </div>
    </header>
  )
}

// =============================================================================
// Minimal Variant (just logo, no context)
// =============================================================================

export function MobileNavMinimal() {
  const { isMobileOpen, openMobile, closeMobile } = useSidebar()

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden',
        'pt-[env(safe-area-inset-top)]'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11"
        onClick={() => (isMobileOpen ? closeMobile() : openMobile())}
        aria-label={isMobileOpen ? 'close menu' : 'open menu'}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <Logo linkToHome={false} animated={false} />

      <UserMenu isCollapsed />
    </header>
  )
}

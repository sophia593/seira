'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/logo'
import { UserMenu } from './user-menu'
import { cn } from '@/lib/utils'

// =============================================================================
// Page Title Map
// =============================================================================

const PAGE_TITLES: Record<string, string> = {
  '/events': 'events',
  '/saved': 'saved',
  '/settings': 'settings',
}

function getPageTitle(pathname: string): string | null {
  // Exact match
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname]
  }

  // Check for dynamic routes
  if (pathname.startsWith('/plan/')) {
    if (pathname.endsWith('/review')) {
      return 'review'
    }
    if (pathname.endsWith('/share')) {
      return 'shared'
    }
    return 'plan'
  }

  if (pathname.startsWith('/events/')) {
    return 'event'
  }

  if (pathname.startsWith('/saved/')) {
    return 'plan'
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

  const pageTitle = getPageTitle(pathname)
  const isOnEvents = pathname === '/events'

  function handleNewPlan() {
    router.push('/events')
  }

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b bg-background px-4',
        'pt-[env(safe-area-inset-top)]'
      )}
    >
      {/* Left: Logo + Page Title */}
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
        {!isOnEvents && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={handleNewPlan}
            aria-label="new plan"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}

        <UserMenu isCollapsed />
      </div>
    </header>
  )
}

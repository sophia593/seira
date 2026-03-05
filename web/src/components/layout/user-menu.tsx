'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LogOut,
  MessageSquarePlus,
  Loader2,
  Crown
} from 'lucide-react'
import { useUserStore } from '@/stores/user-store'
import { useAuth } from '@/hooks/use-auth'
import { AvatarUser } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface UserMenuProps {
  isCollapsed?: boolean
  variant?: 'default' | 'sidebar'
}

type UserPlan = 'free' | 'pro'

// =============================================================================
// Menu Item Component (with hover animation)
// =============================================================================

interface MenuItemProps {
  onClick: () => void
  icon: React.ElementType
  label: string
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

function MenuItem({
  onClick,
  icon: Icon,
  label,
  disabled = false,
  variant = 'default',
}: MenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'cursor-pointer transition-colors duration-150',
        'hover:bg-muted/80',
        variant === 'destructive' && 'text-destructive focus:text-destructive',
      )}
    >
      <Icon className="mr-2 h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
      <span className="lowercase">{label}</span>
    </DropdownMenuItem>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function UserMenu({ isCollapsed = false, variant = 'default' }: UserMenuProps) {
  const isSidebar = variant === 'sidebar'
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const { logout } = useAuth()

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Get user's plan (would come from user store in real app)
  const userPlan: UserPlan = (user as { plan?: UserPlan })?.plan || 'free'
  const isPro = userPlan === 'pro'

  // Get user's first initial
  const firstInitial = user?.name?.charAt(0)?.toUpperCase() ||
                       user?.email?.charAt(0)?.toUpperCase() ||
                       '?'

  // ===========================================================================
  // Handlers
  // ===========================================================================

  async function handleLogout() {
    setIsLoggingOut(true)
    setIsOpen(false)

    // Bulletproof logout: clear all state + sign out
    await logout()

    // Use replace so back button doesn't return to app
    router.replace('/')
  }

  function handleFeedback() {
    // Opens email with pre-filled subject
    window.location.href = 'mailto:support@seira.global?subject=Feedback'
    setIsOpen(false)
  }

  // ===========================================================================
  // Early return if no user
  // ===========================================================================

  if (!user) return null

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'transition-all duration-150',
            isSidebar ? 'hover:bg-white/5' : 'hover:bg-muted/80',
            isCollapsed
              ? 'h-11 w-11 p-0'
              : 'h-auto w-full justify-start gap-2.5 px-2 py-1.5'
          )}
        >
          <div className="relative shrink-0">
            {isSidebar && !user.avatar_url ? (
              <div className={cn(
                "rounded-full bg-copper text-white flex items-center justify-center font-medium",
                isCollapsed ? "w-9 h-9 text-sm" : "w-8 h-8 text-xs"
              )}>
                {firstInitial}
              </div>
            ) : (
              <AvatarUser
                src={user.avatar_url}
                name={user.name}
                size={isCollapsed ? 'default' : 'sm'}
              />
            )}
            {/* Pro badge indicator (small dot on avatar) */}
            {isPro && isCollapsed && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                <Crown className="w-2 h-2 text-primary-foreground" />
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className={cn("text-sm font-medium truncate", isSidebar && "text-white/80")}>
                {user.name || 'User'}
              </p>
              <p className={cn("text-xs truncate", isSidebar ? "text-white/30" : "text-muted-foreground")}>
                {user.email}
              </p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56"
        sideOffset={8}
      >
        {/* Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            {/* Initial avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">
                {firstInitial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {user.name || 'User'}
                </p>
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                    <Crown className="w-2.5 h-2.5" />
                    pro
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Give Feedback */}
        <MenuItem
          onClick={handleFeedback}
          icon={MessageSquarePlus}
          label="give feedback"
        />

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer transition-colors duration-150 hover:bg-muted/80"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="lowercase">logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4 transition-transform duration-150" />
              <span className="lowercase">log out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

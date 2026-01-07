'use client'

import { useRouter } from 'next/navigation'
import { Settings, LogOut } from 'lucide-react'
import { useUserStore } from '@/stores/user-store'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// =============================================================================
// Types
// =============================================================================

interface UserDropdownProps {
  children: React.ReactNode
}

// =============================================================================
// Component
// =============================================================================

export function UserDropdown({ children }: UserDropdownProps) {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const reset = useUserStore((state) => state.reset)

  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      reset()
      router.push('/')
    }
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="z-50 w-56 bg-card border border-border shadow-lg"
      >
        {/* User info */}
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{user.name || 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem
          onClick={() => router.push('/settings')}
          className="cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2" />
          settings
        </DropdownMenuItem>

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown

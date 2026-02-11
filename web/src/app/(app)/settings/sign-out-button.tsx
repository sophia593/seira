'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'
import { useOrgStore } from '@/stores/org-store'

export function SignOutButton() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      useUserStore.getState().clear()
      useOrgStore.getState().clear()
      router.push('/login')
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="border-gray-200 hover:bg-gray-50 text-gray-900 rounded-md"
    >
      {isSigningOut ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}

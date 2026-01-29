'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Post-auth redirect handler.
 *
 * This page is shown briefly after OAuth authentication completes.
 * It checks for a stored redirect URL and navigates there, or
 * defaults to /search.
 */
export default function AuthCompletePage() {
  const router = useRouter()

  useEffect(() => {
    // Check for stored redirect URL
    const redirectUrl = localStorage.getItem('seira_auth_redirect')

    // Clear the stored redirect
    localStorage.removeItem('seira_auth_redirect')

    // Redirect to stored URL or default
    if (redirectUrl) {
      router.replace(redirectUrl)
    } else {
      router.replace('/search')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">completing sign in...</p>
      </div>
    </div>
  )
}

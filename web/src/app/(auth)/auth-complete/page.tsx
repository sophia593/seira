'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'

/**
 * Post-auth redirect handler.
 *
 * Shown briefly after email verification or OAuth callback.
 * Shows contextual messaging based on the `from` query param
 * (e.g. ?from=signup → "email verified"), then redirects to
 * the stored redirect URL or /trips.
 */

function AuthCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from')

  const [showFallback, setShowFallback] = useState(false)

  const isSignup = from === 'signup'

  useEffect(() => {
    // Check for stored redirect URL
    const redirectUrl = localStorage.getItem('seira_auth_redirect')
    localStorage.removeItem('seira_auth_redirect')

    const destination = redirectUrl || '/trips'

    // Brief delay so the user sees the success message
    const redirectTimer = setTimeout(() => {
      router.replace(destination)
    }, isSignup ? 1500 : 500)

    // Fallback link in case redirect stalls
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true)
    }, 4000)

    return () => {
      clearTimeout(redirectTimer)
      clearTimeout(fallbackTimer)
    }
  }, [router, isSignup])

  return (
    <>
      {isSignup ? (
        <>
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
          </div>
          <p className="text-base font-medium mb-1">email verified</p>
          <p className="text-sm text-muted-foreground">taking you to your trips...</p>
        </>
      ) : (
        <>
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">completing sign in...</p>
        </>
      )}

      {showFallback && (
        <Link
          href="/trips"
          className="block mt-6 text-sm text-primary hover:underline animate-in fade-in duration-300"
        >
          click here if you&apos;re not redirected
        </Link>
      )}
    </>
  )
}

export default function AuthCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Suspense
          fallback={
            <>
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">completing sign in...</p>
            </>
          }
        >
          <AuthCompleteContent />
        </Suspense>
      </div>
    </div>
  )
}

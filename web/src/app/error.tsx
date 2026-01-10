'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, RefreshCw, Home, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  // Log error for debugging (not shown to users)
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span className="text-2xl font-semibold">seira</span>
        </div>

        {/* Error icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />
        </div>

        {/* Message */}
        <h1 className="text-xl sm:text-2xl font-semibold mb-2 lowercase">
          something went wrong
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8">
          we hit an unexpected bump. don&apos;t worry, your data is safe. let&apos;s try that again.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={reset}
            className="lowercase gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            try again
          </Button>
          <Button asChild variant="outline" size="lg" className="lowercase gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              go home
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground mt-8">
          keep seeing this?{" "}
          <a href="mailto:hello@seira.app" className="text-primary hover:underline">
            let us know
          </a>
        </p>
      </div>
    </div>
  )
}

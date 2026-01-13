'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, AlertCircle, Copy, Check } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [copied, setCopied] = useState(false)

  // Log error in development only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error)
    }
  }, [error])

  // Handle retry with loading state
  async function handleRetry() {
    setIsRetrying(true)
    // Small delay so user sees the loading state
    await new Promise((r) => setTimeout(r, 500))
    reset()
  }

  // Copy error ID for support
  async function copyErrorId() {
    if (!error.digest) return

    try {
      await navigator.clipboard.writeText(error.digest)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="mb-8 animate-in fade-in duration-500">
          <Logo />
        </div>

        {/* Error icon with pulse animation */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-destructive/20 animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-semibold mb-3 lowercase">
          something went wrong
        </h1>
        <p className="text-muted-foreground mb-8">
          we hit an unexpected bump. don't worry — your data is safe.
          let's try that again.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            size="lg"
            onClick={handleRetry}
            disabled={isRetrying}
            className="lowercase gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
            {isRetrying ? 'retrying...' : 'try again'}
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="lowercase gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              go home
            </Link>
          </Button>
        </div>

        {/* Error ID for support */}
        {error.digest && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-2">
              error reference (for support):
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                {error.digest}
              </code>
              <button
                onClick={copyErrorId}
                className="p-1.5 rounded-md hover:bg-background transition-colors"
                title="Copy error ID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          keep seeing this?{" "}
          <a
            href="mailto:support@seira.global"
            className="text-primary hover:underline"
          >
            let us know
          </a>
          {error.digest && " — include the error reference above"}
        </p>
      </div>
    </div>
  )
}

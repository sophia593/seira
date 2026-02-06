'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, ArrowLeft, AlertCircle, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function TripError({ error, reset }: ErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
  }, [error])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Trip builder error:', error)
    }
  }, [error])

  async function handleRetry() {
    setIsRetrying(true)
    await new Promise((r) => setTimeout(r, 500))
    reset()
  }

  const isNotFound = error.message?.toLowerCase().includes('not found') ||
    error.message?.toLowerCase().includes('404')

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="text-center max-w-sm">
        <div className={cn(
          "w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center",
          isOffline ? "bg-yellow-500/10" : "bg-destructive/10"
        )}>
          {isOffline ? (
            <WifiOff className="w-8 h-8 text-yellow-500" />
          ) : (
            <AlertCircle className="w-8 h-8 text-destructive" />
          )}
        </div>

        <h1 className="text-xl font-semibold mb-2 lowercase">
          {isNotFound ? 'trip not found' : isOffline ? 'no connection' : 'something went wrong'}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {isNotFound
            ? 'this trip may have been deleted or the link is invalid.'
            : isOffline
            ? 'check your internet connection and try again.'
            : 'we couldn\'t load this trip. try again or go back to your trips.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isNotFound && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying || isOffline}
              className="lowercase gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
              {isRetrying ? 'retrying...' : 'try again'}
            </Button>
          )}
          <Button asChild variant="outline" className="lowercase gap-2">
            <Link href="/saved">
              <ArrowLeft className="w-4 h-4" />
              back to trips
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

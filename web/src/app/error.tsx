'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  Home,
  AlertCircle,
  WifiOff,
  ServerCrash,
  Clock,
  Mail
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

type ErrorType = 'network' | 'server' | 'timeout' | 'unknown'

interface ErrorConfig {
  icon: React.ElementType
  iconClassName: string
  bgClassName: string
  title: string
  message: string
}

// =============================================================================
// Error Detection
// =============================================================================

function detectErrorType(error: Error): ErrorType {
  const message = error.message?.toLowerCase() || ''
  const name = error.name?.toLowerCase() || ''

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    name.includes('networkerror') ||
    !navigator.onLine
  ) {
    return 'network'
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('aborted')
  ) {
    return 'timeout'
  }

  // Server errors
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('server')
  ) {
    return 'server'
  }

  return 'unknown'
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
  network: {
    icon: WifiOff,
    iconClassName: 'text-yellow-500',
    bgClassName: 'bg-yellow-500/10',
    title: 'connection problem',
    message: 'we\'re having trouble connecting. check your internet and try again.',
  },
  server: {
    icon: ServerCrash,
    iconClassName: 'text-destructive',
    bgClassName: 'bg-destructive/10',
    title: 'server error',
    message: 'our servers are having a moment. this usually fixes itself quickly.',
  },
  timeout: {
    icon: Clock,
    iconClassName: 'text-yellow-500',
    bgClassName: 'bg-yellow-500/10',
    title: 'request timed out',
    message: 'that took too long. try again — it usually works the second time.',
  },
  unknown: {
    icon: AlertCircle,
    iconClassName: 'text-destructive',
    bgClassName: 'bg-destructive/10',
    title: 'something went wrong',
    message: 'we hit an unexpected bump. don\'t worry — your data is safe.',
  },
}

// =============================================================================
// Props
// =============================================================================

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// =============================================================================
// Main Component
// =============================================================================

export default function Error({ error, reset }: ErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [errorType, setErrorType] = useState<ErrorType>('unknown')

  // Detect error type on mount
  useEffect(() => {
    setErrorType(detectErrorType(error))
    setIsOffline(!navigator.onLine)
  }, [error])

  // Listen for online/offline changes
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
    }
    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Log error in development only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Root error:', error)
    }
  }, [error])

  // Handle retry with loading state
  async function handleRetry() {
    setIsRetrying(true)
    await new Promise((r) => setTimeout(r, 500))
    reset()
  }

  const config = errorConfigs[errorType]
  const Icon = config.icon

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <WifiOff className="w-4 h-4" />
            <span>you're offline — check your connection</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Logo */}
          <div className="mb-8 animate-in fade-in duration-500">
            <Logo />
          </div>

          {/* Error icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className={cn(
              "absolute inset-0 rounded-2xl animate-pulse",
              config.bgClassName
            )} />
            <div className={cn(
              "relative w-full h-full rounded-2xl flex items-center justify-center",
              config.bgClassName
            )}>
              <Icon className={cn("w-10 h-10", config.iconClassName)} />
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-semibold mb-3 lowercase">
            {config.title}
          </h1>
          <p className="text-muted-foreground mb-8">
            {config.message}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button
              size="lg"
              onClick={handleRetry}
              disabled={isRetrying || isOffline}
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

          {/* Contact */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="lowercase gap-2 text-muted-foreground"
          >
            <a href="mailto:support@seira.global">
              <Mail className="w-4 h-4" />
              contact us
            </a>
          </Button>

          {/* Error reference */}
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-8">
              error reference: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{error.digest}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

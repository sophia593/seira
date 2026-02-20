'use client'

import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManageBillingButtonProps {
  orgId: string
}

export function ManageBillingButton({ orgId }: ManageBillingButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-2 h-9 px-4 rounded-md',
        'bg-kurobeni text-white text-sm font-medium',
        'hover:bg-blackberry transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          manage billing
          <ExternalLink className="w-3.5 h-3.5" />
        </>
      )}
    </button>
  )
}

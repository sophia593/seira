'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const FEATURES = [
  'unlimited events',
  'unlimited partners',
  'unlimited deliverables',
  'proof uploads (10 GB storage)',
  'recap reports with PDF export',
  'team roles & permissions',
  'email notifications',
  'priority support',
]

interface SubscribeFormProps {
  orgId: string
  monthlyPriceId: string
  annualPriceId: string
  isReactivation?: boolean
}

export function SubscribeForm({ orgId, monthlyPriceId, annualPriceId, isReactivation }: SubscribeFormProps) {
  const [annual, setAnnual] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe() {
    setIsLoading(true)
    setError('')

    try {
      const priceId = annual ? annualPriceId : monthlyPriceId

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, priceId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Connection failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <Logo color="brand" />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold lowercase">
            {isReactivation ? 'reactivate your plan' : 'start your trial'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isReactivation
              ? `Pick up where you left off. ${annual ? '$1,900/yr' : '$190/mo'}.`
              : `14-day free trial, then ${annual ? '$1,900/yr' : '$190/mo'}. cancel anytime.`}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              'text-sm font-medium px-4 py-1.5 rounded-lg transition-colors',
              !annual
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              'text-sm font-medium px-4 py-1.5 rounded-lg transition-colors',
              annual
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            annual
            <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase">
              save $380
            </span>
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl border-2 border-copper/30 bg-card p-8 shadow-lg">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              seira pro
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold">
                {annual ? '$1,900' : '$190'}
              </span>
              <span className="text-muted-foreground text-lg">
                /{annual ? 'yr' : 'mo'}
              </span>
            </div>
            {annual && (
              <p className="text-sm text-emerald-600 mt-1">
                $158/mo — save $380 vs monthly
              </p>
            )}
          </div>

          <ul className="space-y-3 mb-8">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-copper shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {error && (
            <div className="p-3 rounded-md bg-red-50 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={cn(
              'flex items-center justify-center h-11 w-full rounded-xl',
              'bg-copper text-white text-sm font-semibold lowercase',
              'hover:bg-copper/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isReactivation ? (
              'reactivate'
            ) : (
              'start trial'
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            {isReactivation
              ? 'you will be charged immediately'
              : 'your card will be charged after the 14-day trial'}
          </p>
        </div>
      </div>
    </>
  )
}

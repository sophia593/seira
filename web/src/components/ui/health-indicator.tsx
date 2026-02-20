'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PartnerHealth } from '@/lib/partner-health'
import { healthTier } from '@/lib/partner-health'

interface HealthIndicatorProps {
  health: PartnerHealth
  showProof?: boolean
  className?: string
}

export function HealthIndicator({ health, showProof = true, className }: HealthIndicatorProps) {
  const tier = healthTier(health.fulfillmentPct)
  const TrendIcon = health.trend === 'up' ? TrendingUp : health.trend === 'down' ? TrendingDown : Minus
  const trendColor = health.trend === 'up' ? 'text-green-500' : health.trend === 'down' ? 'text-red-400' : 'text-gray-300'

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span className={cn('font-medium', tier.color)}>{health.fulfillmentPct}%</span>
      {showProof && (
        <span className="text-gray-400">{health.proofPct}% proved</span>
      )}
      <TrendIcon className={cn('w-3 h-3', trendColor)} />
    </div>
  )
}

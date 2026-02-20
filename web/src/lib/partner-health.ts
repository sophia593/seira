export interface PartnerHealth {
  fulfillmentPct: number
  proofPct: number
  trend: 'up' | 'down' | 'flat'
}

export const HEALTH_CONFIG = {
  good:    { minFulfillment: 80, color: 'text-green-600', bg: 'bg-green-50' },
  warning: { minFulfillment: 40, color: 'text-amber-600', bg: 'bg-amber-50' },
  poor:    { minFulfillment: 0,  color: 'text-red-600',   bg: 'bg-red-50' },
} as const

export function computeHealth(stats: {
  total: number
  completed: number
  proved: number
  overdue: number
}): PartnerHealth | null {
  if (stats.total === 0) return null

  const fulfillmentPct = Math.round((stats.completed / stats.total) * 100)
  const proofPct = Math.round((stats.proved / stats.total) * 100)

  const overdueRatio = stats.overdue / stats.total
  const trend: 'up' | 'down' | 'flat' =
    overdueRatio > 0.25 ? 'down' :
    stats.overdue === 0 && fulfillmentPct > 60 ? 'up' : 'flat'

  return { fulfillmentPct, proofPct, trend }
}

export function healthTier(fulfillmentPct: number) {
  if (fulfillmentPct >= 80) return HEALTH_CONFIG.good
  if (fulfillmentPct >= 40) return HEALTH_CONFIG.warning
  return HEALTH_CONFIG.poor
}

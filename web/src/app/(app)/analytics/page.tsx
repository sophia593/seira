import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getDashboardStats, getDeliverablesByCategory } from '@/lib/db/dashboard'
import { getOrgPartnerRollup } from '@/lib/db/partners'
import { getRecentActivity } from '@/lib/db/activity-log'
import { ProgressBar } from '@/components/ui/progress-bar'
import { ActivityMiniWidget } from '@/components/activity-mini-widget'
import { CATEGORY_CONFIG } from '@/lib/constants'
import { formatShortDate } from '@/lib/constants'
import type { DashboardStats, CategoryBreakdown } from '@/lib/db/dashboard'
import type { OrgPartnerRollup, ActivityLog } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function settle<T>(result: PromiseSettledResult<T>, fallback: T, label: string): T {
  if (result.status === 'fulfilled') return result.value
  console.error(`[Analytics] ${label} failed:`, result.reason)
  return fallback
}

const DEFAULT_STATS: DashboardStats = {
  activeEvents: 0,
  totalDeliverables: 0,
  overdueCount: 0,
  completionPct: 0,
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) redirect('/dashboard')

  const orgId = membership.org_id

  const [statsResult, categoriesResult, partnersResult, activityResult] = await Promise.allSettled([
    getDashboardStats(orgId),
    getDeliverablesByCategory(orgId),
    getOrgPartnerRollup(orgId),
    getRecentActivity(orgId, 20),
  ])

  const stats = settle(statsResult, DEFAULT_STATS, 'getDashboardStats')
  const categories = settle(categoriesResult, [] as CategoryBreakdown[], 'getDeliverablesByCategory')
  const partners = settle(partnersResult, [] as OrgPartnerRollup[], 'getOrgPartnerRollup')
  const activity = settle(activityResult, [] as ActivityLog[], 'getRecentActivity')

  const totalDealValue = partners.reduce((sum, p) => sum + p.total_deal_value, 0)
  const topPartners = [...partners]
    .sort((a, b) => b.total_deal_value - a.total_deal_value)
    .slice(0, 10)

  return (
    <div className="px-4 py-6 pb-24 md:px-8 md:py-8 max-w-5xl mx-auto lg:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace performance overview</p>
      </div>

      {/* Summary Stats */}
      <section
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-10"
        aria-label="Key metrics"
      >
        <StatCard label="Active Events" value={stats.activeEvents} />
        <StatCard label="Deliverables" value={stats.totalDeliverables} />
        <StatCard label="Completion" value={`${stats.completionPct}%`} highlight={stats.completionPct >= 80} />
        <StatCard label="Overdue" value={stats.overdueCount} warn={stats.overdueCount > 0} />
        <StatCard label="Total Pipeline" value={totalDealValue > 0 ? formatCurrency(totalDealValue) : '—'} />
      </section>

      {/* Two-column: Categories + Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Deliverables by Category */}
        <section>
          <h2 className="text-sm font-semibold mb-4">Deliverables by Category</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No deliverables yet.</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{CATEGORY_CONFIG[cat.category].icon}</span>
                      <span className="text-sm font-medium">{CATEGORY_CONFIG[cat.category].label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {cat.completed}/{cat.total}
                    </span>
                  </div>
                  <ProgressBar value={cat.pct} size="sm" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Partners */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Top Partners</h2>
            {partners.length > 0 && (
              <Link
                href="/partners"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all &rarr;
              </Link>
            )}
          </div>
          {topPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No partners yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {topPartners.map((partner) => (
                <Link
                  key={partner.name}
                  href={`/partners/${encodeURIComponent(partner.name)}`}
                  className="flex items-center gap-4 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{partner.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {partner.event_count} event{partner.event_count !== 1 ? 's' : ''}
                      {' · '}
                      {partner.total_deliverables} deliverable{partner.total_deliverables !== 1 ? 's' : ''}
                      {partner.next_renewal_date && (
                        <span className="text-blue-500"> · Renews {formatShortDate(partner.next_renewal_date)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {partner.total_deal_value > 0 && (
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(partner.total_deal_value)}</p>
                    )}
                    <p className="text-xs text-muted-foreground tabular-nums">{partner.completion_pct}%</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Activity */}
      {activity.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
          <ActivityMiniWidget activities={activity} />
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  highlight,
  warn,
}: {
  label: string
  value: number | string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${warn ? 'text-destructive' : highlight ? 'text-copper' : ''}`}>
        {value}
      </p>
    </div>
  )
}

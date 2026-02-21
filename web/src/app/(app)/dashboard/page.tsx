import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, Users, ClipboardCheck, Plus, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization } from '@/lib/db/organizations'
import { listEvents } from '@/lib/db/events'
import { listSeasons } from '@/lib/db/seasons'
import { listDistinctPartnerNames } from '@/lib/db/partners'
import { CreateWorkspaceForm } from '../create-workspace-form'
import {
  getDashboardStats,
  getUpcomingEvents,
  getOverdueDeliverables,
  getNeedsProofDeliverables,
  getUpcomingRenewals,
} from '@/lib/db/dashboard'
import { getRecentActivity } from '@/lib/db/activity-log'
import { DashboardFilters } from './dashboard-filters'
import { isUuid } from '@/lib/validation'
import { CATEGORIES, STATUS_FLOW } from '@/lib/constants'
import type { DashboardStats, DashboardFilters as DashboardFiltersType, UpcomingRenewal } from '@/lib/db/dashboard'
import type { Event, Season, EventWithCompletion, DeliverableWithPartner, DeliverableCategory, DeliverableStatus, ActivityLog } from '@/lib/types/database'
import { ProgressBar } from '@/components/ui/progress-bar'
import { AlertBadge, computeAlertSeverity } from '@/components/ui/alert-badge'
import { SampleDataButton } from './sample-data-button'
import { ActivityMiniWidget } from '@/components/activity-mini-widget'
import { formatShortDate, CATEGORY_CONFIG, PROOF_REQUIRED_CONFIG, EVENT_DOT_COLOR } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_STATS: DashboardStats = {
  activeEvents: 0,
  totalDeliverables: 0,
  overdueCount: 0,
  completionPct: 0,
}

function settle<T>(result: PromiseSettledResult<T>, fallback: T, label: string): T {
  if (result.status === 'fulfilled') return result.value
  console.error(`[Dashboard] ${label} failed:`, result.reason)
  return fallback
}


// Category urgency weight — time-sensitive categories score higher
const CATEGORY_URGENCY: Record<DeliverableCategory, number> = {
  'in-venue': 5,
  'talent': 4,
  'hospitality': 3,
  'signage': 3,
  'content': 2,
  'digital': 1,
}

/** Compute attention priority score (higher = more urgent). */
function attentionPriority(item: DeliverableWithPartner): number {
  const now = Date.now()
  let score = 0

  // Days overdue / days since due — primary signal
  if (item.due_date) {
    const dueMs = new Date(item.due_date).getTime()
    const daysOverdue = Math.max(0, (now - dueMs) / 86_400_000)
    score += daysOverdue * 10
  } else {
    // No due date but still flagged — medium baseline
    score += 15
  }

  // Category urgency
  score += CATEGORY_URGENCY[item.category] ?? 0

  return score
}

function completionColor(pct: number): string | undefined {
  if (pct >= 80) return 'text-copper'
  if (pct < 40 && pct > 0) return 'text-amber-600'
  return undefined
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)

  if (!membership) {
    console.error('[Dashboard] No membership found after layout bootstrap — showing workspace creation form')
    return <CreateWorkspaceForm />
  }

  const orgId = membership.org_id

  // ---------------------------------------------------------------------------
  // Parse filters from search params
  // ---------------------------------------------------------------------------
  const params = await searchParams
  const filters: DashboardFiltersType = {}

  if (typeof params.event === 'string' && isUuid(params.event)) {
    filters.eventId = params.event
  }
  if (typeof params.season === 'string' && isUuid(params.season)) {
    filters.seasonId = params.season
  }
  if (typeof params.partner === 'string' && params.partner.length > 0) {
    filters.partnerName = params.partner
  }
  if (typeof params.category === 'string' && (CATEGORIES as string[]).includes(params.category)) {
    filters.category = params.category as DeliverableCategory
  }
  if (typeof params.status === 'string' && (STATUS_FLOW as string[]).includes(params.status)) {
    filters.status = params.status as DeliverableStatus
  }
  const hasFilters = Object.keys(filters).length > 0

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------
  const [
    orgResult, statsResult, eventsResult, overdueResult, needsProofResult, activityResult,
    allEventsResult, seasonsResult, partnerNamesResult, renewalsResult,
  ] = await Promise.allSettled([
    getOrganization(supabase, orgId),
    getDashboardStats(orgId, hasFilters ? filters : undefined),
    getUpcomingEvents(orgId, hasFilters ? filters : undefined),
    getOverdueDeliverables(orgId, hasFilters ? filters : undefined),
    getNeedsProofDeliverables(orgId, hasFilters ? filters : undefined),
    getRecentActivity(orgId, 15, hasFilters ? { eventId: filters.eventId, seasonId: filters.seasonId } : undefined),
    // Filter option lists
    listEvents(orgId),
    listSeasons(orgId),
    listDistinctPartnerNames(orgId),
    getUpcomingRenewals(orgId, 90, hasFilters ? filters : undefined),
  ])

  const org = settle(orgResult, null, 'getOrganization')
  const stats = settle(statsResult, DEFAULT_STATS, 'getDashboardStats')
  const upcomingEvents = settle(eventsResult, [] as EventWithCompletion[], 'getUpcomingEvents')
  const overdueItems = settle(overdueResult, [] as DeliverableWithPartner[], 'getOverdueDeliverables')
  const needsProofItems = settle(needsProofResult, [] as DeliverableWithPartner[], 'getNeedsProofDeliverables')
  const recentActivity = settle(activityResult, [] as ActivityLog[], 'getRecentActivity')
  const allEvents = settle(allEventsResult, [] as Event[], 'listEvents')
  const allSeasons = settle(seasonsResult, [] as Season[], 'listSeasons')
  const partnerNames = settle(partnerNamesResult, [] as string[], 'listDistinctPartnerNames')
  const upcomingRenewals = settle(renewalsResult, [] as UpcomingRenewal[], 'getUpcomingRenewals')

  const isViewer = membership.role === 'viewer'
  const isEmpty = !hasFilters && stats.activeEvents === 0 && stats.totalDeliverables === 0

  // Filter option data for the client component
  const filterEvents = allEvents
    .filter((e) => e.status !== 'archived')
    .map((e) => ({ id: e.id, name: e.name }))
  const filterSeasons = allSeasons.map((s) => ({ id: s.id, name: s.name }))

  // ---------------------------------------------------------------------------
  // Empty state — onboarding
  // ---------------------------------------------------------------------------
  if (isEmpty) {
    return (
      <div className="px-4 pt-24 md:pt-32 md:px-8">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Seira</h1>
          <p className="mt-3 text-muted-foreground">
            Track sponsor deliverables, collect proof, and generate recap reports.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { step: '1', icon: CalendarDays, title: 'Create an event', desc: 'Set up your game, show, or festival.' },
              { step: '2', icon: Users, title: 'Add partners', desc: 'Add sponsors and their contacts.' },
              { step: '3', icon: ClipboardCheck, title: 'Track deliverables', desc: 'Assign deliverables and track completion.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="border border-gray-100 rounded-lg p-5 hover:border-gray-200 transition">
                <p className="text-xs text-gray-400 font-mono mb-2">{step}</p>
                <div className="w-10 h-10 rounded-full bg-copper/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-copper" />
                </div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>

          {!isViewer && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Link
                href="/events"
                className="inline-flex items-center justify-center bg-kurobeni text-white rounded-md h-10 px-6 text-sm font-medium hover:bg-blackberry transition-colors"
              >
                Create your first event
              </Link>
              <SampleDataButton />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Populated state
  // ---------------------------------------------------------------------------
  const orgName = org?.name ?? 'Your workspace'
  const totalAttentionCount = overdueItems.length + needsProofItems.length
  const sortedOverdue = [...overdueItems].sort((a, b) => attentionPriority(b) - attentionPriority(a))
  const sortedNeedsProof = [...needsProofItems].sort((a, b) => attentionPriority(b) - attentionPriority(a))
  const displayedOverdue = sortedOverdue.slice(0, 8)
  const remainingSlots = Math.max(0, 8 - displayedOverdue.length)
  const displayedNeedsProof = sortedNeedsProof.slice(0, remainingSlots)
  const moreEventsCount = stats.activeEvents - upcomingEvents.length

  return (
    <div className="px-4 py-6 pb-24 md:px-8 md:py-8 max-w-5xl mx-auto lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {hasFilters ? 'Filtered view' : `Overview for ${orgName}`}
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={
        <div className="mb-6 flex flex-wrap gap-2">
          {[140, 130, 130, 120, 120].map((w, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" style={{ width: `${w}px` }} />
          ))}
        </div>
      }>
        <DashboardFilters
          events={filterEvents}
          seasons={filterSeasons}
          partnerNames={partnerNames}
        />
      </Suspense>

      {/* Stats row */}
      <section
        className="grid grid-cols-2 gap-3 lg:flex lg:items-start lg:gap-0 lg:divide-x lg:divide-border mb-8"
        aria-label="Dashboard statistics"
      >
        <StatItem label="Active Events" value={stats.activeEvents} sub={hasFilters ? 'matching filters' : 'upcoming + active'} />
        <StatItem label="Total Deliverables" value={stats.totalDeliverables} sub={hasFilters ? 'matching filters' : 'across all events'} />
        <StatItem
          label="Overdue"
          value={stats.overdueCount}
          sub="need attention"
          valueClassName={stats.overdueCount > 0 ? 'text-destructive' : undefined}
          showPulse={stats.overdueCount > 0}
        />
        <StatItem
          label="Completion"
          value={`${stats.completionPct}%`}
          sub="proved or done"
          valueClassName={completionColor(stats.completionPct)}
        />
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Upcoming Events */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              {hasFilters && (filters.eventId || filters.seasonId) ? 'Events' : 'Upcoming Events'}
            </h2>
            <Link
              href="/events"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              View all &rarr;
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              No {hasFilters ? 'matching' : 'upcoming'} events.{!isViewer && !hasFilters && (
                <>
                  {' '}
                  <Link href="/events" className="underline hover:text-foreground transition-colors duration-150">
                    Create one
                  </Link>
                </>
              )}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors duration-150"
                >
                  {/* Status dot + name + alert badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${EVENT_DOT_COLOR[event.status]}`} />
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <AlertBadge
                        severity={computeAlertSeverity(event.overdue_count, event.needs_proof_count ?? 0)}
                        count={event.overdue_count + (event.needs_proof_count ?? 0)}
                        pulse={event.overdue_count > 0}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-4">
                      {formatShortDate(event.date)}
                      {event.venue && ` · ${event.venue}`}
                      {event.total_deliverables > 0 && (
                        <span className="ml-1.5">· {event.total_deliverables} deliverable{event.total_deliverables !== 1 ? 's' : ''}</span>
                      )}
                      {event.overdue_count > 0 && (
                        <span className="text-red-500 ml-1.5">
                          ({event.overdue_count} overdue)
                        </span>
                      )}
                    </p>
                  </div>
                  <ProgressBar value={event.completion_pct} size="sm" className="w-28 shrink-0" />
                </Link>
              ))}
              {moreEventsCount > 0 && (
                <div className="py-3 px-2">
                  <Link
                    href="/events"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
                  >
                    and {moreEventsCount} more &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Attention */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold">Attention</h2>
            {totalAttentionCount > 0 && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {totalAttentionCount}
              </span>
            )}
          </div>

          {totalAttentionCount === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              {hasFilters ? 'No items match the current filters.' : 'Nothing needs attention — nice work.'}
            </p>
          ) : (
            <div>
              {/* Overdue section */}
              {displayedOverdue.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-red-400 font-medium mb-1 mt-1">
                    Overdue
                  </p>
                  <div className="divide-y divide-border">
                    {displayedOverdue.map((item) => (
                      <Link
                        key={item.id}
                        href={`/events/${item.event_id}/partners/${item.partner_id}`}
                        className="flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors duration-150"
                      >
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-muted-foreground truncate">{item.partner.name}</span>
                            {item.due_date && (
                              <span className="text-xs text-red-500 shrink-0">
                                · Due {formatShortDate(item.due_date)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                            {CATEGORY_CONFIG[item.category].label}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Needs proof section */}
              {displayedNeedsProof.length > 0 && (
                <div className={displayedOverdue.length > 0 ? 'mt-3' : ''}>
                  <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-medium mb-1 mt-1">
                    Needs Proof
                  </p>
                  <div className="divide-y divide-border">
                    {displayedNeedsProof.map((item) => (
                      <Link
                        key={item.id}
                        href={`/events/${item.event_id}/partners/${item.partner_id}`}
                        className="flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors duration-150"
                      >
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-yellow-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <span className="text-xs text-muted-foreground truncate">{item.partner.name}</span>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                            {PROOF_REQUIRED_CONFIG[item.proof_required]?.label ?? 'Proof'} needed &middot; {CATEGORY_CONFIG[item.category].label}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View all link */}
              {totalAttentionCount > 8 && (
                <div className="pt-2">
                  <Link
                    href="/events"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
                  >
                    View all &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
          {/* Upcoming Renewals */}
          {upcomingRenewals.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold">Upcoming Renewals</h2>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {upcomingRenewals.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {upcomingRenewals.map((r) => (
                  <Link
                    key={`${r.partner_name}-${r.event_id}`}
                    href={`/partners/${encodeURIComponent(r.partner_name)}`}
                    className="flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors duration-150"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.partner_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">{r.event_name}</span>
                        <span className="text-xs text-blue-500 shrink-0">
                          · Renews {formatShortDate(r.renewal_date)}
                        </span>
                      </div>
                      {r.deal_value != null && r.deal_value > 0 && (
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          ${r.deal_value.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
          <ActivityMiniWidget activities={recentActivity} />
        </div>
      )}

      {/* Quick actions */}
      <div className="border-t border-gray-100 pt-6 mt-6 flex items-center gap-4 flex-wrap">
        {!isViewer && (
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            New Event
          </Link>
        )}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          View All Events
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatItem({
  label,
  value,
  sub,
  valueClassName,
  showPulse,
}: {
  label: string
  value: number | string
  sub: string
  valueClassName?: string
  showPulse?: boolean
}) {
  return (
    <div className="min-w-0 rounded-lg p-2 hover:bg-muted/30 transition-colors duration-150 lg:rounded-none lg:p-0 lg:hover:bg-transparent lg:flex-1 lg:px-4 lg:first:pl-0 lg:last:pr-0">
      <div className="flex items-center gap-1.5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {showPulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold mt-1 ${valueClassName ?? ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

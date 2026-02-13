import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, Users, ClipboardCheck, Plus, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization } from '@/lib/db/organizations'
import {
  getDashboardStats,
  getUpcomingEvents,
  getOverdueDeliverables,
  getNeedsProofDeliverables,
} from '@/lib/db/dashboard'
import type { DashboardStats } from '@/lib/db/dashboard'
import type { EventWithCompletion, DeliverableWithPartner, EventStatus } from '@/lib/types/database'
import { ProgressBar } from '@/components/ui/progress-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { SampleDataButton } from './sample-data-button'
import { formatShortDate, CATEGORY_CONFIG, PROOF_REQUIRED_CONFIG } from '@/lib/constants'

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

const EVENT_DOT_COLOR: Record<EventStatus, string> = {
  upcoming: 'bg-blue-500',
  active: 'bg-amber-500',
  completed: 'bg-copper',
  archived: 'bg-gray-400',
}

function completionColor(pct: number): string | undefined {
  if (pct >= 80) return 'text-copper'
  if (pct < 40 && pct > 0) return 'text-amber-600'
  return undefined
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)

  if (!membership) {
    console.error('[Dashboard] No membership found after layout bootstrap')
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
        <EmptyState
          icon={CalendarDays}
          title="Workspace setup incomplete"
          description="Your workspace couldn't be created automatically. Please check server logs or contact support."
        />
      </div>
    )
  }

  const orgId = membership.org_id

  const [orgResult, statsResult, eventsResult, overdueResult, needsProofResult] =
    await Promise.allSettled([
      getOrganization(supabase, orgId),
      getDashboardStats(orgId),
      getUpcomingEvents(orgId),
      getOverdueDeliverables(orgId),
      getNeedsProofDeliverables(orgId),
    ])

  const org = settle(orgResult, null, 'getOrganization')
  const stats = settle(statsResult, DEFAULT_STATS, 'getDashboardStats')
  const upcomingEvents = settle(eventsResult, [] as EventWithCompletion[], 'getUpcomingEvents')
  const overdueItems = settle(overdueResult, [] as DeliverableWithPartner[], 'getOverdueDeliverables')
  const needsProofItems = settle(needsProofResult, [] as DeliverableWithPartner[], 'getNeedsProofDeliverables')

  const isEmpty = stats.activeEvents === 0 && stats.totalDeliverables === 0

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

          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/events"
              className="inline-flex items-center justify-center bg-kurobeni text-white rounded-md h-10 px-6 text-sm font-medium hover:bg-blackberry transition-colors"
            >
              Create your first event
            </Link>
            <SampleDataButton />
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Populated state
  // ---------------------------------------------------------------------------
  const orgName = org?.name ?? 'Your workspace'
  const totalAttentionCount = overdueItems.length + needsProofItems.length
  const displayedOverdue = overdueItems.slice(0, 8)
  const remainingSlots = Math.max(0, 8 - displayedOverdue.length)
  const displayedNeedsProof = needsProofItems.slice(0, remainingSlots)
  const moreEventsCount = stats.activeEvents - upcomingEvents.length

  return (
    <div className="px-4 py-6 pb-24 md:px-8 md:py-8 max-w-6xl mx-auto lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview for {orgName}</p>
      </div>

      {/* Stats row */}
      <section
        className="grid grid-cols-2 gap-3 lg:flex lg:items-start lg:gap-0 lg:divide-x lg:divide-border mb-8"
        aria-label="Dashboard statistics"
      >
        <StatItem label="Active Events" value={stats.activeEvents} sub="upcoming + active" />
        <StatItem label="Total Deliverables" value={stats.totalDeliverables} sub="across all events" />
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
            <h2 className="text-sm font-semibold">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              View all &rarr;
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              No upcoming events.{' '}
              <Link href="/events" className="underline hover:text-foreground transition-colors duration-150">
                Create one
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-border">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors duration-150"
                >
                  {/* Status dot + name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${EVENT_DOT_COLOR[event.status]}`} />
                      <p className="text-sm font-medium truncate">{event.name}</p>
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
              Nothing needs attention — nice work.
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
        </div>
      </div>

      {/* Quick actions */}
      <div className="border-t border-gray-100 pt-6 mt-6 flex items-center gap-4 flex-wrap">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <Plus className="h-3.5 w-3.5" />
          New Event
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Partner
        </Link>
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

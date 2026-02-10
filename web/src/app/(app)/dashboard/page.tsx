import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, ClipboardList, AlertTriangle, TrendingUp } from 'lucide-react'
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
import type { EventWithCompletion, DeliverableWithPartner } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { EventStatusBadge, CategoryBadge, StatusBadge } from '@/components/ui/badges'
import { ProgressBar } from '@/components/ui/progress-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { formatEventDate, formatShortDate } from '@/lib/constants'

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(
    supabase as Parameters<typeof getUserMembership>[0],
    user.id
  )

  if (!membership) {
    // Layout should have auto-created the org. If we still have no membership,
    // something is misconfigured (e.g. missing SUPABASE_SERVICE_ROLE_KEY).
    console.error('[Dashboard] No membership found after layout bootstrap')
    return (
      <div className="px-6 py-8 md:px-10 md:py-12 max-w-6xl mx-auto">
        <EmptyState
          icon={CalendarDays}
          title="Workspace setup incomplete"
          description="Your workspace couldn't be created automatically. Please check server logs or contact support."
        />
      </div>
    )
  }

  const orgId = membership.org_id

  // Fetch org name + all dashboard data in parallel — each degrades independently
  const [orgResult, statsResult, eventsResult, overdueResult, needsProofResult] =
    await Promise.allSettled([
      getOrganization(
        supabase as Parameters<typeof getOrganization>[0],
        orgId
      ),
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

  const orgName = org?.name ?? 'your workspace'

  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview for {orgName}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Active Events"
          value={stats.activeEvents}
          helper="upcoming + active"
          icon={<CalendarDays className="w-4 h-4 text-muted-foreground" />}
        />
        <StatCard
          label="Total Deliverables"
          value={stats.totalDeliverables}
          helper="across all events"
          icon={<ClipboardList className="w-4 h-4 text-muted-foreground" />}
        />
        <StatCard
          label="Overdue"
          value={stats.overdueCount}
          helper="need attention"
          icon={<AlertTriangle className="w-4 h-4 text-muted-foreground" />}
          valueClassName={stats.overdueCount > 0 ? 'text-destructive' : undefined}
        />
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Completion
              </span>
            </div>
            <p className="text-2xl font-semibold">{stats.completionPct}%</p>
            <ProgressBar value={stats.completionPct} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upcoming Events */}
        <div>
          <SectionHeader
            title="Upcoming Events"
            trailing={
              <Link
                href="/events"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View all &rarr;
              </Link>
            }
          />

          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming events"
              description="Create an event to start tracking deliverables."
              action={
                <Button size="sm" asChild>
                  <Link href="/events">Create an event</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="block group">
                  <Card className="py-4 group-hover:shadow-md group-hover:border-border transition-all">
                    <CardContent className="px-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{event.name}</span>
                        <EventStatusBadge status={event.status} />
                        {event.overdue_count > 0 && (
                          <span className="text-xs font-medium text-destructive">
                            Overdue: {event.overdue_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatEventDate(event.date)}
                        {event.venue && ` · ${event.venue}`}
                      </p>
                      <ProgressBar value={event.completion_pct} showLabel />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Overdue + Needs Proof */}
        <div className="space-y-8">
          {/* Overdue */}
          <div>
            <SectionHeader
              title={
                <>
                  Overdue{' '}
                  {overdueItems.length > 0 && (
                    <span className="text-destructive font-semibold">
                      ({overdueItems.length})
                    </span>
                  )}
                </>
              }
            />

            {overdueItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nothing overdue — nice work.
              </p>
            ) : (
              <div className="space-y-3">
                {overdueItems.map((d) => (
                  <Link key={d.id} href={`/events/${d.event_id}`} className="block group">
                    <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4 transition-all group-hover:shadow-md group-hover:border-red-300/80 dark:border-red-900/40 dark:bg-red-950/20">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm line-clamp-2">{d.title}</span>
                        <CategoryBadge category={d.category} />
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="text-muted-foreground">{d.partner.name}</span>
                        <span className="text-destructive font-medium">
                          Due {formatShortDate(d.due_date)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Done — Needs Proof */}
          <div>
            <SectionHeader title="Done — Needs Proof" />

            {needsProofItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                All caught up.
              </p>
            ) : (
              <div className="space-y-3">
                {needsProofItems.map((d) => (
                  <Link key={d.id} href={`/events/${d.event_id}`} className="block group">
                    <div className="rounded-xl border border-yellow-200/60 bg-yellow-50/50 p-4 transition-all group-hover:shadow-md group-hover:border-yellow-300/80 dark:border-yellow-900/40 dark:bg-yellow-950/20">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm line-clamp-2">{d.title}</span>
                        <CategoryBadge category={d.category} />
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {d.partner.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  trailing,
}: {
  title: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4 pb-2 border-b">
      <h2 className="text-base font-medium">{title}</h2>
      {trailing}
    </div>
  )
}

function StatCard({
  label,
  value,
  helper,
  icon,
  valueClassName,
}: {
  label: string
  value: number
  helper: string
  icon: React.ReactNode
  valueClassName?: string
}) {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
        </div>
        <p className={`text-2xl font-semibold ${valueClassName ?? ''}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{helper}</p>
      </CardContent>
    </Card>
  )
}

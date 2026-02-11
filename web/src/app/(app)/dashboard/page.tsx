import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, Users, ClipboardCheck } from 'lucide-react'
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
import { ProgressBar } from '@/components/ui/progress-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { formatShortDate } from '@/lib/constants'

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
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Seira</h1>
          <p className="mt-3 text-muted-foreground">
            Track sponsor deliverables, collect proof, and generate recap reports.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 text-left">
            <div>
              <CalendarDays className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Create an event</p>
              <p className="text-xs text-muted-foreground mt-1">
                Set up your game, show, or festival.
              </p>
            </div>
            <div>
              <Users className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Add partners</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add sponsors and their contacts.
              </p>
            </div>
            <div>
              <ClipboardCheck className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Track deliverables</p>
              <p className="text-xs text-muted-foreground mt-1">
                Assign deliverables and track completion.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
              <Link href="/events">Create your first event</Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Or explore with sample data
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Populated state
  // ---------------------------------------------------------------------------
  const orgName = org?.name ?? 'your workspace'
  const attentionItems = [
    ...overdueItems.map((d) => ({ ...d, kind: 'overdue' as const })),
    ...needsProofItems.map((d) => ({ ...d, kind: 'needs-proof' as const })),
  ].slice(0, 8)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview for {orgName}</p>
      </div>

      {/* Stats row */}
      <div className="flex items-start divide-x divide-border mb-8 overflow-x-auto">
        <StatItem label="Active Events" value={stats.activeEvents} sub="upcoming + active" />
        <StatItem label="Total Deliverables" value={stats.totalDeliverables} sub="across all events" />
        <StatItem
          label="Overdue"
          value={stats.overdueCount}
          sub="need attention"
          valueClassName={stats.overdueCount > 0 ? 'text-destructive' : undefined}
        />
        <StatItem label="Completion" value={`${stats.completionPct}%`} sub="proved or done" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Upcoming Events */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              No upcoming events.{' '}
              <Link href="/events" className="underline hover:text-foreground">
                Create one
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-border">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatShortDate(event.date)}
                      {event.venue && ` · ${event.venue}`}
                    </p>
                  </div>
                  <div className="w-20 shrink-0">
                    <ProgressBar value={event.completion_pct} size="sm" />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                    {event.completion_pct}%
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Attention */}
        <div className="lg:col-span-2">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Attention</h2>
          </div>

          {attentionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              Nothing needs attention — nice work.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/events/${item.event_id}`}
                  className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.kind === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.partner.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
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
}: {
  label: string
  value: number | string
  sub: string
  valueClassName?: string
}) {
  return (
    <div className="flex-1 px-4 first:pl-0 last:pr-0 min-w-0">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${valueClassName ?? ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

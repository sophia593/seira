import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listEventsWithCompletion } from '@/lib/db/events'
import { getOrgOverdueDeliverables, listDeliverables } from '@/lib/db/deliverables'
import { listEvents } from '@/lib/db/events'
import {
  DashboardStats,
  UpcomingEventsCard,
  OverdueDeliverablesCard,
} from '@/components/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user and org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase as Parameters<typeof getUserMembership>[0], user.id)
  if (!membership) redirect('/login')

  const orgId = membership.org_id

  // Fetch dashboard data in parallel
  const [upcomingEvents, overdueDeliverables, allEvents] = await Promise.all([
    listEventsWithCompletion(
      supabase as Parameters<typeof listEventsWithCompletion>[0],
      orgId,
      { status: 'upcoming', limit: 5 }
    ),
    getOrgOverdueDeliverables(
      supabase as Parameters<typeof getOrgOverdueDeliverables>[0],
      orgId,
      5
    ),
    listEvents(
      supabase as Parameters<typeof listEvents>[0],
      orgId
    ),
  ])

  // Get done count by fetching deliverables for all events
  let doneCount = 0
  for (const event of allEvents) {
    const deliverables = await listDeliverables(
      supabase as Parameters<typeof listDeliverables>[0],
      { eventId: event.id }
    )
    doneCount += deliverables.filter(d => d.status === 'done').length
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your sponsorship fulfillment
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <DashboardStats
          upcomingEventsCount={upcomingEvents.length}
          overdueCount={overdueDeliverables.length}
          doneCount={doneCount}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingEventsCard events={upcomingEvents} />
        <OverdueDeliverablesCard deliverables={overdueDeliverables} />
      </div>
    </div>
  )
}

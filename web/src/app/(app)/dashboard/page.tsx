import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listEventsWithCompletion, listEvents } from '@/lib/db/events'
import { getOrgOverdueDeliverables, listDeliverables } from '@/lib/db/deliverables'
import {
  DashboardStats,
  UpcomingEventsCard,
  OverdueDeliverablesCard,
} from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get membership - if fails, show empty state
  let membership
  try {
    membership = await getUserMembership(supabase as Parameters<typeof getUserMembership>[0], user.id)
  } catch (e) {
    console.error('Failed to get membership:', e)
    membership = null
  }

  if (!membership) {
    return (
      <div className="px-6 py-8 md:px-10 md:py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your sponsorship fulfillment
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Setting up your workspace...</p>
          <Button asChild>
            <Link href="/events">
              <CalendarDays className="w-4 h-4 mr-2" />
              Go to Events
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const orgId = membership.org_id

  // Fetch dashboard data - wrap in try/catch to be resilient
  let upcomingEvents: Awaited<ReturnType<typeof listEventsWithCompletion>> = []
  let overdueDeliverables: Awaited<ReturnType<typeof getOrgOverdueDeliverables>> = []
  let doneCount = 0

  try {
    const [events, overdue, allEvents] = await Promise.all([
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

    upcomingEvents = events
    overdueDeliverables = overdue

    // Get done count
    for (const event of allEvents) {
      try {
        const deliverables = await listDeliverables(
          supabase as Parameters<typeof listDeliverables>[0],
          { eventId: event.id }
        )
        doneCount += deliverables.filter(d => d.status === 'done').length
      } catch {
        // Skip this event's deliverables on error
      }
    }
  } catch (e) {
    console.error('Failed to fetch dashboard data:', e)
    // Continue with empty data
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

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listEventsWithCompletion } from '@/lib/db/events'
import { EventList } from '@/components/events'

export default async function EventsPage() {
  const supabase = await createClient()

  // Get user and org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase as Parameters<typeof getUserMembership>[0], user.id)
  if (!membership) redirect('/login')

  const orgId = membership.org_id

  // Fetch events
  const events = await listEventsWithCompletion(
    supabase as Parameters<typeof listEventsWithCompletion>[0],
    orgId
  )

  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Events
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your sponsored events and deliverables
        </p>
      </div>

      {/* Event list with filters */}
      <EventList events={events} orgId={orgId} />
    </div>
  )
}

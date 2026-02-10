import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listEvents } from '@/lib/db/events'
import { EventList } from '@/components/events'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarDays } from 'lucide-react'

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(
    supabase as Parameters<typeof getUserMembership>[0],
    user.id
  )

  if (!membership) {
    return (
      <div className="px-6 py-8 md:px-10 md:py-12 max-w-5xl mx-auto">
        <EmptyState
          icon={CalendarDays}
          title="No workspace found"
          description="Please log out and sign in again to set up your workspace."
        />
      </div>
    )
  }

  const events = await listEvents(membership.org_id)

  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Events
          {events.length > 0 && (
            <span className="text-muted-foreground font-normal text-lg ml-2">
              ({events.length} {events.length === 1 ? 'event' : 'events'})
            </span>
          )}
        </h1>
      </div>

      <EventList events={events} orgId={membership.org_id} />
    </div>
  )
}

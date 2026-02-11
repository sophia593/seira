import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listEventsWithCompletion } from '@/lib/db/events'
import { EventList } from '@/components/events'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarDays } from 'lucide-react'

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)

  if (!membership) {
    console.error('[Events] No membership found after layout bootstrap')
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
        <EmptyState
          icon={CalendarDays}
          title="Workspace setup incomplete"
          description="Your workspace couldn't be created automatically. Please check server logs or contact support."
        />
      </div>
    )
  }

  const events = await listEventsWithCompletion(membership.org_id)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <EventList events={events} orgId={membership.org_id} />
    </div>
  )
}

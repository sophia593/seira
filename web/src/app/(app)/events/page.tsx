import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listEventsWithCompletion } from '@/lib/db/events'
import { listSeasons } from '@/lib/db/seasons'
import { EventList } from '@/components/events'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarDays } from 'lucide-react'
import { startTimer } from '@/lib/perf'

export default async function EventsPage() {
  const pageTimer = startTimer('EventsPage:total')
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

  let events: Awaited<ReturnType<typeof listEventsWithCompletion>> = []
  let seasons: Awaited<ReturnType<typeof listSeasons>> = []

  try {
    events = await listEventsWithCompletion(membership.org_id)
  } catch (e) {
    console.error('[Events] Failed to load events:', e)
  }

  try {
    seasons = await listSeasons(membership.org_id)
  } catch (e) {
    console.error('[Events] Failed to load seasons:', e)
  }

  const seasonOptions = seasons.map((s) => ({ id: s.id, name: s.name }))

  pageTimer.end()
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <EventList events={events} orgId={membership.org_id} seasons={seasonOptions} />
    </div>
  )
}

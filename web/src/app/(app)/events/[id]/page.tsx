import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getEventWithCompletion } from '@/lib/db/events'
import { listPartnersWithCompletion } from '@/lib/db/partners'
import { listDeliverables } from '@/lib/db/deliverables'
import {
  EventHeader,
  EventActions,
  DeliverableSummary,
  PartnerList,
} from '@/components/event-detail'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = await params
  const supabase = await createClient()

  // Get user and org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase as Parameters<typeof getUserMembership>[0], user.id)
  if (!membership) redirect('/login')

  const orgId = membership.org_id

  // Fetch event
  const event = await getEventWithCompletion(
    supabase as Parameters<typeof getEventWithCompletion>[0],
    eventId,
    orgId
  )

  if (!event) {
    notFound()
  }

  // Fetch partners and deliverables in parallel
  const [partners, deliverables] = await Promise.all([
    listPartnersWithCompletion(
      supabase as Parameters<typeof listPartnersWithCompletion>[0],
      orgId,
      eventId
    ),
    listDeliverables(
      supabase as Parameters<typeof listDeliverables>[0],
      { eventId }
    ),
  ])

  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-6xl">
      {/* Header with actions */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          <EventHeader event={event} />
        </div>
        <EventActions event={event} orgId={orgId} />
      </div>

      {/* Deliverable summary by category */}
      {deliverables.length > 0 && (
        <div className="mb-8">
          <DeliverableSummary deliverables={deliverables} />
        </div>
      )}

      {/* Partners section */}
      <PartnerList partners={partners} eventId={eventId} orgId={orgId} />
    </div>
  )
}

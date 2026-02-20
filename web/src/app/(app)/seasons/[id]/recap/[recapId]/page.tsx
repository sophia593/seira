import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getRecapById, getSeasonRecapData } from '@/lib/db/recaps'
import { getSeasonById } from '@/lib/db/seasons'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { SeasonRecapReport } from '@/components/recap/public/season-recap-report'
import { RecapControls } from '@/app/(app)/events/[id]/partners/[partnerId]/recap/[recapId]/recap-controls'

interface SeasonRecapPageProps {
  params: Promise<{ id: string; recapId: string }>
}

export default async function SeasonRecapPage({ params }: SeasonRecapPageProps) {
  const { id: seasonId, recapId } = await params

  const [recap, season] = await Promise.all([
    getRecapById(recapId),
    getSeasonById(seasonId),
  ])

  if (!recap || !season) notFound()
  if (recap.season_id !== seasonId) notFound()

  // Viewers can only access published recaps
  if (recap.status !== 'published') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const membership = await getUserMembership(supabase, user.id)
    if (membership?.role === 'viewer') notFound()
  }

  const data = await getSeasonRecapData(recapId)
  if (!data) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const shareUrl = recap.status === 'published'
    ? `${baseUrl}/recap/${recap.share_token}`
    : null

  return (
    <div>
      <div className="px-4 py-4 md:px-8 border-b border-gray-200 bg-white sticky top-0 z-10">
        <Breadcrumbs
          items={[
            { label: 'Seasons', href: '/seasons' },
            { label: season.name, href: `/seasons/${seasonId}` },
            { label: 'Season Recap' },
          ]}
          className="mb-3"
        />
        <RecapControls
          recap={recap}
          eventId={recap.event_id}
          partnerId={recap.partner_id}
          shareUrl={shareUrl}
          partnerName={data.partner.name}
        />
      </div>

      <div className="bg-gray-50">
        <SeasonRecapReport data={data} />
      </div>
    </div>
  )
}

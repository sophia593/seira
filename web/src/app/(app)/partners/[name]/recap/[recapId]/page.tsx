import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getRecapById, getCombinedRecapData } from '@/lib/db/recaps'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { CombinedRecapReport } from '@/components/recap/public/combined-recap-report'
import { RecapControls } from '@/app/(app)/events/[id]/partners/[partnerId]/recap/[recapId]/recap-controls'

interface CombinedRecapPageProps {
  params: Promise<{ name: string; recapId: string }>
}

export default async function CombinedRecapPage({ params }: CombinedRecapPageProps) {
  const { name, recapId } = await params
  const decodedName = decodeURIComponent(name)

  const recap = await getRecapById(recapId)
  if (!recap || !recap.is_combined) notFound()

  // Viewers can only access published recaps
  if (recap.status !== 'published') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const membership = await getUserMembership(supabase, user.id)
    if (membership?.role === 'viewer') notFound()
  }

  const data = await getCombinedRecapData(recapId)
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
            { label: 'Partners', href: '/partners' },
            { label: decodedName, href: `/partners/${name}` },
            { label: 'Combined Recap' },
          ]}
          className="mb-3"
        />
        <RecapControls
          recap={recap}
          eventId={recap.event_id}
          partnerId={recap.partner_id}
          shareUrl={shareUrl}
          partnerName={data.partner.name}
          partnerContactEmail={data.partner.contact_email}
        />
      </div>

      <div className="bg-gray-50">
        <CombinedRecapReport data={data} />
      </div>
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getTalentById, listDeliverablesByTalent } from '@/lib/db/talent'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { TalentProfileContent } from './talent-profile-content'

interface TalentProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function TalentProfilePage({ params }: TalentProfilePageProps) {
  const { id: talentId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) redirect('/login')

  const talent = await getTalentById(talentId)
  if (!talent) notFound()
  if (talent.org_id !== membership.org_id) notFound()

  const commitments = await listDeliverablesByTalent(talentId)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Talent', href: '/talent' },
          { label: talent.name },
        ]}
        className="mb-6"
      />
      <TalentProfileContent talent={talent} commitments={commitments} />
    </div>
  )
}

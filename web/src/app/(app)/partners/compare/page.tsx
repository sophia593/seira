import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrgPartnerRollup } from '@/lib/db/partners'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PartnerComparison } from './partner-comparison'

interface ComparePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) notFound()

  const namesParam = typeof params.names === 'string' ? params.names : ''
  const requestedNames = namesParam
    .split(',')
    .map((n) => decodeURIComponent(n.trim()))
    .filter(Boolean)

  if (requestedNames.length < 2 || requestedNames.length > 3) {
    redirect('/partners')
  }

  const allPartners = await getOrgPartnerRollup(membership.org_id)
  const selected = requestedNames
    .map((name) =>
      allPartners.find(
        (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim(),
      ),
    )
    .filter((p): p is NonNullable<typeof p> => p != null)

  if (selected.length < 2) redirect('/partners')

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Partners', href: '/partners' },
          { label: 'Compare' },
        ]}
        className="mb-6"
      />
      <PartnerComparison partners={selected} />
    </div>
  )
}

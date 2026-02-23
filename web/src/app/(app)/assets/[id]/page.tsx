import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getAssetById } from '@/lib/db/assets'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { AssetDetailContent } from './asset-detail-content'
import type { OrgRole } from '@/lib/types/database'

interface AssetDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id: assetId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) redirect('/login')

  const asset = await getAssetById(assetId)
  if (!asset) notFound()
  if (asset.org_id !== membership.org_id) notFound()

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Assets', href: '/assets' },
          { label: asset.name },
        ]}
        className="mb-6"
      />
      <AssetDetailContent asset={asset} role={membership.role as OrgRole} />
    </div>
  )
}

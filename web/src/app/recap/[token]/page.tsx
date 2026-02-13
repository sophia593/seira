import { notFound } from 'next/navigation'
import { getRecapByShareToken, getRecapDataPublic } from '@/lib/db/recaps'
import { RecapContent } from '@/components/recap/recap-content'
import { PublicRecapActions } from './actions-bar'

interface RecapPageProps {
  params: Promise<{ token: string }>
}

export default async function PublicRecapPage({ params }: RecapPageProps) {
  const { token } = await params

  const recap = await getRecapByShareToken(token)
  if (!recap) notFound()

  const data = await getRecapDataPublic(recap.id)
  if (!data) notFound()

  return (
    <>
      <PublicRecapActions recapId={recap.id} shareToken={token} />
      <RecapContent data={data} />
    </>
  )
}

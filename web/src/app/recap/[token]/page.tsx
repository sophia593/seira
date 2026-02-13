import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRecapByShareToken, getRecapDataPublic } from '@/lib/db/recaps'
import { RecapContent } from '@/components/recap/recap-content'
import { PublicRecapActions } from './actions-bar'

interface RecapPageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: RecapPageProps): Promise<Metadata> {
  const { token } = await params
  const recap = await getRecapByShareToken(token)

  if (!recap) {
    return { title: 'Recap Not Found' }
  }

  const data = await getRecapDataPublic(recap.id)
  const title = data
    ? `${data.partner.name} — ${data.event.name} Recap`
    : recap.title
  const description = 'Sponsorship recap report with proof of performance'

  return {
    title: `${title} · Seira`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PublicRecapPage({ params }: RecapPageProps) {
  const { token } = await params

  const recap = await getRecapByShareToken(token)
  if (!recap) notFound()

  const data = await getRecapDataPublic(recap.id)
  if (!data) notFound()

  return (
    <div className="pt-16">
      <PublicRecapActions recapId={recap.id} shareToken={token} />
      <RecapContent data={data} />
    </div>
  )
}

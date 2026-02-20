import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRecapByShareToken, getRecapDataPublic, getSeasonRecapDataPublic, getCombinedRecapDataPublic } from '@/lib/db/recaps'
import { PublicRecapReport } from '@/components/recap/public/public-recap-report'
import { SeasonRecapReport } from '@/components/recap/public/season-recap-report'
import { CombinedRecapReport } from '@/components/recap/public/combined-recap-report'
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

  const isCombined = !!recap.is_combined
  const isSeasonRecap = !!recap.season_id
  let title: string
  let partnerName: string | undefined

  if (isCombined) {
    const data = await getCombinedRecapDataPublic(recap.id)
    title = data
      ? `${data.partner.name} — Combined Recap`
      : recap.title
    partnerName = data?.partner.name
  } else if (isSeasonRecap) {
    const data = await getSeasonRecapDataPublic(recap.id)
    title = data
      ? `${data.partner.name} — ${data.season.name} Season Recap`
      : recap.title
    partnerName = data?.partner.name
  } else {
    const data = await getRecapDataPublic(recap.id)
    title = data
      ? `${data.partner.name} — ${data.event.name} Recap`
      : recap.title
    partnerName = data?.partner.name
  }

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

  const isCombined = !!recap.is_combined
  const isSeasonRecap = !!recap.season_id

  if (isCombined) {
    const data = await getCombinedRecapDataPublic(recap.id)
    if (!data) notFound()

    return (
      <div className="min-h-screen bg-gray-50">
        <PublicRecapActions
          recapId={recap.id}
          shareToken={token}
          eventName="Combined Recap"
          partnerName={data.partner.name}
        />
        <CombinedRecapReport data={data} />
      </div>
    )
  }

  if (isSeasonRecap) {
    const data = await getSeasonRecapDataPublic(recap.id)
    if (!data) notFound()

    return (
      <div className="min-h-screen bg-gray-50">
        <PublicRecapActions
          recapId={recap.id}
          shareToken={token}
          eventName={data.season.name}
          partnerName={data.partner.name}
        />
        <SeasonRecapReport data={data} />
      </div>
    )
  }

  const data = await getRecapDataPublic(recap.id)
  if (!data) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicRecapActions
        recapId={recap.id}
        shareToken={token}
        eventName={data.event.name}
        partnerName={data.partner.name}
      />
      <PublicRecapReport data={data} />
    </div>
  )
}

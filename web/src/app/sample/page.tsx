import type { Metadata } from 'next'
import { PublicRecapReport } from '@/components/recap/public/public-recap-report'
import { SampleActionsBar } from './sample-actions-bar'
import { SAMPLE_RECAP_DATA } from './sample-data'

export const metadata: Metadata = {
  title: 'sample recap report',
  description:
    'See what a seira sponsorship recap report looks like — deliverable tracking, proof of performance, and branded reporting.',
  openGraph: {
    title: 'Sample Recap Report — Seira',
    description:
      'A live demo of a seira sponsorship fulfillment recap report.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

export default function SampleRecapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SampleActionsBar />
      <PublicRecapReport data={SAMPLE_RECAP_DATA} />
    </div>
  )
}

import type { RecapData } from '@/lib/types/database'
import { HeroSection } from './hero-section'
import { FulfillmentRing } from './fulfillment-ring'
import { CategoryBreakdown } from './category-breakdown'
import { CompletionTimeline } from './completion-timeline'
import { DeliverablesSection } from './deliverables-section'
import { ReportFooter } from './report-footer'

interface PublicRecapReportProps {
  data: RecapData
}

export function PublicRecapReport({ data }: PublicRecapReportProps) {
  const { recap, organization, event, partner, deliverables, stats } = data

  return (
    <>
      <HeroSection
        organization={organization}
        event={event}
        partner={partner}
        coverNote={recap.cover_note}
      />

      {/* White card overlapping hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-t-2xl -mt-10 relative z-10 px-6 sm:px-10 pt-10 pb-12 shadow-sm print:mt-0 print:rounded-none print:shadow-none">
          <FulfillmentRing
            total={stats.total}
            completed={stats.completed}
            proved={stats.proved}
          />

          <CategoryBreakdown byCategory={stats.byCategory} />

          <CompletionTimeline deliverables={deliverables} />

          <DeliverablesSection deliverables={deliverables} />

          <ReportFooter publishedAt={recap.published_at} />
        </div>
      </div>
    </>
  )
}

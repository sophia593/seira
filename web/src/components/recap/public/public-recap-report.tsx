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
        <div className="bg-white rounded-t-3xl -mt-16 relative z-10 px-8 sm:px-12 pt-12 pb-12 shadow-[0_-4px_30px_rgba(0,0,0,0.06)] print:mt-0 print:rounded-none print:shadow-none">
          <FulfillmentRing
            total={stats.total}
            completed={stats.completed}
            proved={stats.proved}
            inProgress={stats.inProgress}
          />

          <div className="mt-14">
            <CategoryBreakdown byCategory={stats.byCategory} />
          </div>

          <div className="border-t border-gray-100 mt-16 pt-16 print:border-gray-200">
            <CompletionTimeline deliverables={deliverables} />
          </div>

          <div className="border-t border-gray-100 mt-16 pt-16 print:border-gray-200">
            <DeliverablesSection deliverables={deliverables} />
          </div>

          <ReportFooter
            publishedAt={recap.published_at}
            contactName={partner.contact_name}
            contactEmail={partner.contact_email}
          />
        </div>
      </div>
    </>
  )
}

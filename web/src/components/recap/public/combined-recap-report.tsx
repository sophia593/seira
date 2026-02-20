import type { CombinedRecapData } from '@/lib/types/database'
import { CombinedHeroSection } from './combined-hero-section'
import { FulfillmentRing } from './fulfillment-ring'
import { CategoryBreakdown } from './category-breakdown'
import { CompletionTimeline } from './completion-timeline'
import { DeliverablesSection } from './deliverables-section'
import { ReportFooter } from './report-footer'
import { formatShortDate } from '@/lib/constants'

interface CombinedRecapReportProps {
  data: CombinedRecapData
}

export function CombinedRecapReport({ data }: CombinedRecapReportProps) {
  const { recap, organization, partner, events, deliverables, stats, eventCount, totalDealValue, dateRange } = data

  return (
    <>
      <CombinedHeroSection
        organization={organization}
        partner={partner}
        coverNote={recap.cover_note}
        eventCount={eventCount}
        totalDealValue={totalDealValue}
        dateRange={dateRange}
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

          {/* Per-event breakdown */}
          {events.length > 1 && (
            <div className="border-t border-gray-100 mt-16 pt-16 print:border-gray-200">
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Breakdown</p>
                <h2 className="text-xl font-semibold text-gray-900">By Event</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => {
                  const eventTotal = event.deliverables.length
                  const eventCompleted = event.deliverables.filter(
                    (d) => d.status === 'done' || d.status === 'proved'
                  ).length
                  const eventPct = eventTotal > 0 ? Math.round((eventCompleted / eventTotal) * 100) : 0

                  return (
                    <div key={event.id} className="border border-gray-100 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.name}</p>
                      {event.date && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatShortDate(event.date)}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {eventCompleted}/{eventTotal} completed
                        </span>
                        <span className={`text-sm font-semibold ${eventPct >= 80 ? 'text-green-600' : eventPct < 40 && eventTotal > 0 ? 'text-amber-500' : 'text-gray-700'}`}>
                          {eventPct}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-copper rounded-full transition-all"
                          style={{ width: `${eventPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 mt-16 pt-16 print:border-gray-200">
            <CompletionTimeline deliverables={deliverables} />
          </div>

          {/* Deliverables grouped by event */}
          {events.map((event) => (
            <div key={event.id} className="border-t border-gray-100 mt-16 pt-16 print:border-gray-200">
              <div className="mb-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  {event.date ? formatShortDate(event.date) : 'Event'}
                  {event.venue && ` \u00b7 ${event.venue}`}
                </p>
                <h2 className="text-lg font-semibold text-gray-900">{event.name}</h2>
              </div>
              <DeliverablesSection deliverables={event.deliverables} />
            </div>
          ))}

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

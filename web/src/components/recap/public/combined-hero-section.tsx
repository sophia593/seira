import { formatShortDate } from '@/lib/constants'

interface CombinedHeroSectionProps {
  organization: { name: string }
  partner: { name: string; contact_name: string | null; contact_email: string | null }
  coverNote: string | null
  eventCount: number
  totalDealValue: number
  dateRange: { earliest: string | null; latest: string | null }
}

export function CombinedHeroSection({
  organization,
  partner,
  coverNote,
  eventCount,
  totalDealValue,
  dateRange,
}: CombinedHeroSectionProps) {
  const dateLine = [
    dateRange.earliest ? formatShortDate(dateRange.earliest) : null,
    dateRange.latest ? formatShortDate(dateRange.latest) : null,
  ]
    .filter(Boolean)
    .join(' \u2192 ')

  return (
    <section className="bg-gradient-to-b from-kurobeni to-blackberry pt-28 pb-24 px-6 print:bg-white print:pt-8 print:pb-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs sm:text-sm uppercase tracking-widest text-white/40 print:text-gray-400">
          {organization.name}
        </p>
        <h1 className="text-2xl sm:text-5xl font-bold text-white mt-2 animate-fade-in-up print:text-gray-900">
          {partner.name}
        </h1>
        <p className="text-sm text-white/50 mt-1 animate-fade-in-up animation-delay-100 print:text-gray-400">
          Combined Recap &middot; {eventCount} event{eventCount !== 1 ? 's' : ''}
          {totalDealValue > 0 && ` \u00b7 $${totalDealValue.toLocaleString()}`}
        </p>
        <p className="text-lg sm:text-xl text-copper mt-3 animate-fade-in-up animation-delay-200 print:text-gray-600">
          Partnership Overview
        </p>
        {(partner.contact_name || partner.contact_email) && (
          <p className="text-sm text-white/50 mt-1 animate-fade-in-up animation-delay-300 print:text-gray-500">
            {[partner.contact_name, partner.contact_email].filter(Boolean).join(' \u00b7 ')}
          </p>
        )}
        {dateLine && (
          <p className="text-sm text-white/40 mt-2 animate-fade-in-up animation-delay-300 print:text-gray-400">
            {dateLine}
          </p>
        )}
        {coverNote && (
          <blockquote className="border-l-2 border-copper bg-white/5 pl-4 pr-4 py-3 mt-6 rounded-r-lg text-base text-white/70 italic max-w-2xl animate-fade-in-up animation-delay-400 print:text-gray-600 print:border-gray-300 print:bg-transparent">
            {coverNote}
          </blockquote>
        )}
      </div>
    </section>
  )
}

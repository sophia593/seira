import { formatEventDate } from '@/lib/constants'

interface HeroSectionProps {
  organization: { name: string }
  event: { name: string; date: string | null; venue: string | null }
  partner: { name: string; contact_name: string | null; contact_email: string | null }
  coverNote: string | null
}

export function HeroSection({ organization, event, partner, coverNote }: HeroSectionProps) {
  const dateLine = [
    event.date ? formatEventDate(event.date) : null,
    event.venue,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="bg-gradient-to-b from-kurobeni to-blackberry pt-28 pb-24 px-6 print:bg-white print:pt-8 print:pb-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs sm:text-sm uppercase tracking-widest text-white/40 print:text-gray-400">
          {organization.name}
        </p>
        <h1 className="text-2xl sm:text-5xl font-bold text-white mt-2 animate-fade-in-up print:text-gray-900">
          {event.name}
        </h1>
        <p className="text-lg sm:text-xl text-copper mt-3 animate-fade-in-up animation-delay-100 print:text-gray-600">
          Prepared for {partner.name}
        </p>
        {(partner.contact_name || partner.contact_email) && (
          <p className="text-sm text-white/50 mt-1 animate-fade-in-up animation-delay-200 print:text-gray-500">
            {[partner.contact_name, partner.contact_email].filter(Boolean).join(' · ')}
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

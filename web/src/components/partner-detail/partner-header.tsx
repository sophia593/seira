import { Mail, User, FileText } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import type { Partner, Event } from '@/lib/types/database'

interface PartnerHeaderProps {
  partner: Partner
  event: Event
}

export function PartnerHeader({ partner, event }: PartnerHeaderProps) {
  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${event.id}` },
          { label: partner.name },
        ]}
        className="mb-4"
      />

      {/* Partner name */}
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">{partner.name}</h1>

      {/* Contact info */}
      <div className="flex flex-wrap gap-4 text-muted-foreground">
        {partner.contact_name && (
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {partner.contact_name}
          </span>
        )}
        {partner.contact_email && (
          <a
            href={`mailto:${partner.contact_email}`}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Mail className="w-4 h-4" />
            {partner.contact_email}
          </a>
        )}
      </div>

      {/* Contract notes */}
      {partner.contract_notes && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-sm font-medium mb-1">
            <FileText className="w-4 h-4" />
            Contract Notes
          </div>
          <p className="text-sm text-muted-foreground">{partner.contract_notes}</p>
        </div>
      )}
    </div>
  )
}

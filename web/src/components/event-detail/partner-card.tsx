'use client'

import Link from 'next/link'
import { Mail, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { completionPct } from '@/lib/constants'
import type { PartnerWithCompletion } from '@/lib/types/database'

interface PartnerCardProps {
  partner: PartnerWithCompletion
  eventId: string
}

export function PartnerCard({ partner, eventId }: PartnerCardProps) {
  const completion = completionPct(partner.total_deliverables, partner.completed_deliverables)

  return (
    <Link href={`/events/${eventId}/partners/${partner.id}`}>
      <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="pt-6">
          {/* Partner name */}
          <h3 className="font-semibold text-base mb-2 truncate">{partner.name}</h3>

          {/* Contact info */}
          <div className="space-y-1 mb-4 text-sm text-muted-foreground">
            {partner.contact_name && (
              <p className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 shrink-0" />
                {partner.contact_name}
              </p>
            )}
            {partner.contact_email && (
              <p className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {partner.contact_email}
              </p>
            )}
            {!partner.contact_name && !partner.contact_email && (
              <p className="text-muted-foreground/60 italic">No contact info</p>
            )}
          </div>

          {/* Completion stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {partner.completed_deliverables}/{partner.total_deliverables} deliverables
              </span>
              <span className="font-medium">{completion}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { AddPartnerDialog } from './add-partner-dialog'
import type { Partner } from '@/lib/types/database'

interface PartnerSectionProps {
  partners: Partner[]
  eventId: string
}

export function PartnerSection({ partners, eventId }: PartnerSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Partners
          {partners.length > 0 && (
            <span className="text-muted-foreground font-normal text-sm ml-2">
              ({partners.length})
            </span>
          )}
        </h2>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          Add Partner
        </Button>
      </div>

      {partners.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No partners yet"
          description="Add a sponsor or partner to start tracking their deliverables."
          action={
            <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              Add Partner
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {partners.map((partner) => (
            <Link
              key={partner.id}
              href={`/events/${eventId}/partners/${partner.id}`}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{partner.name}</p>
                {(partner.contact_name || partner.contact_email) && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {[partner.contact_name, partner.contact_email]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {partner.contract_notes && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {partner.contract_notes}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      )}

      <AddPartnerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        eventId={eventId}
      />
    </div>
  )
}

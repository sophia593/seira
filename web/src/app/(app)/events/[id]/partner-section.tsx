'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { AddPartnerDialog } from './add-partner-dialog'
import type { Partner } from '@/lib/types/database'

interface PartnerSectionProps {
  partners: Partner[]
  eventId: string
  completionMap: Map<string, { total: number; completed: number; pct: number }>
}

export function PartnerSection({ partners, eventId, completionMap }: PartnerSectionProps) {
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
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {partners.map((partner) => {
            const stats = completionMap.get(partner.id)
            return (
              <Link
                key={partner.id}
                href={`/events/${eventId}/partners/${partner.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{partner.name}</p>
                  {(partner.contact_name || partner.contact_email) && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {[partner.contact_name, partner.contact_email]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                {stats && stats.total > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <ProgressBar value={stats.pct} size="sm" className="w-20" />
                    <span className="text-xs text-gray-500 w-8 text-right">{stats.pct}%</span>
                  </div>
                )}
              </Link>
            )
          })}
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

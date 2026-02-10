'use client'

import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PartnerCard } from './partner-card'
import { PartnerFormDialog } from './partner-form-dialog'
import type { PartnerWithCompletion } from '@/lib/types/database'

interface PartnerListProps {
  partners: PartnerWithCompletion[]
  eventId: string
  orgId: string
}

export function PartnerList({ partners, eventId, orgId }: PartnerListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Partners
          <span className="text-muted-foreground font-normal">({partners.length})</span>
        </h2>
        <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Partner
        </Button>
      </div>

      {/* Partners grid */}
      {partners.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No partners yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add a partner to start tracking deliverables
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Partner
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} eventId={eventId} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <PartnerFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        eventId={eventId}
        orgId={orgId}
      />
    </div>
  )
}

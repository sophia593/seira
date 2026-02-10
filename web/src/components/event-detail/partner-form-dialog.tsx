'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'
import { createPartnerAction, updatePartnerAction } from '@/app/(app)/actions'
import type { Partner } from '@/lib/types/database'

interface PartnerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  orgId: string
  partner?: Partner // If provided, edit mode
  onSuccess?: () => void
}

export function PartnerFormDialog({
  open,
  onOpenChange,
  eventId,
  orgId,
  partner,
  onSuccess,
}: PartnerFormDialogProps) {
  const router = useRouter()
  const isEdit = !!partner

  const [name, setName] = useState(partner?.name ?? '')
  const [contactName, setContactName] = useState(partner?.contact_name ?? '')
  const [contactEmail, setContactEmail] = useState(partner?.contact_email ?? '')
  const [contractNotes, setContractNotes] = useState(partner?.contract_notes ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Partner name is required')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEdit && partner) {
        const result = await updatePartnerAction(partner.id, eventId, {
          name: name.trim(),
          contact_name: contactName.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          contract_notes: contractNotes.trim() || undefined,
        })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Partner updated')
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        const result = await createPartnerAction({
          event_id: eventId,
          name: name.trim(),
          contact_name: contactName.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          contract_notes: contractNotes.trim() || undefined,
        })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Partner created')
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/events/${eventId}/partners/${result.data?.id}`)
        }
      }
    } catch (error) {
      toast.error(isEdit ? 'Failed to update partner' : 'Failed to create partner')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (!isEdit) {
        setName('')
        setContactName('')
        setContactEmail('')
        setContractNotes('')
      }
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {isEdit ? 'Edit Partner' : 'Add Partner'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Partner Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john@acme.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractNotes">Contract Notes</Label>
            <Input
              id="contractNotes"
              value={contractNotes}
              onChange={(e) => setContractNotes(e.target.value)}
              placeholder="Optional notes about the partnership..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? 'Save Changes' : 'Add Partner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

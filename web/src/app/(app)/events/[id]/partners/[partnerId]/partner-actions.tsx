'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { SlideOver } from '@/components/ui/slide-over'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/sonner'
import { updatePartnerAction, deletePartnerAction } from '@/app/(app)/actions/partners'
import type { Partner } from '@/lib/types/database'

interface PartnerActionsProps {
  partner: Partner
  eventId: string
}

export function PartnerActions({ partner, eventId }: PartnerActionsProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updatePartnerAction(partner.id, eventId, formData)
      if (!result.ok) {
        setEditError(result.error ?? 'Failed to update partner')
        return
      }
      toast.success('Partner updated')
      setShowEditDialog(false)
      router.refresh()
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deletePartnerAction(partner.id, eventId)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete partner')
        setIsDeleting(false)
        return
      }
      toast.success('Partner deleted')
      router.push(`/events/${eventId}`)
    } catch {
      toast.error('Failed to delete partner')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Edit slide-over */}
      <SlideOver
        open={showEditDialog}
        onClose={() => { if (!isPending) setShowEditDialog(false) }}
        title="Edit Partner"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" form="edit-partner-form" isLoading={isPending}>
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="edit-partner-form" ref={formRef} onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Partner Name *</Label>
            <Input
              id="edit-name"
              name="name"
              defaultValue={partner.name}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact_name">Contact Name</Label>
            <Input
              id="edit-contact_name"
              name="contact_name"
              defaultValue={partner.contact_name ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact_email">Contact Email</Label>
            <Input
              id="edit-contact_email"
              name="contact_email"
              type="email"
              defaultValue={partner.contact_email ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contract_notes">Contract Notes</Label>
            <textarea
              id="edit-contract_notes"
              name="contract_notes"
              rows={3}
              defaultValue={partner.contract_notes ?? ''}
              placeholder="e.g., $25K, 3x LED + 2 social + suite"
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {editError && (
            <p className="text-sm text-destructive">{editError}</p>
          )}
        </form>
      </SlideOver>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {partner.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this partner and all their deliverables. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

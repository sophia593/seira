'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, FileText } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
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
import { createRecapAction } from '@/app/(app)/actions/recaps'
import type { Partner } from '@/lib/types/database'

interface PartnerActionsProps {
  partner: Partner
  eventId: string
  deliverableCount?: number
}

export function PartnerActions({ partner, eventId, deliverableCount = 0 }: PartnerActionsProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateRecap = () => {
    setIsGenerating(true)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('event_id', eventId)
      formData.append('partner_id', partner.id)

      const result = await createRecapAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to generate recap')
        setIsGenerating(false)
        return
      }
      router.push(`/events/${eventId}/partners/${partner.id}/recap/${result.id}`)
    })
  }

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
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateRecap}
          isLoading={isGenerating}
          className="border-[#C59C79] text-[#C59C79] hover:bg-[#C59C79]/5"
        >
          <FileText className="w-4 h-4 mr-1" />
          Generate Recap
        </Button>
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

      {/* Edit modal */}
      <Modal
        open={showEditDialog}
        onClose={() => { if (!isPending) setShowEditDialog(false) }}
        title="Edit Partner"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEditDialog(false)}
              disabled={isPending}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button type="submit" form="edit-partner-form" isLoading={isPending} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="edit-partner-form" ref={formRef} onSubmit={handleEdit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
            {/* Left column — 3/5 */}
            <div className="sm:col-span-3 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Partner Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={partner.name}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-contract_notes">Deal Summary</Label>
                <textarea
                  id="edit-contract_notes"
                  name="contract_notes"
                  rows={3}
                  defaultValue={partner.contract_notes ?? ''}
                  placeholder="e.g., $35K — LED boards, 2 social posts, suite"
                  className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Right column — 2/5 */}
            <div className="sm:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-contact_name">Contact Name</Label>
                <Input
                  id="edit-contact_name"
                  name="contact_name"
                  defaultValue={partner.contact_name ?? ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-contact_email">Contact Email</Label>
                <Input
                  id="edit-contact_email"
                  name="contact_email"
                  type="email"
                  defaultValue={partner.contact_email ?? ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deliverables</Label>
                <p className="text-sm text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                  {deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''} assigned
                </p>
              </div>
            </div>
          </div>

          {editError && (
            <p className="text-sm text-destructive mt-4">{editError}</p>
          )}
        </form>
      </Modal>

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

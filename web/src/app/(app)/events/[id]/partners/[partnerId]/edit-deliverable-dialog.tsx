'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { SlideOver } from '@/components/ui/slide-over'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import { updateDeliverableAction, deleteDeliverableAction } from '@/app/(app)/actions/deliverables'
import { CATEGORIES, CATEGORY_CONFIG, PROOF_REQUIRED_OPTIONS, PROOF_REQUIRED_CONFIG } from '@/lib/constants'
import type { Deliverable } from '@/lib/types/database'

interface EditDeliverableDialogProps {
  deliverable: Deliverable | null
  eventId: string
  onClose: () => void
}

export function EditDeliverableDialog({ deliverable, eventId, onClose }: EditDeliverableDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!deliverable) return
    setEditError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateDeliverableAction(
        deliverable.id,
        eventId,
        deliverable.partner_id,
        formData
      )
      if (!result.ok) {
        setEditError(result.error ?? 'Failed to update deliverable')
        return
      }
      toast.success('Deliverable updated')
      onClose()
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!deliverable) return
    setIsDeleting(true)
    try {
      const result = await deleteDeliverableAction(
        deliverable.id,
        eventId,
        deliverable.partner_id
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete deliverable')
        setIsDeleting(false)
        return
      }
      toast.success('Deliverable deleted')
      setShowDeleteConfirm(false)
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to delete deliverable')
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isPending) return
    setEditError(null)
    onClose()
  }

  return (
    <>
      <SlideOver
        open={!!deliverable}
        onClose={handleClose}
        title="Edit Deliverable"
        footer={
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" form="edit-deliverable-form" isLoading={isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        {deliverable && (
          <form id="edit-deliverable-form" ref={formRef} onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={deliverable.title}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select name="category" defaultValue={deliverable.category} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-due_date">Due Date</Label>
              <Input
                id="edit-due_date"
                name="due_date"
                type="date"
                defaultValue={deliverable.due_date ?? ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-proof_required">Proof Required</Label>
              <Select name="proof_required" defaultValue={deliverable.proof_required ?? 'photo'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select proof type" />
                </SelectTrigger>
                <SelectContent>
                  {PROOF_REQUIRED_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROOF_REQUIRED_CONFIG[p].icon} {PROOF_REQUIRED_CONFIG[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <textarea
                id="edit-notes"
                name="notes"
                rows={2}
                defaultValue={deliverable.notes ?? ''}
                className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </form>
        )}
      </SlideOver>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deliverable?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deliverable?.title}&quot;. This cannot be undone.
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

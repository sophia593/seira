'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Copy } from 'lucide-react'
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
import { SlideOver } from '@/components/ui/slide-over'
import { Modal } from '@/components/ui/modal'
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
import { useOrg } from '@/hooks/use-org'
import { updateEventAction, deleteEventAction, duplicateEventAction } from '@/app/(app)/actions/events'
import { EVENT_STATUS_FLOW, EVENT_STATUS_CONFIG } from '@/lib/constants'
import type { Event, EventStatus } from '@/lib/types/database'

interface EventActionsProps {
  event: Event
}

export function EventActions({ event }: EventActionsProps) {
  const router = useRouter()
  const { canEdit, isAdmin } = useOrg()
  const formRef = useRef<HTMLFormElement>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<EventStatus>(event.status)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('status', editStatus)

    startTransition(async () => {
      const result = await updateEventAction(event.id, formData)
      if (!result.ok) {
        setEditError(result.error ?? 'Failed to update event')
        return
      }
      toast.success('Event updated')
      setShowEditDialog(false)
      router.refresh()
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteEventAction(event.id)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete event')
        setIsDeleting(false)
        return
      }
      toast.success('Event deleted')
      router.push('/events')
      router.refresh()
    } catch {
      toast.error('Failed to delete event')
      setIsDeleting(false)
    }
  }

  const handleCopy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCopyError(null)
    setIsCopying(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await duplicateEventAction(event.id, formData)
      if (!result.ok) {
        setCopyError(result.error ?? 'Failed to duplicate event')
        setIsCopying(false)
        return
      }
      toast.success('Event duplicated')
      setShowCopyDialog(false)
      router.push(`/events/${result.id}`)
      router.refresh()
    } catch {
      setCopyError('Failed to duplicate event')
      setIsCopying(false)
    }
  }

  return (
    <>
      {canEdit && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowCopyDialog(true); setCopyError(null) }}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}

      {/* Edit slide-over */}
      <SlideOver
        open={showEditDialog}
        onClose={() => { if (!isPending) setShowEditDialog(false) }}
        title="Edit Event"
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
            <Button type="submit" form="edit-event-form" isLoading={isPending} loadingText="Saving..." className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="edit-event-form" ref={formRef} onSubmit={handleEdit} className="space-y-5">
          {/* Event Details */}
          <div className="space-y-3">
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">Event Details</p>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Event Name *</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={event.name}
                required
                autoFocus
                disabled={isPending}
              />
              <p className="text-xs text-gray-400">This is how partners will see the event</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-venue">Venue</Label>
              <Input
                id="edit-venue"
                name="venue"
                defaultValue={event.venue ?? ''}
                placeholder="e.g., Madison Square Garden"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Schedule & Status */}
          <div className="space-y-3">
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">Schedule & Status</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  defaultValue={event.date ?? ''}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as EventStatus)} disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_STATUS_FLOW.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span>{EVENT_STATUS_CONFIG[s].icon}</span>
                          <span>{EVENT_STATUS_CONFIG[s].label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <textarea
                id="edit-notes"
                name="notes"
                rows={3}
                defaultValue={event.notes ?? ''}
                placeholder="Optional notes..."
                disabled={isPending}
                className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {editError && (
            <p className="text-sm text-destructive">{editError}</p>
          )}
        </form>
      </SlideOver>

      {/* Copy event modal */}
      <Modal
        open={showCopyDialog}
        onClose={() => { if (!isCopying) setShowCopyDialog(false) }}
        title="Copy Event"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCopyDialog(false)}
              disabled={isCopying}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button type="submit" form="copy-event-form" isLoading={isCopying} loadingText="Duplicating..." className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
              Duplicate Event
            </Button>
          </div>
        }
      >
        <form id="copy-event-form" onSubmit={handleCopy} className="space-y-4">
          <p className="text-sm text-gray-500">
            This will create a new event with the same partners and deliverable structure. All statuses will be reset and no proof will be carried over.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="copy-name">Event Name *</Label>
            <Input
              id="copy-name"
              name="name"
              defaultValue={`${event.name} (Copy)`}
              required
              autoFocus
              disabled={isCopying}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="copy-date">Date</Label>
            <Input
              id="copy-date"
              name="date"
              type="date"
              defaultValue=""
              disabled={isCopying}
            />
          </div>
          {copyError && (
            <p className="text-sm text-destructive">{copyError}</p>
          )}
        </form>
      </Modal>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will delete all partners and deliverables for this event.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

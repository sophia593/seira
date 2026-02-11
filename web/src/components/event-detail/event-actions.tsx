'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
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
import { updateEventAction, deleteEventAction } from '@/app/(app)/actions/events'
import { EVENT_STATUS_FLOW, EVENT_STATUS_CONFIG } from '@/lib/constants'
import type { Event, EventStatus } from '@/lib/types/database'

interface EventActionsProps {
  event: Event
}

export function EventActions({ event }: EventActionsProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<EventStatus>(event.status)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

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
    } catch {
      toast.error('Failed to delete event')
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
        title="Edit Event"
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
            <Button type="submit" form="edit-event-form" isLoading={isPending}>
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="edit-event-form" ref={formRef} onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Event Name *</Label>
            <Input
              id="edit-name"
              name="name"
              defaultValue={event.name}
              required
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                name="date"
                type="date"
                defaultValue={event.date ?? ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as EventStatus)}>
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

          <div className="space-y-2">
            <Label htmlFor="edit-venue">Venue</Label>
            <Input
              id="edit-venue"
              name="venue"
              defaultValue={event.venue ?? ''}
              placeholder="e.g., Madison Square Garden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea
              id="edit-notes"
              name="notes"
              rows={3}
              defaultValue={event.notes ?? ''}
              placeholder="Optional notes..."
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

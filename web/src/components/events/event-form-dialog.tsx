'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import { createEventAction, updateEventAction } from '@/app/(app)/actions'
import { EVENT_STATUS_FLOW, EVENT_STATUS_CONFIG, DEFAULT_EVENT_STATUS } from '@/lib/constants'
import type { Event, EventStatus } from '@/lib/types/database'

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  event?: Event // If provided, edit mode
  onSuccess?: () => void
}

export function EventFormDialog({
  open,
  onOpenChange,
  orgId,
  event,
  onSuccess,
}: EventFormDialogProps) {
  const router = useRouter()
  const isEdit = !!event

  const [name, setName] = useState(event?.name ?? '')
  const [date, setDate] = useState(event?.date ?? '')
  const [venue, setVenue] = useState(event?.venue ?? '')
  const [status, setStatus] = useState<EventStatus>(event?.status ?? DEFAULT_EVENT_STATUS)
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Event name is required')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEdit && event) {
        const result = await updateEventAction(event.id, {
          name: name.trim(),
          date: date || undefined,
          venue: venue.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Event updated')
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        const result = await createEventAction({
          name: name.trim(),
          date: date || undefined,
          venue: venue.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Event created')
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/events/${result.data?.id}`)
        }
      }
    } catch (error) {
      toast.error(isEdit ? 'Failed to update event' : 'Failed to create event')
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
        setDate('')
        setVenue('')
        setStatus(DEFAULT_EVENT_STATUS)
        setNotes('')
      }
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {isEdit ? 'Edit Event' : 'New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Opening Night 2026"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
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
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g., Madison Square Garden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
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
              {isEdit ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SlideOver } from '@/components/ui/slide-over'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createEventAction } from '@/app/(app)/actions/events'

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleClose = () => {
    if (isPending) return
    formRef.current?.reset()
    setError(null)
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createEventAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to create event')
        return
      }
      formRef.current?.reset()
      setError(null)
      onOpenChange(false)
      if (result.id) {
        router.push(`/events/${result.id}`)
      }
      router.refresh()
    })
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="New Event"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            type="submit"
            form="create-event-form"
            isLoading={isPending}
            loadingText="Creating..."
            className="bg-kurobeni text-white hover:bg-blackberry rounded-md"
          >
            Create Event
          </Button>
        </div>
      }
    >
      <form
        id="create-event-form"
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Event Details */}
        <div className="space-y-3">
          <p className="text-[10px] tracking-widest text-gray-400 uppercase">Event Details</p>
          <div className="space-y-1.5">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Legends Cup — Opening Night"
              required
              autoFocus
              disabled={isPending}
            />
            <p className="text-xs text-gray-400">This is how partners will see the event</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              name="venue"
              placeholder="e.g., Madison Square Garden"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Schedule & Notes */}
        <div className="space-y-3">
          <p className="text-[10px] tracking-widest text-gray-400 uppercase">Schedule & Notes</p>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="text" placeholder="YYYY-MM-DD" disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Optional notes..."
              disabled={isPending}
              className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </form>
    </SlideOver>
  )
}

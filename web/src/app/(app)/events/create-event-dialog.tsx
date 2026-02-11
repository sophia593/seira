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
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-event-form"
            isLoading={isPending}
            loadingText="Creating..."
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
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Event Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Opening Night 2026"
            required
            autoFocus
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" disabled={isPending} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue">Venue</Label>
          <Input
            id="venue"
            name="venue"
            placeholder="e.g., Madison Square Garden"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Optional notes..."
            disabled={isPending}
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </form>
    </SlideOver>
  )
}

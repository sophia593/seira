'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SlideOver } from '@/components/ui/slide-over'
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
import { createDeliverableAction } from '@/app/(app)/actions/deliverables'
import { CATEGORIES, CATEGORY_CONFIG, PROOF_REQUIRED_OPTIONS, PROOF_REQUIRED_CONFIG } from '@/lib/constants'

interface AddDeliverableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  partnerId: string
}

export function AddDeliverableDialog({ open, onOpenChange, eventId, partnerId }: AddDeliverableDialogProps) {
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
      const result = await createDeliverableAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to add deliverable')
        return
      }
      formRef.current?.reset()
      setError(null)
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="New Deliverable"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="add-deliverable-form" isLoading={isPending}>
            Add Deliverable
          </Button>
        </div>
      }
    >
      <form id="add-deliverable-form" ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="partner_id" value={partnerId} />
        <input type="hidden" name="event_id" value={eventId} />

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g., LED board rotation"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select name="category" required>
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
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proof_required">Proof Required</Label>
          <Select name="proof_required" defaultValue="photo">
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
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="e.g., 30-second rotation during 3rd–7th innings"
            className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </form>
    </SlideOver>
  )
}

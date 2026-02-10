'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
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
import { createPartnerAction } from '@/app/(app)/actions/partners'

interface AddPartnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

export function AddPartnerDialog({ open, onOpenChange, eventId }: AddPartnerDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createPartnerAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to add partner')
        return
      }
      onOpenChange(false)
      router.refresh()
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      formRef.current?.reset()
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Partner
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="event_id" value={eventId} />

          <div className="space-y-2">
            <Label htmlFor="name">Partner Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Metro Credit Union"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              name="contact_name"
              placeholder="e.g., Jane Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              placeholder="e.g., jane@metrocu.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_notes">Contract Notes</Label>
            <textarea
              id="contract_notes"
              name="contract_notes"
              rows={3}
              placeholder="e.g., $25K, 3x LED + 2 social + suite"
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Add Partner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

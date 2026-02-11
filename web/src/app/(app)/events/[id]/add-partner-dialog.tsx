'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
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
      const result = await createPartnerAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to add partner')
        return
      }
      formRef.current?.reset()
      setError(null)
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Partner"
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
          <Button type="submit" form="add-partner-form" isLoading={isPending} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
            Add Partner
          </Button>
        </div>
      }
    >
      <form id="add-partner-form" ref={formRef} onSubmit={handleSubmit}>
        <input type="hidden" name="event_id" value={eventId} />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
          {/* Left column — 3/5 */}
          <div className="sm:col-span-3 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Partner Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Metro Credit Union"
                required
                autoFocus
              />
              <p className="text-xs text-gray-400">The sponsor or partner organization</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contract_notes">Deal Summary</Label>
              <textarea
                id="contract_notes"
                name="contract_notes"
                rows={3}
                placeholder="e.g., $25K — 3x LED, 2 social, suite"
                className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Right column — 2/5 */}
          <div className="sm:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                name="contact_name"
                placeholder="e.g., Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="e.g., jane@metrocu.com"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive mt-4">{error}</p>
        )}
      </form>
    </Modal>
  )
}

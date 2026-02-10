'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
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
import { createDeliverableAction, updateDeliverableAction } from '@/app/(app)/actions'
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  STATUS_FLOW,
  STATUS_CONFIG,
  PROOF_REQUIRED_OPTIONS,
  PROOF_REQUIRED_CONFIG,
  DEFAULT_DELIVERABLE_STATUS,
  DEFAULT_PROOF_REQUIRED,
} from '@/lib/constants'
import type { Deliverable, DeliverableCategory, DeliverableStatus, ProofRequired } from '@/lib/types/database'

interface DeliverableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  eventId: string
  deliverable?: Deliverable // If provided, edit mode
  onSuccess?: () => void
}

export function DeliverableFormDialog({
  open,
  onOpenChange,
  partnerId,
  eventId,
  deliverable,
  onSuccess,
}: DeliverableFormDialogProps) {
  const router = useRouter()
  const isEdit = !!deliverable

  const [title, setTitle] = useState(deliverable?.title ?? '')
  const [category, setCategory] = useState<DeliverableCategory>(
    deliverable?.category ?? 'digital'
  )
  const [dueDate, setDueDate] = useState(deliverable?.due_date ?? '')
  const [status, setStatus] = useState<DeliverableStatus>(
    deliverable?.status ?? DEFAULT_DELIVERABLE_STATUS
  )
  const [proofRequired, setProofRequired] = useState<ProofRequired>(
    deliverable?.proof_required ?? DEFAULT_PROOF_REQUIRED
  )
  const [notes, setNotes] = useState(deliverable?.notes ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEdit && deliverable) {
        const result = await updateDeliverableAction(
          deliverable.id,
          eventId,
          partnerId,
          {
            title: title.trim(),
            category,
            due_date: dueDate || undefined,
            status,
            proof_required: proofRequired,
            notes: notes.trim() || undefined,
          }
        )
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Deliverable updated')
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        const result = await createDeliverableAction({
          partner_id: partnerId,
          event_id: eventId,
          title: title.trim(),
          category,
          due_date: dueDate || undefined,
          status,
          proof_required: proofRequired,
          notes: notes.trim() || undefined,
        })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Deliverable created')
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      }
    } catch (error) {
      toast.error(isEdit ? 'Failed to update deliverable' : 'Failed to create deliverable')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open && !isEdit) {
      setTitle('')
      setCategory('digital')
      setDueDate('')
      setStatus(DEFAULT_DELIVERABLE_STATUS)
      setProofRequired(DEFAULT_PROOF_REQUIRED)
      setNotes('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {isEdit ? 'Edit Deliverable' : 'Add Deliverable'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., LED Board Display"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as DeliverableCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        <span>{CATEGORY_CONFIG[cat].icon}</span>
                        <span>{CATEGORY_CONFIG[cat].label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as DeliverableStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span>{STATUS_CONFIG[s].icon}</span>
                        <span>{STATUS_CONFIG[s].label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proofRequired">Proof Type</Label>
              <Select
                value={proofRequired}
                onValueChange={(v) => setProofRequired(v as ProofRequired)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROOF_REQUIRED_OPTIONS.map((pr) => (
                    <SelectItem key={pr} value={pr}>
                      <span className="flex items-center gap-2">
                        <span>{PROOF_REQUIRED_CONFIG[pr].icon}</span>
                        <span>{PROOF_REQUIRED_CONFIG[pr].label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {isEdit ? 'Save Changes' : 'Add Deliverable'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

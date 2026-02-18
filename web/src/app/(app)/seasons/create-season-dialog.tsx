'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SlideOver } from '@/components/ui/slide-over'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSeasonAction } from '@/app/(app)/actions/seasons'
import { toast } from '@/components/ui/sonner'

interface CreateSeasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSeasonDialog({ open, onOpenChange }: CreateSeasonDialogProps) {
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
      const result = await createSeasonAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to create season')
        return
      }
      formRef.current?.reset()
      setError(null)
      toast.success('Season created')
      onOpenChange(false)
      if (result.id) {
        router.push(`/seasons/${result.id}`)
      }
      router.refresh()
    })
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="New Season"
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
            form="create-season-form"
            isLoading={isPending}
            loadingText="Creating..."
            className="bg-kurobeni text-white hover:bg-blackberry rounded-md"
          >
            Create Season
          </Button>
        </div>
      }
    >
      <form
        id="create-season-form"
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Season Details */}
        <div className="space-y-3">
          <p className="text-[10px] tracking-widest text-gray-400 uppercase">Season Details</p>
          <div className="space-y-1.5">
            <Label htmlFor="name">Season Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., 2025 NBA Season"
              required
              autoFocus
              disabled={isPending}
            />
            <p className="text-xs text-gray-400">Group related events under this season</p>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <p className="text-[10px] tracking-widest text-gray-400 uppercase">Date Range</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" name="start_date" type="date" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" name="end_date" type="date" disabled={isPending} />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </form>
    </SlideOver>
  )
}

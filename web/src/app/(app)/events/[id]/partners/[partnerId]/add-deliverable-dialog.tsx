'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
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
import { CategoryBadge } from '@/components/ui/badges'
import { createDeliverableAction } from '@/app/(app)/actions/deliverables'
import { applyTemplateAction } from '@/app/(app)/actions/templates'
import { toast } from '@/components/ui/sonner'
import { CATEGORIES, CATEGORY_CONFIG, PROOF_REQUIRED_OPTIONS, PROOF_REQUIRED_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Template } from '@/lib/types/database'

const INDUSTRY_LABEL: Record<string, string> = {
  sports: 'Sports',
  venue: 'Venue',
  festival: 'Festival',
  film: 'Film',
}

interface AddDeliverableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  partnerId: string
  templates?: Template[]
}

export function AddDeliverableDialog({ open, onOpenChange, eventId, partnerId, templates = [] }: AddDeliverableDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'manual' | 'template'>('manual')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  const handleClose = () => {
    if (isPending) return
    formRef.current?.reset()
    setError(null)
    setSelectedTemplate(null)
    setMode('manual')
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
      toast.success('Deliverable added')
      router.refresh()
    })
  }

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return
    setError(null)

    const formData = new FormData()
    formData.set('template_id', selectedTemplate.id)
    formData.set('partner_id', partnerId)
    formData.set('event_id', eventId)

    startTransition(async () => {
      const result = await applyTemplateAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to apply template')
        return
      }
      setSelectedTemplate(null)
      setMode('manual')
      onOpenChange(false)
      toast.success(`Added ${result.count} deliverables from template`)
      router.refresh()
    })
  }

  const hasTemplates = templates.length > 0

  const footer = mode === 'manual' ? (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={handleClose}
        disabled={isPending}
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <Button type="submit" form="add-deliverable-form" isLoading={isPending} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
        Add Deliverable
      </Button>
    </div>
  ) : (
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
        onClick={handleApplyTemplate}
        disabled={!selectedTemplate}
        isLoading={isPending}
        className="bg-kurobeni text-white hover:bg-blackberry rounded-md"
      >
        {selectedTemplate ? `Apply (${selectedTemplate.deliverables.length})` : 'Select a template'}
      </Button>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Deliverable"
      footer={footer}
    >
      {/* Tab toggle */}
      {hasTemplates && (
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setMode('manual'); setSelectedTemplate(null); setError(null) }}
            className={cn(
              'flex-1 text-sm font-medium py-1.5 rounded-md transition-colors',
              mode === 'manual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => { setMode('template'); setError(null) }}
            className={cn(
              'flex-1 text-sm font-medium py-1.5 rounded-md transition-colors',
              mode === 'template'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            From Template
          </button>
        </div>
      )}

      {/* Manual form */}
      {mode === 'manual' && (
        <form id="add-deliverable-form" ref={formRef} onSubmit={handleSubmit}>
          <input type="hidden" name="partner_id" value={partnerId} />
          <input type="hidden" name="event_id" value={eventId} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
            {/* Left column — 3/5 */}
            <div className="sm:col-span-3 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., LED board rotation"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400">A short name for the deliverable</p>
              </div>
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="e.g., 30-second rotation during breaks"
                  className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Right column — 2/5 */}
            <div className="sm:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                />
              </div>
              <div className="space-y-1.5">
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
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive mt-4">{error}</p>
          )}
        </form>
      )}

      {/* Template picker */}
      {mode === 'template' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Pick a template to add all its deliverables at once.
          </p>

          <div className="space-y-2">
            {templates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id
              const count = template.deliverables.length
              const preview = template.deliverables.slice(0, 3).map((d) => d.title).join(', ')
              const more = count > 3 ? ` +${count - 3} more` : ''

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(isSelected ? null : template)}
                  className={cn(
                    'w-full text-left rounded-lg border p-4 transition-colors',
                    isSelected
                      ? 'border-copper bg-copper/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {template.name}
                      </span>
                      {template.industry && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                          {INDUSTRY_LABEL[template.industry] ?? template.industry}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{count} items</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {preview}{more}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Selected template preview */}
          {selectedTemplate && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Preview — {selectedTemplate.deliverables.length} deliverables
              </p>
              <div className="space-y-1.5">
                {selectedTemplate.deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-700">{d.title}</span>
                    <CategoryBadge category={d.category} showIcon={false} className="text-[10px] px-1.5 py-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {templates.length === 0 && (
            <p className="text-sm text-gray-400 py-6 text-center">
              No templates available. Seed sample data to get started.
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive mt-4">{error}</p>
          )}
        </div>
      )}
    </Modal>
  )
}

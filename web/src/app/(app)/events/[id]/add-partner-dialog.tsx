'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Check, Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPartnerAction } from '@/app/(app)/actions/partners'
import { toast } from '@/components/ui/sonner'
import { CATEGORY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { TemplateOption } from './partner-section'
import type { DeliverableCategory, ProofRequired, TemplateDeliverable } from '@/lib/types/database'

const CATEGORIES: DeliverableCategory[] = ['in-venue', 'digital', 'hospitality', 'signage', 'talent', 'content']
const PROOF_TYPES: { value: ProofRequired; label: string }[] = [
  { value: 'photo', label: 'Photo' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'file', label: 'File' },
  { value: 'link', label: 'Link' },
  { value: 'multiple', label: 'Multiple' },
]

function emptyDeliverable(): TemplateDeliverable {
  return { title: '', category: 'in-venue', proof_required: 'photo' }
}

interface AddPartnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  templates?: TemplateOption[]
}

export function AddPartnerDialog({ open, onOpenChange, eventId, templates }: AddPartnerDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [draftDeliverables, setDraftDeliverables] = useState<TemplateDeliverable[]>([])

  const handleClose = () => {
    if (isPending) return
    formRef.current?.reset()
    setSelectedTemplateId('')
    setDraftDeliverables([])
    setError(null)
    onOpenChange(false)
  }

  const selectTemplate = (templateId: string) => {
    if (templateId === selectedTemplateId) return
    setSelectedTemplateId(templateId)
    if (!templateId) {
      setDraftDeliverables([])
      return
    }
    const template = templates?.find((t) => t.id === templateId)
    if (template) {
      setDraftDeliverables(template.deliverables.map((d) => ({ ...d })))
    }
  }

  const addRow = () => {
    setDraftDeliverables([...draftDeliverables, emptyDeliverable()])
  }

  const removeRow = (index: number) => {
    setDraftDeliverables(draftDeliverables.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof TemplateDeliverable, value: string) => {
    setDraftDeliverables(
      draftDeliverables.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Attach deliverables as JSON
    const validDeliverables = draftDeliverables.filter((d) => d.title.trim())
    if (validDeliverables.length > 0) {
      formData.set('deliverables', JSON.stringify(validDeliverables))
    }

    startTransition(async () => {
      const result = await createPartnerAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to add partner')
        return
      }
      const templateName = templates?.find((t) => t.id === selectedTemplateId)?.name
      const count = validDeliverables.length
      formRef.current?.reset()
      setSelectedTemplateId('')
      setDraftDeliverables([])
      setError(null)
      onOpenChange(false)
      toast.success(
        count > 0
          ? `Partner added with ${count} deliverable${count !== 1 ? 's' : ''}${templateName ? ` from "${templateName}"` : ''}`
          : 'Partner added'
      )
      if (result.id) {
        router.push(`/events/${eventId}/partners/${result.id}`)
      }
      router.refresh()
    })
  }

  const hasTemplates = templates && templates.length > 0

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
                placeholder="e.g., Apex Financial Group"
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
                placeholder="e.g., $35K — LED boards, 2 social posts, suite"
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
                placeholder="e.g., Dana Reyes"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="e.g., dreyes@apexfg.com"
              />
            </div>
          </div>
        </div>

        {/* Template selector */}
        {hasTemplates && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <Label className="mb-2 block">Start from template</Label>
            <p className="text-xs text-gray-400 mb-3">
              Pre-fill deliverables from a template. You can edit them before saving.
            </p>
            <div className="flex flex-wrap gap-2">
              {/* No template option */}
              <button
                type="button"
                onClick={() => selectTemplate('')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                  !selectedTemplateId
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                {!selectedTemplateId && <Check className="h-3.5 w-3.5" />}
                Blank
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                    selectedTemplateId === t.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {selectedTemplateId === t.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  <span>{t.name}</span>
                  <span className={cn(
                    'text-xs',
                    selectedTemplateId === t.id ? 'text-white/60' : 'text-gray-400'
                  )}>
                    {t.deliverableCount}
                  </span>
                </button>
              ))}
            </div>

            {/* Editable deliverable drafts */}
            {draftDeliverables.length > 0 && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Deliverables ({draftDeliverables.length})
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={addRow} className="h-6 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Add row
                  </Button>
                </div>

                <div className="space-y-3 max-h-[240px] overflow-y-auto">
                  {draftDeliverables.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          value={d.title}
                          onChange={(e) => updateRow(i, 'title', e.target.value)}
                          placeholder="Deliverable title"
                          className="flex-1 h-8 text-sm"
                        />
                        <select
                          value={d.category}
                          onChange={(e) => updateRow(i, 'category', e.target.value)}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs w-28"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {CATEGORY_CONFIG[cat]?.icon} {CATEGORY_CONFIG[cat]?.label ?? cat}
                            </option>
                          ))}
                        </select>
                        <select
                          value={d.proof_required}
                          onChange={(e) => updateRow(i, 'proof_required', e.target.value)}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs w-24"
                        >
                          {PROOF_TYPES.map((pt) => (
                            <option key={pt.value} value={pt.value}>
                              {pt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-50 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <Input
                        value={d.notes ?? ''}
                        onChange={(e) => updateRow(i, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                        className="h-7 text-xs text-gray-500 border-dashed ml-0.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive mt-4">{error}</p>
        )}
      </form>
    </Modal>
  )
}

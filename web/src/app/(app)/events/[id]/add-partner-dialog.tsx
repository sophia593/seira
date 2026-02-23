'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Check, Plus, Trash2, Sparkles, Loader2, Pencil, X } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPartnerAction } from '@/app/(app)/actions/partners'
import { useOrg } from '@/hooks/use-org'
import { toast } from '@/components/ui/sonner'
import { CATEGORY_CONFIG, PROOF_REQUIRED_CONFIG } from '@/lib/constants'
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
  const { orgId } = useOrg()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [draftDeliverables, setDraftDeliverables] = useState<TemplateDeliverable[]>([])
  const [isAiSuggesting, setIsAiSuggesting] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [aiSuggested, setAiSuggested] = useState(false)

  const handleClose = () => {
    if (isPending) return
    formRef.current?.reset()
    setSelectedTemplateId('')
    setDraftDeliverables([])
    setEditingIndex(null)
    setAiSuggested(false)
    setError(null)
    onOpenChange(false)
  }

  const selectTemplate = (templateId: string) => {
    if (templateId === selectedTemplateId) return
    setSelectedTemplateId(templateId)
    setEditingIndex(null)
    setAiSuggested(false)
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

  const findMatchingTemplate = (text: string): TemplateOption | null => {
    if (!templates || templates.length === 0) return null
    const lower = text.toLowerCase()
    // Match if the deal text contains a template name (or vice versa)
    return templates.find((t) => {
      const tName = t.name.toLowerCase()
      // "sports package" in "standard sports package deal" → match
      // "sports" in "LED boards for sports event" → match on keyword
      const keyword = tName.replace(/\s*(package|template|bundle)\s*/gi, '').trim()
      return lower.includes(tName) || (keyword.length >= 4 && lower.includes(keyword))
    }) ?? null
  }

  const handleAiSuggest = async () => {
    if (!orgId) return
    const textarea = formRef.current?.querySelector<HTMLTextAreaElement>('#contract_notes')
    const dealText = textarea?.value?.trim()
    if (!dealText) {
      toast.error('Describe the deal first, then we can suggest deliverables')
      return
    }

    // Fast path: if the deal text matches a template name, use it directly
    const matched = findMatchingTemplate(dealText)
    if (matched && matched.deliverables.length > 0) {
      setDraftDeliverables(matched.deliverables.map((d) => ({ ...d })))
      setSelectedTemplateId(matched.id)
      setEditingIndex(null)
      setAiSuggested(false)
      toast.success(`Matched "${matched.name}" — ${matched.deliverables.length} deliverables`)
      return
    }

    setIsAiSuggesting(true)
    try {
      const res = await fetch('/api/agents/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: dealText, org_id: orgId }),
      })

      if (!res.ok) throw new Error('Agent request failed')

      const data = await res.json()
      if (data.response) {
        const parsed = JSON.parse(data.response)
        if (parsed.deliverables && Array.isArray(parsed.deliverables)) {
          const valid = parsed.deliverables
            .filter((d: Record<string, unknown>) => d.title && d.category && d.proof_required)
            .map((d: Record<string, unknown>) => ({
              title: String(d.title),
              category: CATEGORIES.includes(d.category as DeliverableCategory)
                ? (d.category as DeliverableCategory)
                : 'in-venue' as DeliverableCategory,
              proof_required: PROOF_TYPES.some((pt) => pt.value === d.proof_required)
                ? (d.proof_required as ProofRequired)
                : 'photo' as ProofRequired,
              notes: d.notes ? String(d.notes) : undefined,
            }))

          if (valid.length > 0) {
            setDraftDeliverables(valid)
            setSelectedTemplateId('')
            setEditingIndex(null)
            setAiSuggested(true)
            toast.success(`${valid.length} deliverable${valid.length !== 1 ? 's' : ''} suggested`)
          } else {
            toast.error('No valid deliverables in response — try being more specific')
          }
        }
      }
    } catch {
      toast.error('Failed to suggest deliverables — you can still add them manually')
    } finally {
      setIsAiSuggesting(false)
    }
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
      setEditingIndex(null)
      setAiSuggested(false)
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
              <div className="flex items-center justify-between">
                <Label htmlFor="contract_notes">Deal Summary</Label>
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={isAiSuggesting || isPending}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-copper hover:text-copper/80 hover:bg-copper/5 transition-colors disabled:opacity-50"
                >
                  {isAiSuggesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isAiSuggesting ? 'Suggesting...' : 'Suggest deliverables'}
                </button>
              </div>
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
            <div className="space-y-1.5">
              <Label htmlFor="deal_value">Deal Value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <Input
                  id="deal_value"
                  name="deal_value"
                  type="number"
                  min={0}
                  placeholder="35000"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="renewal_date">Renewal Date</Label>
              <Input
                id="renewal_date"
                name="renewal_date"
                type="date"
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
          </div>
        )}

        {/* Draft deliverable cards */}
        {draftDeliverables.length > 0 && (
          <div className={cn('animate-in fade-in slide-in-from-top-1 duration-200', hasTemplates ? 'mt-4 px-0' : 'mt-6 pt-5 border-t border-gray-100')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Deliverables ({draftDeliverables.length})
                </span>
                {aiSuggested && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-copper/10 px-2 py-0.5 text-[10px] font-medium text-copper">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI suggested
                  </span>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => { addRow(); setEditingIndex(draftDeliverables.length) }} className="h-6 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {draftDeliverables.map((d, i) => {
                const catConfig = CATEGORY_CONFIG[d.category]
                const proofConfig = PROOF_REQUIRED_CONFIG[d.proof_required]
                const isEditing = editingIndex === i

                return (
                  <div
                    key={i}
                    className={cn(
                      'rounded-lg border p-3 transition-all',
                      isEditing
                        ? 'border-gray-300 bg-gray-50/50 ring-1 ring-gray-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    {isEditing ? (
                      /* ---- Edit mode ---- */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={d.title}
                            onChange={(e) => updateRow(i, 'title', e.target.value)}
                            placeholder="Deliverable title"
                            className="flex-1 h-8 text-sm"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-green-600 hover:bg-green-50 transition-colors shrink-0"
                            title="Done editing"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={d.category}
                            onChange={(e) => updateRow(i, 'category', e.target.value)}
                            className="h-7 rounded-md border border-input bg-background px-2 text-xs flex-1"
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
                            className="h-7 rounded-md border border-input bg-background px-2 text-xs flex-1"
                          >
                            {PROOF_TYPES.map((pt) => (
                              <option key={pt.value} value={pt.value}>
                                {pt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          value={d.notes ?? ''}
                          onChange={(e) => updateRow(i, 'notes', e.target.value)}
                          placeholder="Notes (optional)"
                          className="h-7 text-xs text-gray-500 border-dashed"
                        />
                      </div>
                    ) : (
                      /* ---- Display mode ---- */
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{d.title || 'Untitled'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', catConfig?.bgColor, catConfig?.color)}>
                              {catConfig?.icon} {catConfig?.label}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {proofConfig?.icon} {proofConfig?.label}
                            </span>
                          </div>
                          {d.notes && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{d.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingIndex(i)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { removeRow(i); if (editingIndex === i) setEditingIndex(null) }}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive mt-4">{error}</p>
        )}
      </form>
    </Modal>
  )
}

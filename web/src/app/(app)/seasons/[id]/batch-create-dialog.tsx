'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus, Trash2, FileText, AlertTriangle, Loader2 } from 'lucide-react'
import { SlideOver } from '@/components/ui/slide-over'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProgressBar } from '@/components/ui/progress-bar'
import { toast } from '@/components/ui/sonner'
import { batchCreateForEventAction } from '@/app/(app)/actions/batch'
import { resolveDate, DATE_RULE_OPTIONS } from '@/lib/date-rules'
import type { DateRule } from '@/lib/date-rules'
import { CATEGORY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DeliverableCategory, ProofRequired, TemplateDeliverable } from '@/lib/types/database'

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateOption {
  id: string
  name: string
  deliverableCount: number
  isGlobal: boolean
  deliverables: { title: string; category: DeliverableCategory; proof_required: ProofRequired; notes?: string }[]
}

interface EventOption {
  id: string
  name: string
  date: string | null
}

interface BatchCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: EventOption[]
  templates: TemplateOption[]
}

interface DateRuleSetting {
  rule: DateRule
  customDate?: string
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = ['Template', 'Dates', 'Preview', 'Creating']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-5">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const isActive = step === current
        const isDone = step < current
        return (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div
              className={cn(
                'h-6 w-6 rounded-full text-xs font-medium flex items-center justify-center shrink-0 transition-colors',
                isActive ? 'bg-gray-900 text-white' :
                isDone ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-400'
              )}
            >
              {isDone ? <Check className="w-3 h-3" /> : step}
            </div>
            <span className={cn('text-xs truncate', isActive ? 'text-gray-900 font-medium' : 'text-gray-400')}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className="h-px flex-1 bg-gray-100 mx-1" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function BatchCreateDialog({ open, onOpenChange, events, templates }: BatchCreateDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1: template + deliverables
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [draftDeliverables, setDraftDeliverables] = useState<TemplateDeliverable[]>([])

  // Step 2: date rules
  const [dateRules, setDateRules] = useState<Record<number, DateRuleSetting>>({})

  // Step 3: events + partner
  const [checkedEventIds, setCheckedEventIds] = useState<Set<string>>(() => new Set(events.map((e) => e.id)))
  const [partnerName, setPartnerName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Step 4: progress
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)
  const [errors, setErrors] = useState<{ event: string; error?: string }[]>([])
  const [isDone, setIsDone] = useState(false)

  // ── Helpers ──

  const reset = () => {
    setStep(1)
    setSelectedTemplateId('')
    setDraftDeliverables([])
    setDateRules({})
    setCheckedEventIds(new Set(events.map((e) => e.id)))
    setPartnerName('')
    setContactName('')
    setContactEmail('')
    setCompleted(0)
    setTotal(0)
    setErrors([])
    setIsDone(false)
  }

  const handleClose = () => {
    if (step === 4 && !isDone) return // Don't close while creating
    reset()
    onOpenChange(false)
  }

  const selectTemplate = (templateId: string) => {
    if (templateId === selectedTemplateId) return
    setSelectedTemplateId(templateId)
    if (!templateId) {
      setDraftDeliverables([])
      return
    }
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setDraftDeliverables(template.deliverables.map((d) => ({ ...d })))
    }
  }

  const addRow = () => setDraftDeliverables([...draftDeliverables, emptyDeliverable()])
  const removeRow = (i: number) => setDraftDeliverables(draftDeliverables.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: keyof TemplateDeliverable, value: string) => {
    setDraftDeliverables(draftDeliverables.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)))
  }

  const updateDateRule = (i: number, rule: DateRule) => {
    setDateRules({ ...dateRules, [i]: { ...dateRules[i], rule } })
  }
  const updateCustomDate = (i: number, customDate: string) => {
    setDateRules({ ...dateRules, [i]: { ...dateRules[i], rule: 'custom', customDate } })
  }

  const toggleEvent = (id: string) => {
    setCheckedEventIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (checkedEventIds.size === events.length) setCheckedEventIds(new Set())
    else setCheckedEventIds(new Set(events.map((e) => e.id)))
  }

  // ── Validation ──

  const validDeliverables = draftDeliverables.filter((d) => d.title.trim())
  const selectedEvents = events.filter((e) => checkedEventIds.has(e.id))
  const hasRelativeRules = Object.values(dateRules).some((r) => r.rule !== 'none' && r.rule !== 'custom')
  const eventsWithoutDate = selectedEvents.filter((e) => !e.date)

  const canGoToStep2 = validDeliverables.length > 0
  const canGoToStep3 = true // date rules are always valid (default = none)
  const canSubmit = selectedEvents.length > 0 && partnerName.trim().length > 0

  // ── Batch submit ──

  const handleBatchCreate = async () => {
    setStep(4)
    const targetEvents = selectedEvents
    setTotal(targetEvents.length)
    setCompleted(0)
    setErrors([])
    setIsDone(false)

    for (const event of targetEvents) {
      const resolvedDeliverables = validDeliverables.map((d, i) => ({
        title: d.title,
        category: d.category,
        proof_required: d.proof_required,
        notes: d.notes ?? null,
        due_date: resolveDate(dateRules[i]?.rule ?? 'none', event.date, dateRules[i]?.customDate),
      }))

      const formData = new FormData()
      formData.set('event_id', event.id)
      formData.set('partner_name', partnerName.trim())
      if (contactName.trim()) formData.set('contact_name', contactName.trim())
      if (contactEmail.trim()) formData.set('contact_email', contactEmail.trim())
      formData.set('deliverables', JSON.stringify(resolvedDeliverables))

      const result = await batchCreateForEventAction(formData)
      if (!result.ok) {
        setErrors((prev) => [...prev, { event: event.name, error: result.error }])
      }
      setCompleted((prev) => prev + 1)
    }

    setIsDone(true)
    router.refresh()
  }

  // ── Footer ──

  let footer: React.ReactNode = null

  if (step === 1) {
    footer = (
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={handleClose} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Cancel
        </button>
        <Button onClick={() => setStep(2)} disabled={!canGoToStep2} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
          Next: Dates
        </Button>
      </div>
    )
  } else if (step === 2) {
    footer = (
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Back
        </button>
        <Button onClick={() => setStep(3)} disabled={!canGoToStep3} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
          Next: Preview
        </Button>
      </div>
    )
  } else if (step === 3) {
    footer = (
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Back
        </button>
        <Button onClick={handleBatchCreate} disabled={!canSubmit} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
          Create ({selectedEvents.length} events &times; {validDeliverables.length} deliverables)
        </Button>
      </div>
    )
  } else if (step === 4 && isDone) {
    footer = (
      <div className="flex items-center justify-end">
        <Button onClick={handleClose} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
          Done
        </Button>
      </div>
    )
  }

  // ── Render ──

  return (
    <SlideOver open={open} onClose={handleClose} title="Batch Create Deliverables" footer={footer}>
      <StepIndicator current={step} />

      {/* ════════════ Step 1: Template & Deliverables ════════════ */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Choose a template or build from scratch. Edit rows before continuing.</p>

          {/* Template chips */}
          {templates.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
                  <span className={cn('text-xs', selectedTemplateId === t.id ? 'text-white/60' : 'text-gray-400')}>
                    {t.deliverableCount}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Deliverable rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Deliverables ({draftDeliverables.length})
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={addRow} className="h-6 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add row
              </Button>
            </div>

            {draftDeliverables.length === 0 ? (
              <button
                type="button"
                onClick={addRow}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg py-6 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
              >
                <Plus className="w-4 h-4 mx-auto mb-1" />
                Add a deliverable
              </button>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto">
                {draftDeliverables.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        value={d.title}
                        onChange={(e) => updateRow(i, 'title', e.target.value)}
                        placeholder="Deliverable title"
                        className="flex-1 h-8 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-50 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {draftDeliverables.length > 0 && validDeliverables.length === 0 && (
            <p className="text-xs text-amber-500">Add a title to at least one deliverable to continue.</p>
          )}
        </div>
      )}

      {/* ════════════ Step 2: Smart Dates ════════════ */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Set a date rule for each deliverable. Dates resolve relative to each event&apos;s date.
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {validDeliverables.map((d, i) => {
              const setting = dateRules[i] ?? { rule: 'none' as DateRule }
              return (
                <div key={i} className="space-y-1.5 pb-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{d.title}</p>
                  <select
                    value={setting.rule}
                    onChange={(e) => updateDateRule(i, e.target.value as DateRule)}
                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {DATE_RULE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {setting.rule === 'custom' && (
                    <Input
                      type="date"
                      value={setting.customDate ?? ''}
                      onChange={(e) => updateCustomDate(i, e.target.value)}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {hasRelativeRules && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Events without a date will get no due date for relative rules.
            </div>
          )}
        </div>
      )}

      {/* ════════════ Step 3: Preview & Validation ════════════ */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Partner info */}
          <div className="space-y-3">
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">Partner</p>
            <div className="space-y-1.5">
              <Label htmlFor="batch-partner-name">Partner Name *</Label>
              <Input
                id="batch-partner-name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g., Coca-Cola"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="batch-contact-name">Contact</Label>
                <Input
                  id="batch-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch-contact-email">Email</Label>
                <Input
                  id="batch-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
            </div>
          </div>

          {/* Event selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-widest text-gray-400 uppercase">Events</p>
              <button type="button" onClick={toggleAll} className="text-xs text-gray-400 hover:text-gray-600">
                {checkedEventIds.size === events.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {events.map((event) => {
                const checked = checkedEventIds.has(event.id)
                const noDate = !event.date && hasRelativeRules
                return (
                  <label
                    key={event.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors',
                      checked && 'bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEvent(event.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700 flex-1 truncate">{event.name}</span>
                    {event.date ? (
                      <span className="text-xs text-gray-400 shrink-0">{event.date}</span>
                    ) : noDate ? (
                      <span className="text-xs text-amber-500 shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        No date
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 shrink-0">No date</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-gray-50 px-3 py-2.5">
            <p className="text-sm font-medium text-gray-700">
              {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} &times; {validDeliverables.length} deliverable{validDeliverables.length !== 1 ? 's' : ''} = {selectedEvents.length * validDeliverables.length} total
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              A partner named &ldquo;{partnerName || '...'}&rdquo; will be created in each event.
            </p>
          </div>

          {hasRelativeRules && eventsWithoutDate.length > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {eventsWithoutDate.length} event{eventsWithoutDate.length !== 1 ? 's' : ''} ha{eventsWithoutDate.length !== 1 ? 've' : 's'} no date — relative date rules will produce no due date for {eventsWithoutDate.length !== 1 ? 'those' : 'that'} event{eventsWithoutDate.length !== 1 ? 's' : ''}.
            </div>
          )}
        </div>
      )}

      {/* ════════════ Step 4: Creating ════════════ */}
      {step === 4 && (
        <div className="space-y-4">
          <ProgressBar value={total > 0 ? Math.round((completed / total) * 100) : 0} className="mt-2" />

          <p className="text-sm text-gray-600 text-center">
            {isDone ? (
              errors.length > 0
                ? `Completed with ${errors.length} error${errors.length !== 1 ? 's' : ''}`
                : `Created ${total * validDeliverables.length} deliverables across ${total} events`
            ) : (
              `Creating deliverables... ${completed} of ${total} events`
            )}
          </p>

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {events.filter((e) => checkedEventIds.has(e.id)).map((event, i) => {
              const eventDone = i < completed
              const eventActive = i === completed && !isDone
              const eventError = errors.find((err) => err.event === event.name)
              return (
                <div key={event.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                  {eventError ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : eventDone ? (
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                  ) : eventActive ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-200 shrink-0" />
                  )}
                  <span className={cn('text-sm flex-1 truncate', eventDone ? 'text-gray-500' : eventActive ? 'text-gray-900 font-medium' : 'text-gray-400')}>
                    {event.name}
                  </span>
                  {eventError && <span className="text-xs text-red-400">{eventError.error}</span>}
                </div>
              )
            })}
          </div>

          {isDone && errors.length === 0 && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 text-center">
              All done! Partner &ldquo;{partnerName}&rdquo; added to {total} events with {validDeliverables.length} deliverables each.
            </div>
          )}
        </div>
      )}
    </SlideOver>
  )
}

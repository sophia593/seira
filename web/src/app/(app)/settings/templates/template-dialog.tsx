'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Pencil,
  Copy,
  ChevronUp,
  ChevronDown,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/sonner'
import { createTemplateAction, updateTemplateAction } from '@/app/(app)/actions/templates'
import {
  CATEGORY_CONFIG,
  PROOF_REQUIRED_CONFIG,
  TALENT_TYPE_CONFIG,
  TALENT_TYPES,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import type {
  Template,
  DeliverableCategory,
  ProofRequired,
  TalentType,
  TemplateDeliverable,
} from '@/lib/types/database'

/* ─────────────────────────────────────────────────────────────
 * Local constants
 * ───────────────────────────────────────────────────────────── */

const CATEGORIES: DeliverableCategory[] = [
  'in-venue',
  'digital',
  'hospitality',
  'signage',
  'talent',
  'content',
]

const PROOF_TYPES: { value: ProofRequired; label: string }[] = [
  { value: 'photo', label: 'Photo' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'file', label: 'File' },
  { value: 'link', label: 'Link' },
  { value: 'multiple', label: 'Multiple' },
]

const INDUSTRIES: { label: string; value: string; icon: string }[] = [
  { label: 'Sports', value: 'Sports', icon: '🏀' },
  { label: 'Venue', value: 'Venue', icon: '🏟️' },
  { label: 'Festival', value: 'Festival', icon: '🎉' },
  { label: 'Film', value: 'Film', icon: '🎬' },
  { label: 'Music', value: 'Music', icon: '🎵' },
  { label: 'Tech', value: 'Tech Conference', icon: '💻' },
  { label: 'Nonprofit', value: 'Nonprofit', icon: '🤝' },
  { label: 'Corporate', value: 'Corporate', icon: '🏢' },
]

/* ─────────────────────────────────────────────────────────────
 * FormSection — reusable section wrapper with header
 * ───────────────────────────────────────────────────────────── */

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description?: string
  icon?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon && <span aria-hidden="true" className="text-base">{icon}</span>}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </h4>
          {description && (
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * IndustrySelector — clickable pill row
 * ───────────────────────────────────────────────────────────── */

function IndustrySelector({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Select industry">
        {INDUSTRIES.map((ind) => {
          const isSelected = selected === ind.value
          return (
            <button
              key={ind.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(isSelected ? '' : ind.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-1',
                isSelected
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              <span aria-hidden="true">{ind.icon}</span>
              <span>{ind.label}</span>
            </button>
          )
        })}

        {/* Clear button — only when something is selected */}
        {selected && (
          <button
            type="button"
            onClick={() => onSelect('')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-dashed border-gray-200 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * TemplateStatsBar — summary of deliverable composition
 * ───────────────────────────────────────────────────────────── */

function TemplateStatsBar({
  deliverables,
}: {
  deliverables: TemplateDeliverable[]
}) {
  const stats = useMemo(() => {
    const catCounts: Partial<Record<DeliverableCategory, number>> = {}
    const proofCounts: Partial<Record<ProofRequired, number>> = {}
    deliverables.forEach((d) => {
      if (d.title.trim()) {
        catCounts[d.category] = (catCounts[d.category] ?? 0) + 1
        proofCounts[d.proof_required] = (proofCounts[d.proof_required] ?? 0) + 1
      }
    })
    return { catCounts, proofCounts }
  }, [deliverables])

  const validCount = deliverables.filter((d) => d.title.trim()).length
  if (validCount === 0) return null

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 space-y-2">
      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Template summary
        </span>
        <span className="text-xs font-medium text-gray-600">
          {validCount} deliverable{validCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Category distribution */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(stats.catCounts).map(([cat, count]) => {
          const cfg = CATEGORY_CONFIG[cat as DeliverableCategory]
          return (
            <span
              key={cat}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                cfg.bgColor,
                cfg.color,
                cfg.borderColor,
              )}
            >
              <span aria-hidden="true">{cfg.icon}</span>
              {cfg.label}
              <span className="ml-0.5 opacity-60">&times;{count}</span>
            </span>
          )
        })}
      </div>

      {/* Proof type distribution */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(stats.proofCounts).map(([proof, count]) => {
          const cfg = PROOF_REQUIRED_CONFIG[proof as ProofRequired]
          return (
            <span
              key={proof}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-500"
            >
              <span aria-hidden="true">{cfg.icon}</span>
              {cfg.label}
              <span className="ml-0.5 opacity-60">&times;{count}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * ValidationWarnings — amber alert bar for issues
 * ───────────────────────────────────────────────────────────── */

function ValidationWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2"
    >
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        {warnings.map((w, i) => (
          <p key={i} className="text-xs text-amber-700">
            {w}
          </p>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * DeliverableCard — display/edit mode deliverable card
 * ───────────────────────────────────────────────────────────── */

function DeliverableCard({
  deliverable,
  index,
  isEditMode,
  isFirst,
  isLast,
  totalCount,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onToggleMode,
}: {
  deliverable: TemplateDeliverable
  index: number
  isEditMode: boolean
  isFirst: boolean
  isLast: boolean
  totalCount: number
  onUpdate: (field: keyof TemplateDeliverable, value: string) => void
  onRemove: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleMode: () => void
}) {
  const catConfig = CATEGORY_CONFIG[deliverable.category]
  const proofConfig = PROOF_REQUIRED_CONFIG[deliverable.proof_required]
  const talentConfig =
    deliverable.category === 'talent' && deliverable.talent_sub_type
      ? TALENT_TYPE_CONFIG[deliverable.talent_sub_type]
      : null

  /* ── Display mode ──────────────────────────────────────── */
  if (!isEditMode) {
    return (
      <div className="group rounded-lg border border-gray-100 bg-white px-3 py-2.5 flex items-center gap-3 hover:border-gray-200 transition-colors">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 truncate">
              {deliverable.title || (
                <span className="text-gray-300 italic">Untitled</span>
              )}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[10px] font-semibold',
                catConfig.bgColor,
                catConfig.color,
                catConfig.borderColor,
              )}
            >
              {catConfig.icon} {catConfig.label}
            </span>
            <span className="text-[10px] text-gray-400" title={proofConfig.label}>
              {proofConfig.icon} {proofConfig.label}
            </span>
            {talentConfig && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[10px] font-medium',
                  talentConfig.bgColor,
                  talentConfig.color,
                  talentConfig.borderColor,
                )}
              >
                {talentConfig.icon} {talentConfig.label}
              </span>
            )}
          </div>
          {deliverable.notes && (
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{deliverable.notes}</p>
          )}
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={onToggleMode}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={totalCount <= 1}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  /* ── Edit mode ─────────────────────────────────────────── */
  return (
    <div className="rounded-lg border-2 border-gray-300 bg-gray-50/50 p-3 space-y-3 ring-1 ring-gray-200">
      {/* Title */}
      <Input
        value={deliverable.title}
        onChange={(e) => onUpdate('title', e.target.value)}
        placeholder="Deliverable title"
        className="h-9 text-sm font-medium"
        autoFocus
      />

      {/* Category mini-grid — compact 2×3 */}
      <div>
        <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">
          Category
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat]
            const isSelected = deliverable.category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onUpdate('category', cat)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-all text-left',
                  isSelected
                    ? cn('border-gray-400 bg-white shadow-sm font-medium', cfg.color)
                    : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-white',
                )}
              >
                <span aria-hidden="true">{cfg.icon}</span>
                <span>{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Proof type — small select */}
      <div>
        <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">
          Proof type
        </label>
        <select
          value={deliverable.proof_required}
          onChange={(e) => onUpdate('proof_required', e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs w-full"
        >
          {PROOF_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Talent sub-type pills (when category === talent) */}
      {deliverable.category === 'talent' && (
        <div>
          <label className="text-[10px] text-rose-400 uppercase tracking-wider mb-1.5 block">
            Talent type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TALENT_TYPES.map((t) => {
              const cfg = TALENT_TYPE_CONFIG[t]
              const isSelected = deliverable.talent_sub_type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onUpdate('talent_sub_type', t)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors',
                    isSelected
                      ? 'bg-rose-50 text-rose-700 border-rose-200 font-medium'
                      : 'text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600',
                  )}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">
          Notes
        </label>
        <Input
          value={deliverable.notes ?? ''}
          onChange={(e) => onUpdate('notes', e.target.value)}
          placeholder="Notes (optional)"
          className="h-7 text-xs text-gray-500 border-dashed"
        />
      </div>

      {/* Done button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onToggleMode}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          <Check className="h-3 w-3" />
          Done
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * TemplateDialog — main component
 * ───────────────────────────────────────────────────────────── */

interface TemplateDialogProps {
  template?: Template
  open: boolean
  onClose: () => void
}

function emptyDeliverable(): TemplateDeliverable {
  return { title: '', category: 'in-venue', proof_required: 'photo' }
}

export function TemplateDialog({ template, open, onClose }: TemplateDialogProps) {
  const router = useRouter()
  const isEditing = !!template
  const [name, setName] = useState(template?.name ?? '')
  const [industry, setIndustry] = useState(template?.industry ?? '')
  const [deliverables, setDeliverables] = useState<TemplateDeliverable[]>(
    template?.deliverables?.length ? [...template.deliverables] : [emptyDeliverable()],
  )
  const [isPending, startTransition] = useTransition()
  const [cardModes, setCardModes] = useState<Record<number, 'edit' | 'display'>>({})

  /* ── handlers ────────────────────────────────────────────── */

  function addRow() {
    const newIndex = deliverables.length
    setDeliverables([...deliverables, emptyDeliverable()])
    setCardModes((prev) => ({ ...prev, [newIndex]: 'edit' }))
  }

  function removeRow(index: number) {
    setDeliverables(deliverables.filter((_, i) => i !== index))
    // Rebuild cardModes with shifted indices
    setCardModes((prev) => {
      const next: Record<number, 'edit' | 'display'> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key)
        if (k < index) next[k] = val
        else if (k > index) next[k - 1] = val
      })
      return next
    })
  }

  function updateRow(index: number, field: keyof TemplateDeliverable, value: string) {
    setDeliverables(
      deliverables.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    )
  }

  function toggleCardMode(index: number) {
    setCardModes((prev) => ({
      ...prev,
      [index]: prev[index] === 'edit' ? 'display' : 'edit',
    }))
  }

  function moveRow(from: number, to: number) {
    if (to < 0 || to >= deliverables.length) return
    const updated = [...deliverables]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    setDeliverables(updated)

    // Swap card modes
    setCardModes((prev) => {
      const next = { ...prev }
      const fromMode = next[from]
      const toMode = next[to]
      if (fromMode !== undefined) next[to] = fromMode
      else delete next[to]
      if (toMode !== undefined) next[from] = toMode
      else delete next[from]
      return next
    })
  }

  function duplicateRow(index: number) {
    const source = deliverables[index]
    const copy: TemplateDeliverable = {
      ...source,
      title: source.title ? `${source.title} (Copy)` : '',
    }
    const updated = [...deliverables]
    updated.splice(index + 1, 0, copy)
    setDeliverables(updated)

    // Shift card modes and set new card to edit
    setCardModes((prev) => {
      const next: Record<number, 'edit' | 'display'> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key)
        if (k <= index) next[k] = val
        else next[k + 1] = val
      })
      next[index + 1] = 'edit'
      return next
    })
  }

  /* ── computed ────────────────────────────────────────────── */

  const validationWarnings = useMemo(() => {
    const warnings: string[] = []
    deliverables.forEach((d, i) => {
      if (!d.title.trim() && deliverables.length > 1) {
        warnings.push(`Row ${i + 1}: Missing title`)
      }
      if (d.category === 'talent' && !d.talent_sub_type) {
        warnings.push(`Row ${i + 1}: "${d.title || 'Untitled'}" — no talent type selected`)
      }
    })
    return warnings
  }, [deliverables])

  /* ── submit ──────────────────────────────────────────────── */

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validDeliverables = deliverables.filter((d) => d.title.trim())
    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }
    if (validDeliverables.length === 0) {
      toast.error('Add at least one deliverable')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('name', name.trim())
      if (industry) formData.set('industry', industry)
      formData.set('deliverables', JSON.stringify(validDeliverables))

      let result: { ok: boolean; error?: string }

      if (isEditing) {
        formData.set('template_id', template!.id)
        result = await updateTemplateAction(formData)
      } else {
        result = await createTemplateAction(formData)
      }

      if (!result.ok) {
        toast.error(result.error ?? `Failed to ${isEditing ? 'update' : 'create'} template`)
        return
      }

      toast.success(isEditing ? 'Template updated' : 'Template created')
      router.refresh()
      onClose()
    })
  }

  /* ── render ──────────────────────────────────────────────── */

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit template' : 'New template'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Template Information ─────────────────────────── */}
        <FormSection
          title="Template Information"
          icon="📋"
          description="Give this template a name and optional industry"
        >
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
                Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Sponsor Package"
                required
              />
            </div>

            {/* Industry pills */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
                Industry{' '}
                <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <IndustrySelector selected={industry} onSelect={setIndustry} />
            </div>
          </div>
        </FormSection>

        {/* ── Stats bar ───────────────────────────────────── */}
        <TemplateStatsBar deliverables={deliverables} />

        {/* ── Validation warnings ─────────────────────────── */}
        <ValidationWarnings warnings={validationWarnings} />

        {/* ── Deliverables ────────────────────────────────── */}
        <FormSection
          title={`Deliverables (${deliverables.length})`}
          icon="📦"
        >
          <div className="flex items-center justify-end mb-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addRow}
              className="h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add row
            </Button>
          </div>

          {/* Scrollable card list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {deliverables.map((d, i) => (
              <DeliverableCard
                key={i}
                deliverable={d}
                index={i}
                isEditMode={cardModes[i] === 'edit'}
                isFirst={i === 0}
                isLast={i === deliverables.length - 1}
                totalCount={deliverables.length}
                onUpdate={(field, value) => updateRow(i, field, value)}
                onRemove={() => removeRow(i)}
                onDuplicate={() => duplicateRow(i)}
                onMoveUp={() => moveRow(i, i - 1)}
                onMoveDown={() => moveRow(i, i + 1)}
                onToggleMode={() => toggleCardMode(i)}
              />
            ))}
          </div>

          {/* Empty state */}
          {deliverables.length === 0 && (
            <button
              type="button"
              onClick={addRow}
              className="w-full rounded-lg border-2 border-dashed border-gray-200 py-8 flex flex-col items-center gap-2 text-center hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-300" />
              <span className="text-sm text-gray-400">Add your first deliverable</span>
            </button>
          )}
        </FormSection>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-kurobeni text-white hover:bg-blackberry"
          >
            {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

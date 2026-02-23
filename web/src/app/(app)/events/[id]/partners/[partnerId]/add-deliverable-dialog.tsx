'use client'

import { useRef, useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Calendar, Package, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryBadge } from '@/components/ui/badges'
import { createDeliverableAction } from '@/app/(app)/actions/deliverables'
import { applyTemplateAction } from '@/app/(app)/actions/templates'
import { toast } from '@/components/ui/sonner'
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  PROOF_REQUIRED_OPTIONS,
  PROOF_REQUIRED_CONFIG,
  TALENT_TYPE_CONFIG,
  TALENT_TYPES,
  USAGE_SCOPE_OPTIONS,
  USAGE_TERRITORY_OPTIONS,
  USAGE_DURATION_OPTIONS,
  computeExpirationDate,
  formatShortDate,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getAssetUsageForEventAction } from '@/app/(app)/actions/utilization'
import type { Template, Talent, Asset, DeliverableCategory, ProofRequired, TalentType, UsageScope, UsageTerritory, UsageDuration } from '@/lib/types/database'

const INDUSTRY_LABEL: Record<string, string> = {
  sports: 'Sports',
  venue: 'Venue',
  festival: 'Festival',
  film: 'Film',
}

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
 * CategoryCardGrid — 3×2 clickable card grid replacing <Select>
 * ───────────────────────────────────────────────────────────── */

function CategoryCardGrid({
  selected,
  onSelect,
}: {
  selected: DeliverableCategory | ''
  onSelect: (cat: DeliverableCategory) => void
}) {
  return (
    <div role="radiogroup" aria-label="Select category" className="grid grid-cols-3 gap-2">
      {CATEGORIES.map((cat) => {
        const cfg = CATEGORY_CONFIG[cat]
        const isSelected = selected === cat
        return (
          <label
            key={cat}
            className={cn(
              'relative flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-all text-center',
              'hover:shadow-sm hover:border-gray-300',
              'focus-within:ring-2 focus-within:ring-gray-900/20 focus-within:ring-offset-1',
              isSelected
                ? 'ring-2 ring-gray-900/20 border-gray-400 bg-gray-50 shadow-sm'
                : 'border-gray-200 bg-white',
            )}
          >
            <input
              type="radio"
              name="category"
              value={cat}
              checked={isSelected}
              onChange={() => onSelect(cat)}
              className="sr-only"
              required
              aria-label={cfg.label}
            />
            <span aria-hidden="true" className="text-2xl leading-none">{cfg.icon}</span>
            <span
              className={cn(
                'text-xs font-medium leading-tight',
                isSelected ? 'text-gray-900' : 'text-gray-600',
              )}
            >
              {cfg.label}
            </span>
            <span className="text-[10px] text-gray-400 leading-tight line-clamp-2">
              {cfg.description}
            </span>
            {isSelected && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-white"
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * ProofRequirementCards — visual proof-type selector row
 * ───────────────────────────────────────────────────────────── */

function ProofRequirementCards({
  selected,
  onSelect,
}: {
  selected: ProofRequired
  onSelect: (p: ProofRequired) => void
}) {
  return (
    <div role="radiogroup" aria-label="Select proof requirement" className="grid grid-cols-5 gap-1.5">
      {PROOF_REQUIRED_OPTIONS.map((p) => {
        const cfg = PROOF_REQUIRED_CONFIG[p]
        const isSelected = selected === p
        return (
          <label
            key={p}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-lg border p-2.5 cursor-pointer transition-all text-center',
              'hover:shadow-sm hover:border-gray-300',
              'focus-within:ring-2 focus-within:ring-gray-900/20 focus-within:ring-offset-1',
              isSelected
                ? 'ring-2 ring-gray-900/20 border-gray-400 bg-gray-50 shadow-sm'
                : 'border-gray-200 bg-white',
            )}
          >
            <input
              type="radio"
              name="proof_required"
              value={p}
              checked={isSelected}
              onChange={() => onSelect(p)}
              className="sr-only"
              aria-label={cfg.label}
            />
            <span aria-hidden="true" className="text-lg leading-none">{cfg.icon}</span>
            <span
              className={cn(
                'text-[10px] font-medium leading-tight',
                isSelected ? 'text-gray-900' : 'text-gray-500',
              )}
            >
              {cfg.label}
            </span>
            <span className="text-[9px] text-gray-400 leading-tight line-clamp-2 mt-0.5">
              {cfg.description}
            </span>
            {isSelected && (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-900 text-white"
              >
                <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * TalentSubTypeGrid — 2×2 grid of talent-type cards
 * ───────────────────────────────────────────────────────────── */

const TALENT_DESCRIPTIONS: Record<TalentType, string> = {
  player: 'Athletes & sports talent',
  artist: 'Musicians & performers',
  influencer: 'Social media & creators',
  speaker: 'Presenters & MCs',
}

function TalentSubTypeGrid({
  defaultValue,
  onSelect,
}: {
  defaultValue?: TalentType | null
  onSelect?: (t: TalentType) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Select talent type"
      className="rounded-lg border border-rose-200 bg-rose-50/50 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-base">🎭</span>
        <div>
          <p className="text-xs font-semibold text-rose-700 tracking-wide">
            What type of talent is this for?
          </p>
          <p className="text-[10px] text-rose-400 mt-0.5">
            Select one to help categorize and filter talent deliverables
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TALENT_TYPES.map((t) => {
          const cfg = TALENT_TYPE_CONFIG[t]
          return (
            <label
              key={t}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
                'has-[:checked]:shadow-sm has-[:checked]:border-rose-300 has-[:checked]:bg-white has-[:checked]:text-rose-800 has-[:checked]:font-medium has-[:checked]:ring-1 has-[:checked]:ring-rose-200',
                'border-rose-100 text-rose-600/70 hover:border-rose-200 hover:bg-white/60',
                'focus-within:ring-2 focus-within:ring-rose-300 focus-within:ring-offset-1',
              )}
            >
              <input
                type="radio"
                name="talent_sub_type"
                value={t}
                defaultChecked={defaultValue === t}
                onChange={() => onSelect?.(t)}
                className="sr-only"
                aria-label={cfg.label}
              />
              <span aria-hidden="true" className="text-xl leading-none shrink-0">{cfg.icon}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium leading-tight">{cfg.label}</span>
                <span className="text-[10px] text-rose-400 leading-tight mt-0.5">
                  {TALENT_DESCRIPTIONS[t]}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * DateQuickPicks — quick date shortcut buttons + calendar
 * ───────────────────────────────────────────────────────────── */

function DateQuickPicks({
  selectedDate,
  onSelectDate,
  selectedQuick,
  onSelectQuick,
}: {
  selectedDate: string
  onSelectDate: (date: string) => void
  selectedQuick: string | null
  onSelectQuick: (label: string | null) => void
}) {
  const quickPicks = useMemo(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const twoWeeks = new Date(today)
    twoWeeks.setDate(today.getDate() + 14)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const fmt = (d: Date) => d.toISOString().split('T')[0]
    return [
      { label: 'Tomorrow', date: fmt(tomorrow) },
      { label: 'Next week', date: fmt(nextWeek) },
      { label: '2 weeks', date: fmt(twoWeeks) },
      { label: 'End of month', date: fmt(endOfMonth) },
    ]
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {quickPicks.map((qp) => (
          <button
            key={qp.label}
            type="button"
            onClick={() => {
              onSelectDate(qp.date)
              onSelectQuick(qp.label)
            }}
            className={cn(
              'px-2.5 py-1 text-[11px] rounded-md border transition-all font-medium',
              selectedQuick === qp.label
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            )}
          >
            {qp.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <Input
          id="due_date"
          name="due_date"
          type="date"
          value={selectedDate}
          onChange={(e) => {
            onSelectDate(e.target.value)
            onSelectQuick(null)
          }}
          className="pl-8"
        />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * LivePreviewCard — real-time deliverable preview panel
 * ───────────────────────────────────────────────────────────── */

function LivePreviewCard({
  title,
  category,
  proofType,
  dueDate,
  talentSubType,
}: {
  title: string
  category: DeliverableCategory | ''
  proofType: ProofRequired
  dueDate: string
  talentSubType: TalentType | null
}) {
  const catConfig = category ? CATEGORY_CONFIG[category] : null
  const proofConfig = PROOF_REQUIRED_CONFIG[proofType]
  const talentConfig =
    category === 'talent' && talentSubType
      ? TALENT_TYPE_CONFIG[talentSubType]
      : null

  const formattedDate = dueDate
    ? new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
      <div className="flex items-center gap-2 text-gray-400">
        <Eye className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Live Preview</span>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-3 space-y-2.5">
        {/* Title row */}
        <p
          className={cn(
            'text-sm font-medium leading-tight',
            title ? 'text-gray-900' : 'text-gray-300 italic',
          )}
        >
          {title || 'Deliverable title\u2026'}
        </p>

        {/* Badge row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {catConfig ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                catConfig.bgColor,
                catConfig.color,
                catConfig.borderColor,
              )}
            >
              <span aria-hidden="true">{catConfig.icon}</span>
              {catConfig.label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-200 px-2 py-0.5 text-[10px] text-gray-300">
              Category
            </span>
          )}

          {talentConfig && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                talentConfig.bgColor,
                talentConfig.color,
                talentConfig.borderColor,
              )}
            >
              <span aria-hidden="true">{talentConfig.icon}</span>
              {talentConfig.label}
            </span>
          )}

          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-500">
            <span aria-hidden="true">{proofConfig.icon}</span>
            {proofConfig.label}
          </span>
        </div>

        {/* Due date */}
        {formattedDate && (
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due {formattedDate}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * AddDeliverableDialog — main component
 * ───────────────────────────────────────────────────────────── */

interface AddDeliverableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  partnerId: string
  templates?: Template[]
  talents?: Talent[]
  assets?: Asset[]
  eventDate?: string | null
}

export function AddDeliverableDialog({
  open,
  onOpenChange,
  eventId,
  partnerId,
  templates = [],
  talents = [],
  assets = [],
  eventDate,
}: AddDeliverableDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'manual' | 'template'>('manual')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  // Form field state — used by card grids + live preview
  const [selectedCategory, setSelectedCategory] = useState<DeliverableCategory | ''>('')
  const [selectedProofType, setSelectedProofType] = useState<ProofRequired>('photo')
  const [selectedTalentType, setSelectedTalentType] = useState<TalentType | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [selectedQuickDate, setSelectedQuickDate] = useState<string | null>(null)
  const [selectedTalentId, setSelectedTalentId] = useState('')
  const [talentSearch, setTalentSearch] = useState('')
  const [usageScope, setUsageScope] = useState<UsageScope | ''>('')
  const [usageTerritory, setUsageTerritory] = useState<UsageTerritory | ''>('')
  const [usageDuration, setUsageDuration] = useState<UsageDuration | ''>('')
  const [usageScopeCustom, setUsageScopeCustom] = useState('')
  const [usageTerritoryCustom, setUsageTerritoryCustom] = useState('')
  const [usageExpirationCustom, setUsageExpirationCustom] = useState('')

  // Asset linking
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [assetSearch, setAssetSearch] = useState('')
  const [assetUsageCount, setAssetUsageCount] = useState<number | null>(null)

  const filteredAssets = useMemo(() => {
    if (!assetSearch.trim()) return assets
    const q = assetSearch.toLowerCase()
    return assets.filter((a) => a.name.toLowerCase().includes(q))
  }, [assets, assetSearch])

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null
  const isOverAllocated = selectedAsset?.capacity != null
    && assetUsageCount != null
    && assetUsageCount >= selectedAsset.capacity

  useEffect(() => {
    if (!selectedAssetId) {
      setAssetUsageCount(null)
      return
    }
    getAssetUsageForEventAction(selectedAssetId, eventId).then((res) => {
      if (res.ok) setAssetUsageCount(res.count ?? 0)
    })
  }, [selectedAssetId, eventId])

  /* ── handlers ────────────────────────────────────────────── */

  const handleClose = () => {
    if (isPending) return
    formRef.current?.reset()
    setError(null)
    setSelectedTemplate(null)
    setSelectedCategory('')
    setSelectedProofType('photo')
    setSelectedTalentType(null)
    setFormTitle('')
    setFormDueDate('')
    setSelectedQuickDate(null)
    setSelectedTalentId('')
    setTalentSearch('')
    setUsageScope('')
    setUsageTerritory('')
    setUsageDuration('')
    setUsageScopeCustom('')
    setUsageTerritoryCustom('')
    setUsageExpirationCustom('')
    setSelectedAssetId('')
    setAssetSearch('')
    setAssetUsageCount(null)
    setMode('manual')
    onOpenChange(false)
  }

  const handleCategorySelect = (cat: DeliverableCategory) => {
    setSelectedCategory(cat)
    if (cat !== 'talent') {
      setSelectedTalentType(null)
      setSelectedTalentId('')
      setTalentSearch('')
      setUsageScope('')
      setUsageTerritory('')
      setUsageDuration('')
      setUsageScopeCustom('')
      setUsageTerritoryCustom('')
      setUsageExpirationCustom('')
    }
  }

  const filteredTalents = useMemo(() => {
    if (!talentSearch.trim()) return talents
    const q = talentSearch.toLowerCase()
    return talents.filter(
      (t) => t.name.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) || t.affiliation?.toLowerCase().includes(q)
    )
  }, [talents, talentSearch])

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

  /* ── derived ─────────────────────────────────────────────── */

  const hasTemplates = templates.length > 0

  /* ── footer ──────────────────────────────────────────────── */

  const footer =
    mode === 'manual' ? (
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
          form="add-deliverable-form"
          isLoading={isPending}
          className="bg-kurobeni text-white hover:bg-blackberry rounded-md"
        >
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
          {selectedTemplate
            ? `Apply (${selectedTemplate.deliverables.length})`
            : 'Select a template'}
        </Button>
      </div>
    )

  /* ── render ──────────────────────────────────────────────── */

  return (
    <Modal open={open} onClose={handleClose} title="New Deliverable" footer={footer}>
      {/* ── Tab toggle ── */}
      {hasTemplates && (
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setMode('manual')
              setSelectedTemplate(null)
              setError(null)
            }}
            className={cn(
              'flex-1 text-sm font-medium py-1.5 rounded-md transition-colors',
              mode === 'manual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('template')
              setError(null)
            }}
            className={cn(
              'flex-1 text-sm font-medium py-1.5 rounded-md transition-colors',
              mode === 'template'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            From Template
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
       * Manual form
       * ════════════════════════════════════════════════════════ */}
      {mode === 'manual' && (
        <form
          id="add-deliverable-form"
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <input type="hidden" name="partner_id" value={partnerId} />
          <input type="hidden" name="event_id" value={eventId} />

          {/* ── Basic Information ─────────────────────────────── */}
          <FormSection
            title="Basic Information"
            icon="✏️"
            description="Give this deliverable a descriptive name"
          >
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., LED board rotation"
                required
                autoFocus
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              <p className="text-[11px] text-gray-400">
                A short name that describes what needs to be delivered
              </p>
            </div>
          </FormSection>

          {/* ── Category ─────────────────────────────────────── */}
          <FormSection
            title="Category"
            icon="📂"
            description="Choose the type of deliverable"
          >
            <CategoryCardGrid
              selected={selectedCategory}
              onSelect={handleCategorySelect}
            />
          </FormSection>

          {/* ── Talent sub-type (conditional) ─────────────────── */}
          {selectedCategory === 'talent' && (
            <TalentSubTypeGrid
              key={selectedTalentType ?? 'none'}
              defaultValue={selectedTalentType}
              onSelect={setSelectedTalentType}
            />
          )}

          {/* ── Talent picker (conditional) ─────────────────── */}
          {selectedCategory === 'talent' && talents.length > 0 && (
            <FormSection
              title="Link Talent"
              icon="👤"
              description="Optionally link to a talent record"
            >
              <input type="hidden" name="talent_id" value={selectedTalentId} />
              <Input
                placeholder="Search talent by name..."
                value={talentSearch}
                onChange={(e) => setTalentSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTalentId('')
                    setTalentSearch('')
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                    !selectedTalentId ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50',
                  )}
                >
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">—</span>
                  <span className="text-gray-500">None</span>
                </button>
                {filteredTalents.map((t) => {
                  const isSelected = selectedTalentId === t.id
                  const cfg = TALENT_TYPE_CONFIG[t.type]
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTalentId(t.id)
                        setSelectedTalentType(t.type)
                        setTalentSearch('')
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                        isSelected ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50',
                      )}
                    >
                      {t.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 flex items-center justify-center">
                          {t.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="flex-1 text-left truncate">{t.name}</span>
                      <span className="text-xs text-gray-400">{cfg.icon} {cfg.label}</span>
                      {isSelected && (
                        <span className="text-[10px] text-gray-400">Selected</span>
                      )}
                    </button>
                  )
                })}
                {filteredTalents.length === 0 && talentSearch && (
                  <p className="px-3 py-2 text-xs text-gray-400 text-center">No talent matching &ldquo;{talentSearch}&rdquo;</p>
                )}
              </div>
            </FormSection>
          )}

          {/* ── Usage Rights (conditional) ────────────────────── */}
          {selectedCategory === 'talent' && (
            <FormSection
              title="Usage Rights"
              icon="📜"
              description="Scope, territory, and duration of usage rights"
            >
              <input type="hidden" name="usage_scope" value={usageScope} />
              <input type="hidden" name="usage_territory" value={usageTerritory} />
              <input type="hidden" name="usage_duration" value={usageDuration} />
              <input type="hidden" name="usage_scope_custom" value={usageScopeCustom} />
              <input type="hidden" name="usage_territory_custom" value={usageTerritoryCustom} />
              <input type="hidden" name="usage_expiration_date" value={usageExpirationCustom} />

              <div className="space-y-4">
                {/* Scope */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5">Scope</p>
                  <div className="flex flex-wrap gap-1.5">
                    {USAGE_SCOPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setUsageScope(usageScope === opt.value ? '' : opt.value)
                          if (opt.value !== 'custom') setUsageScopeCustom('')
                        }}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          usageScope === opt.value
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {usageScope === 'custom' && (
                    <Input
                      placeholder="e.g., Print and OOH only"
                      value={usageScopeCustom}
                      onChange={(e) => setUsageScopeCustom(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Territory */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5">Territory</p>
                  <div className="flex flex-wrap gap-1.5">
                    {USAGE_TERRITORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setUsageTerritory(usageTerritory === opt.value ? '' : opt.value)
                          if (opt.value !== 'custom') setUsageTerritoryCustom('')
                        }}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          usageTerritory === opt.value
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {usageTerritory === 'custom' && (
                    <Input
                      placeholder="e.g., North America and Europe"
                      value={usageTerritoryCustom}
                      onChange={(e) => setUsageTerritoryCustom(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Duration */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5">Duration</p>
                  <div className="flex flex-wrap gap-1.5">
                    {USAGE_DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setUsageDuration(usageDuration === opt.value ? '' : opt.value)
                          if (opt.value !== 'custom') setUsageExpirationCustom('')
                        }}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          usageDuration === opt.value
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {usageDuration === 'custom' && (
                    <div className="mt-2">
                      <Label htmlFor="usage-exp-date" className="text-xs">Expiration Date</Label>
                      <Input
                        id="usage-exp-date"
                        type="date"
                        value={usageExpirationCustom}
                        onChange={(e) => setUsageExpirationCustom(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  {usageDuration && usageDuration !== 'custom' && usageDuration !== 'perpetual' && eventDate && (
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Expires {formatShortDate(computeExpirationDate(eventDate, usageDuration) ?? '')}
                    </p>
                  )}
                  {usageDuration === 'perpetual' && (
                    <p className="text-[11px] text-gray-400 mt-1.5">No expiration</p>
                  )}
                </div>
              </div>
            </FormSection>
          )}

          {/* ── Proof Requirement ────────────────────────────── */}
          <FormSection
            title="Proof Requirement"
            icon="📷"
            description="What kind of proof is needed for fulfillment?"
          >
            <ProofRequirementCards
              selected={selectedProofType}
              onSelect={setSelectedProofType}
            />
          </FormSection>

          {/* ── Link Asset ─────────────────────────────────────── */}
          {assets.length > 0 && (
            <FormSection
              title="Link Asset"
              icon="📦"
              description="Optionally link to a venue or digital asset"
            >
              <input type="hidden" name="asset_id" value={selectedAssetId} />
              <Input
                placeholder="Search assets..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssetId('')
                    setAssetSearch('')
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                    !selectedAssetId ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50',
                  )}
                >
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">—</span>
                  <span className="text-gray-500">None</span>
                </button>
                {filteredAssets.map((a) => {
                  const isSelected = selectedAssetId === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedAssetId(a.id)
                        setAssetSearch('')
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                        isSelected ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50',
                      )}
                    >
                      <Package className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="flex-1 text-left truncate">{a.name}</span>
                      <span className="text-xs text-gray-400">
                        {a.capacity != null ? `Cap: ${a.capacity}` : 'Unlimited'}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-gray-400">Selected</span>
                      )}
                    </button>
                  )
                })}
                {filteredAssets.length === 0 && assetSearch && (
                  <p className="px-3 py-2 text-xs text-gray-400 text-center">No assets matching &ldquo;{assetSearch}&rdquo;</p>
                )}
              </div>
              {isOverAllocated && (
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">
                    {selectedAsset!.name} at capacity ({assetUsageCount}/{selectedAsset!.capacity})
                  </p>
                </div>
              )}
            </FormSection>
          )}

          {/* ── Two-column: Notes + Due Date ──────────────────── */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormSection title="Notes" icon="📝">
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="e.g., 30-second rotation during breaks"
                className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormSection>

            <FormSection
              title="Due Date"
              icon="📅"
              description="When should this be completed?"
            >
              <DateQuickPicks
                selectedDate={formDueDate}
                onSelectDate={setFormDueDate}
                selectedQuick={selectedQuickDate}
                onSelectQuick={setSelectedQuickDate}
              />
            </FormSection>
          </div>

          {/* ── Live Preview ──────────────────────────────────── */}
          <LivePreviewCard
            title={formTitle}
            category={selectedCategory}
            proofType={selectedProofType}
            dueDate={formDueDate}
            talentSubType={selectedTalentType}
          />

          {/* ── Error ──────────────────────────────────────────── */}
          {error && (
            <p role="alert" aria-live="assertive" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      )}

      {/* ════════════════════════════════════════════════════════
       * Template picker
       * ════════════════════════════════════════════════════════ */}
      {mode === 'template' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Pick a template to add all its deliverables at once.
          </p>

          {/* Template list */}
          <div className="space-y-2">
            {templates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id
              const count = template.deliverables.length
              const preview = template.deliverables
                .slice(0, 3)
                .map((d) => d.title)
                .join(', ')
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
                      : 'border-gray-200 hover:border-gray-300',
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
                    {preview}
                    {more}
                  </p>
                </button>
              )
            })}
          </div>

          {/* ── Enhanced template preview with mini cards ──────── */}
          {selectedTemplate && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Preview — {selectedTemplate.deliverables.length} deliverables
              </p>
              <div className="space-y-2">
                {selectedTemplate.deliverables.map((d, i) => {
                  const catCfg = CATEGORY_CONFIG[d.category]
                  const proofCfg = PROOF_REQUIRED_CONFIG[d.proof_required]
                  const talentCfg = d.talent_sub_type
                    ? TALENT_TYPE_CONFIG[d.talent_sub_type]
                    : null

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span aria-hidden="true" className="text-sm shrink-0">
                          {catCfg.icon}
                        </span>
                        <span className="text-sm text-gray-700 truncate">{d.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CategoryBadge
                          category={d.category}
                          showIcon={false}
                          className="text-[10px] px-1.5 py-0"
                        />
                        {talentCfg && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[10px] font-medium',
                              talentCfg.bgColor,
                              talentCfg.color,
                              talentCfg.borderColor,
                            )}
                          >
                            {talentCfg.icon} {talentCfg.label}
                          </span>
                        )}
                        <span
                          className="text-[10px] text-gray-400"
                          title={proofCfg.label}
                        >
                          {proofCfg.icon}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {templates.length === 0 && (
            <p className="text-sm text-gray-400 py-6 text-center">
              No templates available. Seed sample data to get started.
            </p>
          )}

          {/* Error */}
          {error && (
            <p role="alert" aria-live="assertive" className="text-sm text-destructive mt-4">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

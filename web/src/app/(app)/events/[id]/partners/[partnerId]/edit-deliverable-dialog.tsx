'use client'

import { useRef, useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, Play, Calendar, Upload, Package, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'
import { ProofUploadButton } from '@/components/proof/proof-upload-button'
import { ProofLightbox } from '@/components/proof/proof-lightbox'
import { updateDeliverableAction, deleteDeliverableAction } from '@/app/(app)/actions/deliverables'
import { deleteProofAction } from '@/app/(app)/actions/proof'
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  PROOF_REQUIRED_OPTIONS,
  PROOF_REQUIRED_CONFIG,
  TALENT_TYPE_CONFIG,
  TALENT_TYPES,
  STATUS_CONFIG,
  STATUS_FLOW,
  USAGE_SCOPE_OPTIONS,
  USAGE_TERRITORY_OPTIONS,
  USAGE_DURATION_OPTIONS,
  computeExpirationDate,
  formatShortDate,
} from '@/lib/constants'
import { isImageType, isVideoType, isPdfType, formatFileSize, getProofTypeLabel } from '@/lib/proof-utils'
import { cn } from '@/lib/utils'
import { useOrg } from '@/hooks/use-org'
import { getAssetUsageForEventAction } from '@/app/(app)/actions/utilization'
import type { Deliverable, Talent, Asset, DeliverableCategory, DeliverableStatus, ProofRequired, TalentType, Proof, UsageScope, UsageTerritory, UsageDuration } from '@/lib/types/database'

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
 * CategoryCardGrid — 3×2 clickable card grid
 * ───────────────────────────────────────────────────────────── */

function CategoryCardGrid({
  selected,
  onSelect,
}: {
  selected: DeliverableCategory
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
}: {
  defaultValue?: TalentType | null
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
          id="edit-due_date"
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
 * StatusIndicator — current status badge with progress dots
 * ───────────────────────────────────────────────────────────── */

function StatusIndicator({ status }: { status: DeliverableStatus }) {
  const config = STATUS_CONFIG[status]
  const currentIndex = STATUS_FLOW.indexOf(status)

  return (
    <div className="flex items-center gap-3">
      {/* Badge */}
      <span
        role="status"
        aria-label={`Status: ${config.label}`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
          config.bgColor,
          config.color,
          config.borderColor,
        )}
      >
        <span aria-hidden="true">{config.icon}</span>
        {config.label}
      </span>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {STATUS_FLOW.map((s, i) => {
          const stepConfig = STATUS_CONFIG[s]
          const isFilled = i <= currentIndex
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-colors',
                  isFilled ? stepConfig.dotColor : 'bg-gray-200',
                )}
                title={stepConfig.label}
              />
              {i < STATUS_FLOW.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-4 rounded-full',
                    i < currentIndex ? 'bg-gray-300' : 'bg-gray-100',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Description */}
      <span className="text-[11px] text-gray-400 hidden sm:inline">
        {config.description}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * MetadataStrip — created, updated, owner info
 * ───────────────────────────────────────────────────────────── */

function MetadataStrip({
  createdAt,
  updatedAt,
  ownerId,
}: {
  createdAt: string
  updatedAt: string
  ownerId: string | null
}) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const relativeTime = (dateStr: string) => {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay}d ago`
    return formatDate(dateStr)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
      <span>Created {formatDate(createdAt)}</span>
      <span aria-hidden="true" className="text-gray-200">|</span>
      <span>Updated {relativeTime(updatedAt)}</span>
      {ownerId && (
        <>
          <span aria-hidden="true" className="text-gray-200">|</span>
          <span>Owner: {ownerId}</span>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * EnhancedProofGallery — rich proof section with type breakdown
 * ───────────────────────────────────────────────────────────── */

function EnhancedProofGallery({
  proofs,
  deliverable,
  eventId,
  deletingProofId,
  onDeleteProof,
  onOpenLightbox,
}: {
  proofs: Proof[]
  deliverable: Deliverable
  eventId: string
  deletingProofId: string | null
  onDeleteProof: (proof: Proof) => void
  onOpenLightbox: (index: number) => void
}) {
  // File type breakdown
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    proofs.forEach((p) => {
      const label = getProofTypeLabel(p.file_type).toLowerCase()
      counts[label] = (counts[label] ?? 0) + 1
    })
    return Object.entries(counts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(' \u00b7 ')
  }, [proofs])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // File type badge label
  const getTypeBadge = (mimeType: string) => {
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPG'
    if (mimeType.includes('png')) return 'PNG'
    if (mimeType.includes('webp')) return 'WEBP'
    if (mimeType.includes('gif')) return 'GIF'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('mp4')) return 'MP4'
    if (mimeType.includes('quicktime')) return 'MOV'
    return 'FILE'
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Proof{proofs.length > 0 && ` (${proofs.length})`}
          </h4>
          {breakdown && (
            <span className="text-[10px] text-gray-400">{breakdown}</span>
          )}
        </div>
        <ProofUploadButton
          deliverableId={deliverable.id}
          eventId={eventId}
          partnerId={deliverable.partner_id}
          compact
          proofRequired={deliverable.proof_required}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {proofs.map((proof, i) => (
          <div
            key={proof.id}
            className="relative rounded-lg border border-gray-100 overflow-hidden group"
          >
            {/* Preview */}
            <button
              type="button"
              onClick={() => onOpenLightbox(i)}
              className="block w-full"
            >
              {isImageType(proof.file_type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proof.file_url}
                  alt={proof.file_name}
                  className="aspect-video w-full object-cover"
                />
              ) : isPdfType(proof.file_type) ? (
                <div className="aspect-video w-full bg-red-50 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-red-400" />
                </div>
              ) : isVideoType(proof.file_type) ? (
                <div className="aspect-video w-full bg-blue-50 flex items-center justify-center">
                  <Play className="w-8 h-8 text-blue-400" />
                </div>
              ) : (
                <div className="aspect-video w-full bg-gray-50 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </button>

            {/* File type badge overlay */}
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-black/60 text-white leading-none">
              {getTypeBadge(proof.file_type)}
            </span>

            {/* File info */}
            <div className="px-2 py-1.5">
              <p className="text-xs truncate">{proof.file_name}</p>
              <p className="text-[10px] text-gray-400">
                {formatFileSize(proof.file_size)} &middot; {formatDate(proof.created_at)}
              </p>
            </div>

            {/* Hover overlay with actions */}
            <div
              className={cn(
                'absolute inset-0 bg-black/40 flex items-center justify-center gap-2',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                deletingProofId === proof.id && 'opacity-100',
              )}
            >
              <button
                type="button"
                onClick={() => onOpenLightbox(i)}
                className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                title="View"
              >
                <svg className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onDeleteProof(proof)}
                disabled={deletingProofId === proof.id}
                className={cn(
                  'h-8 w-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors',
                  deletingProofId === proof.id && 'animate-pulse',
                )}
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload card */}
        <div className="rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center aspect-video hover:border-copper hover:bg-copper/5 transition-colors gap-1.5">
          <Upload className="h-5 w-5 text-gray-300" />
          <ProofUploadButton
            deliverableId={deliverable.id}
            eventId={eventId}
            partnerId={deliverable.partner_id}
            compact
            proofRequired={deliverable.proof_required}
            className="flex flex-col items-center gap-1"
          />
          <span className="text-[10px] text-gray-300">Drop or click</span>
        </div>
      </div>

      {/* Empty state */}
      {proofs.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 py-8 flex flex-col items-center gap-2 text-center">
          <Upload className="h-8 w-8 text-gray-200" />
          <p className="text-sm text-gray-400">No proof uploaded yet</p>
          <ProofUploadButton
            deliverableId={deliverable.id}
            eventId={eventId}
            partnerId={deliverable.partner_id}
            proofRequired={deliverable.proof_required}
            className="text-xs text-copper hover:underline"
          />
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * EditDeliverableDialog — main component
 * ───────────────────────────────────────────────────────────── */

interface EditDeliverableDialogProps {
  deliverable: Deliverable | null
  eventId: string
  onClose: () => void
  proofs: Proof[]
  talents?: Talent[]
  assets?: Asset[]
  eventDate?: string | null
}

export function EditDeliverableDialog({
  deliverable,
  eventId,
  onClose,
  proofs,
  talents = [],
  assets = [],
  eventDate,
}: EditDeliverableDialogProps) {
  const router = useRouter()
  const { isAdmin } = useOrg()
  const formRef = useRef<HTMLFormElement>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingProofId, setDeletingProofId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Card grid state
  const [editCategory, setEditCategory] = useState<DeliverableCategory>(
    deliverable?.category ?? 'in-venue',
  )
  const [editProofType, setEditProofType] = useState<ProofRequired>(
    deliverable?.proof_required ?? 'photo',
  )
  const [editDueDate, setEditDueDate] = useState(deliverable?.due_date ?? '')
  const [editQuickDate, setEditQuickDate] = useState<string | null>(null)
  const [selectedTalentId, setSelectedTalentId] = useState(deliverable?.talent_id ?? '')
  const [talentSearch, setTalentSearch] = useState('')
  const [usageScope, setUsageScope] = useState<UsageScope | ''>(deliverable?.usage_scope ?? '')
  const [usageTerritory, setUsageTerritory] = useState<UsageTerritory | ''>(deliverable?.usage_territory ?? '')
  const [usageDuration, setUsageDuration] = useState<UsageDuration | ''>(deliverable?.usage_duration ?? '')
  const [usageScopeCustom, setUsageScopeCustom] = useState(deliverable?.usage_scope_custom ?? '')
  const [usageTerritoryCustom, setUsageTerritoryCustom] = useState(deliverable?.usage_territory_custom ?? '')
  const [usageExpirationCustom, setUsageExpirationCustom] = useState(deliverable?.usage_expiration_date ?? '')

  // Asset linking
  const [selectedAssetId, setSelectedAssetId] = useState(deliverable?.asset_id ?? '')
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

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!deliverable) return
    setEditError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateDeliverableAction(
        deliverable.id,
        eventId,
        deliverable.partner_id,
        formData,
      )
      if (!result.ok) {
        setEditError(result.error ?? 'Failed to update deliverable')
        return
      }
      toast.success('Deliverable updated')
      onClose()
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!deliverable) return
    setIsDeleting(true)
    try {
      const result = await deleteDeliverableAction(
        deliverable.id,
        eventId,
        deliverable.partner_id,
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete deliverable')
        setIsDeleting(false)
        return
      }
      toast.success('Deliverable deleted')
      setShowDeleteConfirm(false)
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to delete deliverable')
      setIsDeleting(false)
    }
  }

  const handleDeleteProof = async (proof: Proof) => {
    if (!deliverable) return
    setDeletingProofId(proof.id)
    try {
      const result = await deleteProofAction(
        proof.id,
        proof.file_url,
        proof.deliverable_id,
        eventId,
        deliverable.partner_id,
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete proof')
      } else {
        toast.success('Proof deleted')
        router.refresh()
      }
    } catch {
      toast.error('Failed to delete proof')
    } finally {
      setDeletingProofId(null)
    }
  }

  const handleLightboxDelete = async (proofId: string, filePath: string) => {
    if (!deliverable) return
    setLightboxOpen(false)
    setDeletingProofId(proofId)
    try {
      const result = await deleteProofAction(
        proofId,
        filePath,
        deliverable.id,
        eventId,
        deliverable.partner_id,
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete proof')
      } else {
        toast.success('Proof deleted')
        router.refresh()
      }
    } catch {
      toast.error('Failed to delete proof')
    } finally {
      setDeletingProofId(null)
    }
  }

  const handleClose = () => {
    if (isPending) return
    setEditError(null)
    onClose()
  }

  const handleCategorySelect = (cat: DeliverableCategory) => {
    setEditCategory(cat)
    if (cat !== 'talent') {
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

  /* ── render ──────────────────────────────────────────────── */

  return (
    <>
      <Modal
        open={!!deliverable}
        onClose={handleClose}
        title="Edit Deliverable"
        footer={
          <div className="flex items-center justify-between">
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
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
                form="edit-deliverable-form"
                isLoading={isPending}
                className="bg-kurobeni text-white hover:bg-blackberry rounded-md"
              >
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        {deliverable && (
          <div className="space-y-6">
            {/* ── Status + metadata ───────────────────────────── */}
            <StatusIndicator status={deliverable.status} />
            <MetadataStrip
              createdAt={deliverable.created_at}
              updatedAt={deliverable.updated_at}
              ownerId={deliverable.owner_id}
            />

            <div className="border-t border-gray-100" />

            {/* ── Form ────────────────────────────────────────── */}
            <form
              id="edit-deliverable-form"
              ref={formRef}
              onSubmit={handleEdit}
              className="space-y-6"
            >
              {/* Title */}
              <FormSection title="Title" icon="✏️">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={deliverable.title}
                    required
                    autoFocus
                  />
                </div>
              </FormSection>

              {/* Category */}
              <FormSection
                title="Category"
                icon="📂"
                description="Choose the type of deliverable"
              >
                <CategoryCardGrid
                  selected={editCategory}
                  onSelect={handleCategorySelect}
                />
              </FormSection>

              {/* Talent sub-type (conditional) */}
              {editCategory === 'talent' && (
                <TalentSubTypeGrid defaultValue={deliverable.talent_sub_type} />
              )}

              {/* Talent picker (conditional) */}
              {editCategory === 'talent' && talents.length > 0 && (
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

              {/* Usage Rights (conditional) */}
              {editCategory === 'talent' && (
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
                          <Label htmlFor="edit-usage-exp-date" className="text-xs">Expiration Date</Label>
                          <Input
                            id="edit-usage-exp-date"
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

              {/* Link Asset */}
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
                      const isAssetSelected = selectedAssetId === a.id
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
                            isAssetSelected ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50',
                          )}
                        >
                          <Package className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="flex-1 text-left truncate">{a.name}</span>
                          <span className="text-xs text-gray-400">
                            {a.capacity != null ? `Cap: ${a.capacity}` : 'Unlimited'}
                          </span>
                          {isAssetSelected && (
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

              {/* Notes */}
              <FormSection title="Notes" icon="📝">
                <textarea
                  id="edit-notes"
                  name="notes"
                  rows={3}
                  defaultValue={deliverable.notes ?? ''}
                  className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FormSection>

              {/* Two-column: Proof Requirement + Due Date */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormSection
                  title="Proof Requirement"
                  icon="📷"
                  description="What kind of proof is needed?"
                >
                  <ProofRequirementCards
                    selected={editProofType}
                    onSelect={setEditProofType}
                  />
                </FormSection>

                <FormSection
                  title="Due Date"
                  icon="📅"
                  description="When should this be completed?"
                >
                  <DateQuickPicks
                    selectedDate={editDueDate}
                    onSelectDate={setEditDueDate}
                    selectedQuick={editQuickDate}
                    onSelectQuick={setEditQuickDate}
                  />
                </FormSection>
              </div>

              {/* Error */}
              {editError && (
                <p role="alert" aria-live="assertive" className="text-sm text-destructive">
                  {editError}
                </p>
              )}
            </form>

            {/* ── Divider ─────────────────────────────────────── */}
            <div className="border-t border-gray-100" />

            {/* ── Proof gallery ────────────────────────────────── */}
            <EnhancedProofGallery
              proofs={proofs}
              deliverable={deliverable}
              eventId={eventId}
              deletingProofId={deletingProofId}
              onDeleteProof={handleDeleteProof}
              onOpenLightbox={(i) => {
                setLightboxIndex(i)
                setLightboxOpen(true)
              }}
            />
          </div>
        )}
      </Modal>

      {/* Lightbox */}
      <ProofLightbox
        proofs={proofs}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onDelete={handleLightboxDelete}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deliverable?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deliverable?.title}&quot;. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

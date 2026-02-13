'use client'

import { useMemo, useState } from 'react'
import { Camera, FileText, Play, ExternalLink } from 'lucide-react'
import { CATEGORY_CONFIG, STATUS_CONFIG, formatShortDate } from '@/lib/constants'
import { isImageType, isVideoType, isPdfType, formatFileSize } from '@/lib/proof-utils'
import { useInView } from '@/hooks/use-in-view'
import { ProofLightbox } from '@/components/proof/proof-lightbox'
import type { DeliverableCategory, DeliverableStatus, Proof } from '@/lib/types/database'

interface DeliverableItem {
  id: string
  title: string
  category: DeliverableCategory
  status: DeliverableStatus
  due_date: string | null
  proofs: Proof[]
}

interface DeliverablesSectionProps {
  deliverables: DeliverableItem[]
}

export function DeliverablesSection({ deliverables }: DeliverablesSectionProps) {
  const [lightbox, setLightbox] = useState<{ proofs: Proof[]; index: number } | null>(null)

  const grouped = useMemo(() => {
    const groups = new Map<string, DeliverableItem[]>()
    for (const d of deliverables) {
      const list = groups.get(d.category) ?? []
      list.push(d)
      groups.set(d.category, list)
    }
    return Array.from(groups.entries()).sort((a, b) => {
      const ca = CATEGORY_CONFIG[a[0] as DeliverableCategory]
      const cb = CATEGORY_CONFIG[b[0] as DeliverableCategory]
      return (ca?.sortOrder ?? 99) - (cb?.sortOrder ?? 99)
    })
  }, [deliverables])

  return (
    <div className="mt-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Deliverables</h2>

      {grouped.map(([cat, items]) => {
        const config = CATEGORY_CONFIG[cat as DeliverableCategory]
        const completedCount = items.filter(
          (d) => d.status === 'done' || d.status === 'proved'
        ).length

        return (
          <section key={cat} id={`category-${cat}`} className="scroll-mt-20 mb-10">
            {/* Category sticky header */}
            <div className="sticky top-14 z-[5] bg-white/95 backdrop-blur-sm py-3 border-b border-gray-100 flex items-center justify-between print:static print:bg-white">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${config?.bgColor ?? 'bg-gray-200'}`}
                />
                <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                  {config?.label ?? cat}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {completedCount} of {items.length} completed
              </span>
            </div>

            {/* Deliverable cards */}
            {items.map((d) => (
              <DeliverableCard
                key={d.id}
                deliverable={d}
                onImageClick={(proofs, index) => setLightbox({ proofs, index })}
              />
            ))}
          </section>
        )
      })}

      {/* Lightbox */}
      {lightbox && (
        <ProofLightbox
          proofs={lightbox.proofs}
          initialIndex={lightbox.index}
          open
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual deliverable card
// ---------------------------------------------------------------------------

function DeliverableCard({
  deliverable,
  onImageClick,
}: {
  deliverable: DeliverableItem
  onImageClick: (proofs: Proof[], index: number) => void
}) {
  const { ref, inView } = useInView({ threshold: 0.05 })
  const statusCfg = STATUS_CONFIG[deliverable.status]
  const hasProofs = deliverable.proofs.length > 0
  const maxShow = 6
  const visibleProofs = deliverable.proofs.slice(0, maxShow)
  const overflow = deliverable.proofs.length - maxShow

  return (
    <div
      ref={ref}
      className={`border border-gray-100 rounded-xl overflow-hidden mb-4 -mx-4 sm:mx-0 rounded-none sm:rounded-xl transition-all duration-300 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{deliverable.title}</p>
          {deliverable.due_date && (
            <p className="text-xs text-gray-400 mt-0.5">
              Due {formatShortDate(deliverable.due_date)}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.bgColor} ${statusCfg.color}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* Proof gallery or pending placeholder */}
      {hasProofs ? (
        <div className="bg-gray-50 px-6 py-5 print:bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProofs.map((proof, i) => (
              <ProofThumbnail
                key={proof.id}
                proof={proof}
                onClick={() => onImageClick(deliverable.proofs, i)}
              />
            ))}
          </div>
          {overflow > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              +{overflow} more proof{overflow !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 px-6 py-4 print:bg-white">
          <div className="border border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center justify-center">
            <Camera className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-xs text-gray-300">Proof pending</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Proof thumbnail
// ---------------------------------------------------------------------------

function ProofThumbnail({
  proof,
  onClick,
}: {
  proof: Proof
  onClick: () => void
}) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (isImageType(proof.file_type)) {
    return (
      <div>
        <button
          type="button"
          onClick={onClick}
          className="w-full rounded-lg overflow-hidden aspect-[4/3] bg-gray-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proof.file_url}
            alt={proof.file_name}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform"
          />
        </button>
        <ProofMeta name={proof.file_name} date={formatDate(proof.created_at)} />
      </div>
    )
  }

  if (isPdfType(proof.file_type)) {
    return (
      <div>
        <div className="rounded-lg bg-white border border-gray-100 p-4 flex items-center gap-3">
          <FileText className="h-8 w-8 text-red-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{proof.file_name}</p>
            <p className="text-xs text-gray-400">{formatFileSize(proof.file_size)}</p>
          </div>
          <a
            href={proof.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 shrink-0 flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </a>
        </div>
        <ProofMeta name={proof.file_name} date={formatDate(proof.created_at)} />
      </div>
    )
  }

  if (isVideoType(proof.file_type)) {
    return (
      <div>
        <a
          href={proof.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-gray-900 aspect-[4/3] relative overflow-hidden group"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-10 w-10 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </a>
        <ProofMeta name={proof.file_name} date={formatDate(proof.created_at)} />
      </div>
    )
  }

  // Generic file
  return (
    <div>
      <a
        href={proof.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg bg-white border border-gray-100 p-4 hover:shadow-sm transition-shadow"
      >
        <FileText className="h-6 w-6 text-gray-400 mb-2" />
        <p className="text-sm text-gray-700 truncate">{proof.file_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(proof.file_size)}</p>
      </a>
      <ProofMeta name={proof.file_name} date={formatDate(proof.created_at)} />
    </div>
  )
}

function ProofMeta({ name, date }: { name: string; date: string }) {
  return (
    <div className="mt-1.5 px-0.5">
      <p className="text-xs text-gray-400 truncate">{name}</p>
      <p className="text-xs text-gray-300">Uploaded {date}</p>
    </div>
  )
}

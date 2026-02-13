'use client'

import { FileText, Play, ExternalLink } from 'lucide-react'
import { CATEGORY_CONFIG, STATUS_CONFIG, formatEventDate } from '@/lib/constants'
import { isImageType, isVideoType, isPdfType, formatFileSize } from '@/lib/proof-utils'
import type { RecapData } from '@/lib/types/database'
import type { DeliverableCategory, DeliverableStatus } from '@/lib/types/database'

interface RecapContentProps {
  data: RecapData
}

export function RecapContent({ data }: RecapContentProps) {
  const { recap, organization, event, partner, deliverables, stats } = data
  const fulfillmentPct = stats.total > 0 ? Math.round((stats.proved / stats.total) * 100) : 0
  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 print:px-0 print:py-0">
      {/* Header */}
      <header className="pb-6 border-b border-gray-200 mb-8">
        <p className="text-xl font-semibold text-[#281822]">{organization.name}</p>
        <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">
          Sponsorship Recap Report
        </p>
      </header>

      {/* Title section */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-[#281822]">{event.name}</h1>
        <p className="text-xl text-gray-500 mt-1">{partner.name}</p>
        {(event.date || event.venue) && (
          <p className="text-sm text-gray-400 mt-2">
            {event.date && formatEventDate(event.date)}
            {event.date && event.venue && ' · '}
            {event.venue}
          </p>
        )}
        {recap.cover_note && (
          <div className="border-l-4 border-[#C59C79] bg-[#C59C79]/5 px-5 py-4 mt-6 rounded-r-lg">
            <p className="text-sm text-gray-600 italic whitespace-pre-wrap">{recap.cover_note}</p>
          </div>
        )}
      </section>

      {/* Stats summary */}
      <section className="bg-gray-50 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <StatBlock label="Deliverables Promised" value={stats.total} />
          <StatBlock
            label="Completed"
            value={stats.completed}
            sub={stats.total > 0 ? `${completionPct}%` : undefined}
          />
          <StatBlock
            label="Proof Collected"
            value={stats.proved}
            sub={stats.total > 0 ? `${fulfillmentPct}%` : undefined}
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Fulfillment Rate</p>
            <p className="text-3xl font-bold text-[#C59C79]">{fulfillmentPct}%</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-[#C59C79] rounded-full transition-all duration-300"
            style={{ width: `${fulfillmentPct}%` }}
          />
        </div>
      </section>

      {/* Category breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">By Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(stats.byCategory).map(([cat, { total, completed }]) => {
              const config = CATEGORY_CONFIG[cat as DeliverableCategory]
              if (!config) return null
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0
              return (
                <div
                  key={cat}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-2 w-2 rounded-full ${config.bgColor}`} />
                    <p className="text-sm font-medium">{config.label}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {completed} of {total} completed
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#C59C79] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Deliverables & Proof */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Deliverables &amp; Proof</h2>
        <div className="space-y-4">
          {deliverables.map((d) => {
            const catConfig = CATEGORY_CONFIG[d.category as DeliverableCategory]
            const statusConfig = STATUS_CONFIG[d.status as DeliverableStatus]
            return (
              <div
                key={d.id}
                className="border border-gray-200 rounded-xl p-5 print:break-inside-avoid"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-medium">{d.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {catConfig && (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor}`}
                        >
                          {catConfig.label}
                        </span>
                      )}
                      {d.due_date && (
                        <span className="text-xs text-gray-400">
                          Due {formatEventDate(d.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  {statusConfig && (
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                      {statusConfig.label}
                    </span>
                  )}
                </div>

                {/* Proof grid */}
                {d.proofs.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {d.proofs.map((proof) => (
                      <div key={proof.id}>
                        {isImageType(proof.file_type) ? (
                          <a
                            href={proof.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-gray-100 hover:border-[#C59C79] transition-colors"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={proof.file_url}
                              alt={proof.file_name}
                              className="w-full aspect-video object-cover"
                            />
                          </a>
                        ) : isPdfType(proof.file_type) ? (
                          <a
                            href={proof.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-gray-100 px-4 py-3 hover:border-[#C59C79] transition-colors"
                          >
                            <FileText className="w-5 h-5 text-red-400 shrink-0" />
                            <span className="text-sm text-gray-600 truncate">View PDF</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 ml-auto" />
                          </a>
                        ) : isVideoType(proof.file_type) ? (
                          <a
                            href={proof.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-gray-100 px-4 py-3 hover:border-[#C59C79] transition-colors"
                          >
                            <Play className="w-5 h-5 text-blue-400 shrink-0" />
                            <span className="text-sm text-gray-600 truncate">View Video</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 ml-auto" />
                          </a>
                        ) : (
                          <a
                            href={proof.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-gray-100 px-4 py-3 hover:border-[#C59C79] transition-colors"
                          >
                            <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-600 truncate">{proof.file_name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 ml-auto" />
                          </a>
                        )}
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {proof.file_name} · {formatFileSize(proof.file_size)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 italic mt-3">No proof uploaded</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-gray-200 mt-12 print:mt-6">
        <p className="text-sm text-gray-400">
          Generated by{' '}
          <a
            href="https://seira.global"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-[#C59C79] transition-colors underline underline-offset-2"
          >
            Seira
          </a>
        </p>
        {recap.published_at && (
          <p className="text-xs text-gray-300 mt-1">
            Published {new Date(recap.published_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string
  value: number
  sub?: string
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <span className="text-sm text-gray-400">{sub}</span>}
      </div>
    </div>
  )
}

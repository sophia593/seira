'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Building2, CheckCircle2, AlertTriangle, Search, X, Check, BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SortControl } from '@/components/ui/sort-control'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { computeHealth } from '@/lib/partner-health'
import { formatShortDate } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { OrgPartnerRollup } from '@/lib/types/database'

type FulfillmentFilter = 'all' | 'healthy' | 'at_risk' | 'needs_attention' | 'no_deliverables'
type DealFilter = 'all' | 'under_10k' | '10k_50k' | 'over_50k' | 'no_deal'

type PartnerSort = 'name' | 'events' | 'completion' | 'overdue'
const SORT_OPTIONS = [
  { value: 'name' as const, label: 'Name' },
  { value: 'events' as const, label: 'Events' },
  { value: 'completion' as const, label: 'Completion' },
  { value: 'overdue' as const, label: 'Overdue' },
]

function performanceBorder(p: OrgPartnerRollup): string {
  if (p.total_deliverables === 0) return 'border-l-gray-100'
  if (p.completion_pct >= 80) return 'border-l-green-400'
  if (p.completion_pct < 40) return 'border-l-amber-400'
  return 'border-l-transparent'
}

interface PartnerDirectoryProps {
  partners: OrgPartnerRollup[]
}

export function PartnerDirectory({ partners }: PartnerDirectoryProps) {
  const [sort, setSort] = useState<PartnerSort>('name')
  const [search, setSearch] = useState('')
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>('all')
  const [dealFilter, setDealFilter] = useState<DealFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSelection = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else if (next.size < 3) {
        next.add(name)
      }
      return next
    })
  }

  const hasActiveFilters = search.trim() !== '' || fulfillmentFilter !== 'all' || dealFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setFulfillmentFilter('all')
    setDealFilter('all')
  }

  const filtered = useMemo(() => {
    let list = partners

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.contact_name?.toLowerCase().includes(q) ||
          p.contact_email?.toLowerCase().includes(q),
      )
    }

    if (fulfillmentFilter === 'healthy') list = list.filter((p) => p.completion_pct >= 80 && p.total_deliverables > 0)
    else if (fulfillmentFilter === 'at_risk') list = list.filter((p) => p.completion_pct >= 40 && p.completion_pct < 80 && p.total_deliverables > 0)
    else if (fulfillmentFilter === 'needs_attention') list = list.filter((p) => p.completion_pct < 40 && p.total_deliverables > 0)
    else if (fulfillmentFilter === 'no_deliverables') list = list.filter((p) => p.total_deliverables === 0)

    if (dealFilter === 'under_10k') list = list.filter((p) => p.total_deal_value > 0 && p.total_deal_value < 10000)
    else if (dealFilter === '10k_50k') list = list.filter((p) => p.total_deal_value >= 10000 && p.total_deal_value <= 50000)
    else if (dealFilter === 'over_50k') list = list.filter((p) => p.total_deal_value > 50000)
    else if (dealFilter === 'no_deal') list = list.filter((p) => p.total_deal_value === 0)

    return list
  }, [partners, search, fulfillmentFilter, dealFilter])

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'events') {
          const diff = b.event_count - a.event_count
          return diff !== 0 ? diff : a.name.localeCompare(b.name)
        }
        if (sort === 'completion') {
          const diff = b.completion_pct - a.completion_pct
          return diff !== 0 ? diff : a.name.localeCompare(b.name)
        }
        // overdue
        const diff = b.overdue_count - a.overdue_count
        return diff !== 0 ? diff : a.name.localeCompare(b.name)
      }),
    [filtered, sort],
  )

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-page-title">
            Partners
            {partners.length > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">({partners.length})</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All sponsors and partners across your events.
          </p>
        </div>
      </div>

      {partners.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No partners yet"
          description="Partners will appear once you add sponsors to events."
        />
      ) : (
        <>
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 print:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search partners..."
                className="pl-9 h-9"
              />
            </div>
            <Select value={fulfillmentFilter} onValueChange={(v) => setFulfillmentFilter(v as FulfillmentFilter)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="healthy">Healthy (&ge;80%)</SelectItem>
                <SelectItem value="at_risk">At Risk (40–79%)</SelectItem>
                <SelectItem value="needs_attention">Needs Attention (&lt;40%)</SelectItem>
                <SelectItem value="no_deliverables">No Deliverables</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dealFilter} onValueChange={(v) => setDealFilter(v as DealFilter)}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
                <SelectValue placeholder="All Deals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deals</SelectItem>
                <SelectItem value="under_10k">Under $10K</SelectItem>
                <SelectItem value="10k_50k">$10K–$50K</SelectItem>
                <SelectItem value="over_50k">Over $50K</SelectItem>
                <SelectItem value="no_deal">No Deal Value</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Selection bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-gray-500">{selected.size} selected (max 3)</span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
              >
                Clear
              </button>
              {selected.size >= 2 && (
                <Link
                  href={`/partners/compare?names=${[...selected].map(encodeURIComponent).join(',')}`}
                  className="inline-flex items-center gap-1.5 bg-kurobeni text-white rounded-md h-7 px-3 text-xs font-medium hover:bg-blackberry transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Compare ({selected.size})
                </Link>
              )}
            </div>
          )}

          {/* Sort controls */}
          <div className="flex items-center justify-between mb-3 mt-4">
            <h2 className="text-sm font-semibold">
              {hasActiveFilters ? 'Filtered' : 'All'} partners
              <span className="text-gray-300 font-normal ml-2">{sorted.length}</span>
            </h2>
            <SortControl options={SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>

          {/* Partner rows */}
          {sorted.length === 0 && hasActiveFilters ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No partners match your filters.</p>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 mt-1 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {sorted.map((p) => {
              const health = p.total_deliverables > 0
                ? computeHealth({
                    total: p.total_deliverables,
                    completed: p.completed_deliverables,
                    proved: p.proved_deliverables,
                    overdue: p.overdue_count,
                  })
                : null

              return (
                <Link
                  key={p.name}
                  href={`/partners/${encodeURIComponent(p.name)}`}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 border-l-[3px] hover:bg-gray-50 transition-colors',
                    performanceBorder(p),
                  )}
                >
                  {/* Selection checkbox */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelection(p.name) }}
                    className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                      selected.has(p.name)
                        ? 'bg-kurobeni border-kurobeni text-white'
                        : 'border-gray-300 hover:border-gray-400',
                    )}
                  >
                    {selected.has(p.name) && <Check className="w-3 h-3" />}
                  </button>

                  {/* Primary column */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      {p.total_deliverables > 0 && p.completion_pct >= 80 && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      )}
                      {p.total_deliverables > 0 && p.completion_pct < 40 && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    {/* Contact + deal hint */}
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {[
                        p.contact_name,
                        p.contact_email,
                      ].filter(Boolean).join(' \u00b7 ') || (
                        p.deal_summaries.length > 0
                          ? p.deal_summaries[0].notes
                          : p.events.map((e) => e.name).join(' \u00b7 ')
                      )}
                    </p>
                  </div>

                  {/* Meta */}
                  <span className="hidden sm:block text-xs text-gray-300 whitespace-nowrap shrink-0">
                    {p.event_count} event{p.event_count !== 1 ? 's' : ''} \u00b7 {p.total_deliverables} deliverables
                  </span>

                  {/* Progress */}
                  {p.total_deliverables > 0 ? (
                    <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5">
                      <ProgressBar value={p.completion_pct} size="sm" className="w-24" />
                      {p.overdue_count > 0 && (
                        <span className="text-xs text-red-400">{p.overdue_count} overdue</span>
                      )}
                    </div>
                  ) : (
                    <div className="hidden sm:block w-24 shrink-0" />
                  )}

                  {/* Renewal badge */}
                  {p.next_renewal_date && (
                    <span className="hidden lg:inline-flex text-[10px] text-blue-500 shrink-0">
                      Renews {formatShortDate(p.next_renewal_date)}
                    </span>
                  )}

                  {/* Health */}
                  {health && <HealthIndicator health={health} className="hidden md:flex shrink-0" />}

                  {/* Last recap badge */}
                  {p.last_recap ? (
                    <span
                      className={cn(
                        'hidden lg:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0',
                        p.last_recap.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700',
                      )}
                    >
                      {p.last_recap.status === 'published' ? 'Recap published' : 'Recap draft'}
                    </span>
                  ) : (
                    <span className="hidden lg:inline-flex text-[10px] text-gray-300 shrink-0">
                      No recap
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          )}
        </>
      )}
    </>
  )
}

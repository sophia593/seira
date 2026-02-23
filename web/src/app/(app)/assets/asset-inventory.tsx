'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Package, Plus, Search, X, Pencil, Trash2, Loader2,
  ChevronDown, ChevronUp, Infinity as InfinityIcon, FileText,
} from 'lucide-react'
import { canEditContent, canManageContent } from '@/lib/permissions'
import { deleteAssetAction, seedDefaultAssetsAction } from '@/app/(app)/actions/assets'
import { EmptyState } from '@/components/ui/empty-state'
import { SortControl } from '@/components/ui/sort-control'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/sonner'
import { AssetModal } from './asset-modal'
import type { Asset, OrgRole } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCapacityLabel(capacity: number | null): string {
  return capacity != null ? String(capacity) : 'Unlimited'
}

function getCapacityColor(capacity: number | null): string {
  if (capacity === null) return 'bg-emerald-100 text-emerald-700'
  if (capacity <= 1) return 'bg-red-100 text-red-700'
  if (capacity <= 3) return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

type AssetSort = 'name' | 'capacity' | 'newest'
const SORT_OPTIONS = [
  { value: 'name' as const, label: 'Name' },
  { value: 'capacity' as const, label: 'Capacity' },
  { value: 'newest' as const, label: 'Newest' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AssetInventoryProps {
  assets: Asset[]
  role: OrgRole
}

export function AssetInventory({ assets, role }: AssetInventoryProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<AssetSort>('name')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSeeding, startSeedTransition] = useTransition()

  const canEdit = canEditContent(role)
  const canDelete = canManageContent(role)

  const hasActiveFilters = search.trim() !== ''

  function clearFilters() {
    setSearch('')
  }

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalAssets = assets.length
    const limitedAssets = assets.filter((a) => a.capacity != null)
    const unlimitedCount = assets.filter((a) => a.capacity === null).length
    const totalCapacity = limitedAssets.reduce((sum, a) => sum + (a.capacity ?? 0), 0)
    return { totalAssets, unlimitedCount, totalCapacity, limitedCount: limitedAssets.length }
  }, [assets])

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return assets
    const q = search.toLowerCase()
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q))
    )
  }, [assets, search])

  // Sort
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'capacity') {
          // unlimited (null) sorts last
          const ca = a.capacity ?? Infinity
          const cb = b.capacity ?? Infinity
          const diff = ca - cb
          return diff !== 0 ? diff : a.name.localeCompare(b.name)
        }
        // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }),
    [filtered, sort],
  )

  function handleEdit(a: Asset) {
    setEditingAsset(a)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteAssetAction(id)
    setDeletingId(null)
    if (result.ok) {
      toast.success('Asset removed')
      if (expandedId === id) setExpandedId(null)
    } else {
      toast.error(result.error ?? 'Failed to delete')
    }
  }

  function handleSeedDefaults() {
    startSeedTransition(async () => {
      const result = await seedDefaultAssetsAction()
      if (result.ok) {
        toast.success(`Loaded ${result.count} default assets`)
      } else {
        toast.error(result.error ?? 'Failed to load defaults')
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Assets
            {assets.length > 0 && (
              <span className="text-gray-300 font-normal text-sm ml-2">({assets.length})</span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Track your venue and digital asset inventory with capacity limits.
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {assets.length > 0 && (
              <button
                type="button"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isSeeding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Load defaults
              </button>
            )}
            <button
              type="button"
              onClick={() => { setEditingAsset(null); setModalOpen(true) }}
              className="flex items-center gap-2 px-3.5 py-2 bg-copper text-white text-sm font-medium rounded-lg hover:bg-copper/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add asset
            </button>
          </div>
        )}
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No assets yet"
          description="Add your venue and digital assets to track inventory and capacity across events."
          action={
            canEdit ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-copper text-white text-sm font-medium rounded-lg hover:bg-copper/90 transition-colors disabled:opacity-50"
                >
                  {isSeeding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Load defaults
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingAsset(null); setModalOpen(true) }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add custom asset
                </button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalAssets}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Total Assets</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-gray-900">{summaryStats.limitedCount}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Capped</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalCapacity}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Total Capacity</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-gray-900">{summaryStats.unlimitedCount}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Unlimited</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search by name or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 h-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Sort + count */}
          <div className="flex items-center justify-between mt-4 mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {hasActiveFilters ? 'Filtered' : 'All'} assets
              <span className="text-gray-300 font-normal ml-2">{sorted.length}</span>
            </h2>
            <SortControl options={SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>

          {/* List */}
          {sorted.length === 0 && hasActiveFilters ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No assets match your search.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 mt-1 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              {sorted.map((a) => {
                const isExpanded = expandedId === a.id
                const hasDetails = !!a.notes
                const capacityColor = getCapacityColor(a.capacity)

                return (
                  <div key={a.id}>
                    {/* Main row */}
                    <div
                      className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                        isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50/50'
                      } ${hasDetails ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (hasDetails) {
                          setExpandedId(isExpanded ? null : a.id)
                        }
                      }}
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Name + notes preview */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/assets/${a.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-gray-900 truncate block hover:text-copper transition-colors"
                        >
                          {a.name}
                        </Link>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {a.notes
                            ? a.notes.length > 60 ? a.notes.slice(0, 60) + '...' : a.notes
                            : 'No notes'}
                        </p>
                      </div>

                      {/* Capacity badge */}
                      <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${capacityColor}`}>
                        {a.capacity != null ? (
                          <>Cap: {a.capacity}</>
                        ) : (
                          <><InfinityIcon className="w-3 h-3" /> Unlimited</>
                        )}
                      </span>

                      {/* Mobile capacity — visible only on small screens */}
                      <span className="sm:hidden text-xs font-medium text-gray-500">
                        {a.capacity != null ? `×${a.capacity}` : '\u221E'}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Expand/collapse toggle */}
                        {hasDetails && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : a.id) }}
                            className="p-1.5 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                            title={isExpanded ? 'Collapse' : 'Show details'}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleEdit(a) }}
                            className="p-1.5 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                disabled={deletingId === a.id}
                                className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove {a.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove {a.name} from your asset inventory. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(a.id)}
                                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-gray-50/30 border-t border-gray-100/50">
                        <div className="ml-14 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                          {/* Capacity (mobile) */}
                          <div className="sm:hidden">
                            <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Capacity</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${capacityColor}`}>
                              {formatCapacityLabel(a.capacity)}
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Capacity</p>
                            <p className="text-sm text-gray-700">
                              {a.capacity != null
                                ? `${a.capacity} unit${a.capacity !== 1 ? 's' : ''} available`
                                : 'Unlimited — no cap'}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Added</p>
                            <p className="text-sm text-gray-500">{formatDate(a.created_at)}</p>
                          </div>

                          {a.updated_at !== a.created_at && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Last Updated</p>
                              <p className="text-sm text-gray-500">{formatDate(a.updated_at)}</p>
                            </div>
                          )}

                          {a.notes && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Notes</p>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.notes}</p>
                            </div>
                          )}

                          {/* Quick actions in expanded view */}
                          <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-gray-100">
                            <Link
                              href={`/assets/${a.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs text-copper hover:underline"
                            >
                              <FileText className="w-3 h-3" />
                              View details
                            </Link>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleEdit(a) }}
                                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <AssetModal
        key={editingAsset?.id ?? 'new'}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAsset(null) }}
        asset={editingAsset}
      />
    </div>
  )
}

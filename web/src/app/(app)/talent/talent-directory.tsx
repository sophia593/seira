'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, Plus, Search, X, Pencil, Trash2, Mail, User, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { TALENT_TYPE_CONFIG, TALENT_TYPES } from '@/lib/constants'
import { deleteTalentAction } from '@/app/(app)/actions/talent'
import { canEditContent, canManageContent } from '@/lib/permissions'
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
import { TalentModal } from './talent-modal'
import type { Talent, TalentType, OrgRole } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getInitialsBg(name: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
    'bg-orange-100 text-orange-700',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

type TalentSort = 'name' | 'type' | 'newest' | 'affiliation'
const SORT_OPTIONS = [
  { value: 'name' as const, label: 'Name' },
  { value: 'type' as const, label: 'Type' },
  { value: 'affiliation' as const, label: 'Affiliation' },
  { value: 'newest' as const, label: 'Newest' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TalentDirectoryProps {
  talent: Talent[]
  role: OrgRole
}

export function TalentDirectory({ talent, role }: TalentDirectoryProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TalentType | 'all'>('all')
  const [sort, setSort] = useState<TalentSort>('name')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canEdit = canEditContent(role)
  const canDelete = canManageContent(role)

  const hasActiveFilters = search.trim() !== '' || typeFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setTypeFilter('all')
  }

  // Filter
  const filtered = useMemo(() => {
    let items = talent

    if (typeFilter !== 'all') {
      items = items.filter((t) => t.type === typeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.affiliation && t.affiliation.toLowerCase().includes(q)) ||
          (t.contact_name && t.contact_name.toLowerCase().includes(q)) ||
          (t.contact_email && t.contact_email.toLowerCase().includes(q))
      )
    }

    return items
  }, [talent, search, typeFilter])

  // Sort
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'type') {
          const diff = a.type.localeCompare(b.type)
          return diff !== 0 ? diff : a.name.localeCompare(b.name)
        }
        if (sort === 'affiliation') {
          const aa = a.affiliation ?? ''
          const bb = b.affiliation ?? ''
          const diff = aa.localeCompare(bb)
          return diff !== 0 ? diff : a.name.localeCompare(b.name)
        }
        // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }),
    [filtered, sort],
  )

  // Type counts for filter badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of talent) {
      counts[t.type] = (counts[t.type] ?? 0) + 1
    }
    return counts
  }, [talent])

  function handleEdit(t: Talent) {
    setEditingTalent(t)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteTalentAction(id)
    setDeletingId(null)
    if (result.ok) {
      toast.success('Talent removed')
      if (expandedId === id) setExpandedId(null)
    } else {
      toast.error(result.error ?? 'Failed to delete')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Talent
            {talent.length > 0 && (
              <span className="text-gray-300 font-normal text-sm ml-2">({talent.length})</span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your roster of players, artists, influencers, and speakers.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => { setEditingTalent(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-3.5 py-2 bg-copper text-white text-sm font-medium rounded-lg hover:bg-copper/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add talent
          </button>
        )}
      </div>

      {talent.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No talent added yet"
          description="Build your talent roster — add the players, artists, influencers, and speakers you work with."
          action={
            canEdit ? (
              <button
                type="button"
                onClick={() => { setEditingTalent(null); setModalOpen(true) }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-copper text-white text-sm font-medium rounded-lg hover:bg-copper/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add your first talent
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search by name, affiliation, or contact..."
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

            {/* Type filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {TALENT_TYPES.map((t) => {
                const cfg = TALENT_TYPE_CONFIG[t]
                const count = typeCounts[t] ?? 0
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                    className={`px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      typeFilter === t
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cfg.icon} {cfg.label}
                    {count > 0 && (
                      <span className={`ml-1 ${typeFilter === t ? 'text-white/60' : 'text-gray-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Sort + count */}
          <div className="flex items-center justify-between mt-4 mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {hasActiveFilters ? 'Filtered' : 'All'} talent
              <span className="text-gray-300 font-normal ml-2">{sorted.length}</span>
            </h2>
            <SortControl options={SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>

          {/* List */}
          {sorted.length === 0 && hasActiveFilters ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No talent matches your search or filters.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 mt-1 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              {sorted.map((t) => {
                const cfg = TALENT_TYPE_CONFIG[t.type]
                const isExpanded = expandedId === t.id
                const hasDetails = t.notes || t.contact_name || t.contact_email

                return (
                  <div key={t.id}>
                    {/* Main row */}
                    <div
                      className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                        isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50/50'
                      } ${canEdit ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (hasDetails) {
                          setExpandedId(isExpanded ? null : t.id)
                        } else if (canEdit) {
                          handleEdit(t)
                        }
                      }}
                    >
                      {/* Avatar */}
                      {t.photo_url ? (
                        <img
                          src={t.photo_url}
                          alt={t.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${getInitialsBg(t.name)}`}
                        >
                          {getInitials(t.name)}
                        </div>
                      )}

                      {/* Name + affiliation */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/talent/${t.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-gray-900 truncate block hover:text-copper transition-colors"
                        >
                          {t.name}
                        </Link>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {[
                            t.affiliation,
                            t.contact_email,
                          ].filter(Boolean).join(' \u00b7 ') || 'No details'}
                        </p>
                      </div>

                      {/* Type badge */}
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${cfg.bgColor} ${cfg.color}`}
                      >
                        {cfg.icon} {cfg.label}
                      </span>

                      {/* Contact info — desktop */}
                      <div className="hidden lg:flex items-center gap-3 text-xs text-gray-400 shrink-0 min-w-[140px]">
                        {t.contact_email && (
                          <a
                            href={`mailto:${t.contact_email}`}
                            className="flex items-center gap-1 hover:text-copper transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title={t.contact_email}
                          >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{t.contact_email}</span>
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Expand/collapse toggle */}
                        {hasDetails && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : t.id) }}
                            className="p-1.5 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                            title={isExpanded ? 'Collapse' : 'Show details'}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleEdit(t) }}
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
                                disabled={deletingId === t.id}
                                className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove {t.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove {t.name} from your talent roster. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(t.id)}
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
                          {/* Type (mobile) */}
                          <div className="sm:hidden">
                            <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Type</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cfg.bgColor} ${cfg.color}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </div>

                          {t.affiliation && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Affiliation</p>
                              <p className="text-sm text-gray-700">{t.affiliation}</p>
                            </div>
                          )}
                          {t.contact_name && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Contact</p>
                              <p className="text-sm text-gray-700 flex items-center gap-1.5">
                                <User className="w-3 h-3 text-gray-300" />
                                {t.contact_name}
                              </p>
                            </div>
                          )}
                          {t.contact_email && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Email</p>
                              <a
                                href={`mailto:${t.contact_email}`}
                                className="text-sm text-copper hover:underline flex items-center gap-1.5"
                              >
                                <Mail className="w-3 h-3" />
                                {t.contact_email}
                              </a>
                            </div>
                          )}
                          {t.photo_url && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Photo</p>
                              <a
                                href={t.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-copper hover:underline flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View photo
                              </a>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Added</p>
                            <p className="text-sm text-gray-500">{formatDate(t.created_at)}</p>
                          </div>
                          {t.notes && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Notes</p>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{t.notes}</p>
                            </div>
                          )}
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
      <TalentModal
        key={editingTalent?.id ?? 'new'}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTalent(null) }}
        talent={editingTalent}
      />
    </div>
  )
}

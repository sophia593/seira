'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Layers, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrg } from '@/hooks/use-org'
import { deleteSeasonAction } from '@/app/(app)/actions/seasons'
import { CreateSeasonDialog } from './create-season-dialog'
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
import { ProgressBar } from '@/components/ui/progress-bar'
import { toast } from '@/components/ui/sonner'
import { SortControl } from '@/components/ui/sort-control'
import { formatShortDate } from '@/lib/constants'
import type { SeasonWithStats } from '@/lib/types/database'

interface SeasonListProps {
  seasons: SeasonWithStats[]
}

type SeasonSort = 'date' | 'name' | 'completion'
const SEASON_SORT_OPTIONS = [
  { value: 'date' as const, label: 'Date' },
  { value: 'name' as const, label: 'Name' },
  { value: 'completion' as const, label: 'Completion' },
]

export function SeasonList({ seasons }: SeasonListProps) {
  const router = useRouter()
  const { isAdmin } = useOrg()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SeasonWithStats | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sort, setSort] = useState<SeasonSort>('date')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpenId) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpenId])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const result = await deleteSeasonAction(deleteTarget.id)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete season')
        setIsDeleting(false)
        return
      }
      toast.success('Season deleted')
      setDeleteTarget(null)
      router.refresh()
    } catch {
      toast.error('Failed to delete season')
      setIsDeleting(false)
    }
  }

  const sortedSeasons = useMemo(() => {
    const list = [...seasons]
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'completion') return a.completion_pct - b.completion_pct
      // date: soonest start_date first, nulls last
      if (!a.start_date && !b.start_date) return 0
      if (!a.start_date) return 1
      if (!b.start_date) return -1
      return a.start_date.localeCompare(b.start_date)
    })
    return list
  }, [seasons, sort])

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Seasons
          {seasons.length > 0 && (
            <span className="text-gray-300 font-normal text-lg ml-2">{seasons.length}</span>
          )}
        </h1>
        {isAdmin && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="bg-kurobeni text-white text-sm rounded-md h-9 px-4 hover:bg-blackberry transition-colors"
          >
            + New season
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Group events into seasons or series to track combined performance.
      </p>

      {/* Empty state */}
      {seasons.length === 0 ? (
        <div className="text-center py-16">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No seasons yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create your first season to group related events together.
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="bg-kurobeni text-white text-sm rounded-md h-9 px-4 hover:bg-blackberry transition-colors"
            >
              + new season
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              All seasons
              <span className="text-gray-300 font-normal ml-2">{seasons.length}</span>
            </h2>
            <SortControl options={SEASON_SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>

          <div className="divide-y divide-gray-100">
            {sortedSeasons.map((season) => (
              <div key={season.id} className="group relative">
                <Link
                  href={`/seasons/${season.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Icon + name + date range */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-copper shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">{season.name}</span>
                    </div>
                    {(season.start_date || season.end_date) && (
                      <p className="text-xs text-gray-400 mt-0.5 pl-6">
                        {season.start_date ? formatShortDate(season.start_date) : '—'}
                        {' → '}
                        {season.end_date ? formatShortDate(season.end_date) : '—'}
                      </p>
                    )}
                  </div>

                  {/* Meta: events · deliverables */}
                  <span className="hidden sm:block text-xs text-gray-300 whitespace-nowrap shrink-0">
                    {season.event_count} event{season.event_count !== 1 ? 's' : ''} · {season.total_deliverables} deliverable{season.total_deliverables !== 1 ? 's' : ''}
                  </span>

                  {/* Progress */}
                  {season.total_deliverables > 0 ? (
                    <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5">
                      <ProgressBar value={season.completion_pct} size="sm" className="w-24" />
                    </div>
                  ) : (
                    <div className="hidden sm:block w-[8.5rem] shrink-0" />
                  )}

                  {/* Spacer for menu */}
                  <div className="w-7 shrink-0" />
                </Link>

                {/* Three-dot menu */}
                <div
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  ref={menuOpenId === season.id ? menuRef : undefined}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setMenuOpenId(menuOpenId === season.id ? null : season.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>

                  {menuOpenId === season.id && (
                    <div className="absolute right-0 top-full mt-1 z-[80] w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <Link
                        href={`/seasons/${season.id}`}
                        className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setMenuOpenId(null)}
                      >
                        View
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMenuOpenId(null)
                            setDeleteTarget(season)
                          }}
                          className="flex w-full items-center px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CreateSeasonDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setIsDeleting(false) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Events assigned to &quot;{deleteTarget?.name}&quot; will remain but become unassigned.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Season'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

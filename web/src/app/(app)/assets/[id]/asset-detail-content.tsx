'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Pencil, Trash2, Infinity as InfinityIcon, Clock, CalendarDays, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { toast } from '@/components/ui/sonner'
import { canEditContent, canManageContent } from '@/lib/permissions'
import { deleteAssetAction } from '@/app/(app)/actions/assets'
import { AssetModal } from '../asset-modal'
import { cn } from '@/lib/utils'
import type { Asset, OrgRole } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// ---------------------------------------------------------------------------
// Visual capacity slots
// ---------------------------------------------------------------------------

function CapacitySlots({ capacity }: { capacity: number }) {
  // For very large capacities, show a summarized view
  if (capacity > 12) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-6 rounded-sm bg-blue-200 border border-blue-300"
            />
          ))}
          <span className="text-xs text-gray-400 self-center ml-1">+{capacity - 8} more</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-1">
      {Array.from({ length: capacity }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-5 h-8 rounded-md border-2 transition-colors',
            'bg-blue-100 border-blue-300',
          )}
          title={`Slot ${i + 1}`}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AssetDetailContentProps {
  asset: Asset
  role: OrgRole
}

export function AssetDetailContent({ asset, role }: AssetDetailContentProps) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canEdit = canEditContent(role)
  const isAdmin = canManageContent(role)

  const isUnlimited = asset.capacity === null
  const isScarceCap = !isUnlimited && asset.capacity !== null && asset.capacity <= 2

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteAssetAction(asset.id)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete asset')
        setIsDeleting(false)
        return
      }
      toast.success('Asset deleted')
      router.push('/assets')
    } catch {
      toast.error('Failed to delete asset')
      setIsDeleting(false)
    }
  }

  return (
    <>
      {/* ===== Header ===== */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
            isUnlimited
              ? 'bg-emerald-50 border border-emerald-200'
              : isScarceCap
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-blue-50 border border-blue-200',
          )}>
            <Package className={cn(
              'w-7 h-7',
              isUnlimited ? 'text-emerald-500' : isScarceCap ? 'text-amber-500' : 'text-blue-500',
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">{asset.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Added {timeAgo(asset.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ===== Capacity section — the main event ===== */}
      <section className="mb-8 rounded-xl border border-gray-200 overflow-hidden">
        <div className={cn(
          'px-5 py-4',
          isUnlimited ? 'bg-emerald-50/50' : isScarceCap ? 'bg-amber-50/50' : 'bg-blue-50/50',
        )}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Capacity</h2>
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border',
              isUnlimited
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : isScarceCap
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-blue-100 text-blue-700 border-blue-200',
            )}>
              {isUnlimited ? (
                <><InfinityIcon className="w-3 h-3" /> Unlimited</>
              ) : (
                <>{asset.capacity} available</>
              )}
            </span>
          </div>

          {/* Visual representation */}
          {isUnlimited ? (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-3 rounded-full bg-emerald-200/60 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 animate-pulse" style={{ width: '100%' }} />
              </div>
              <span className="text-xs text-emerald-600 font-medium shrink-0">No limit</span>
            </div>
          ) : asset.capacity != null && (
            <div className="py-2">
              <CapacitySlots capacity={asset.capacity} />
              <p className="text-xs text-gray-500 mt-2">
                {asset.capacity} slot{asset.capacity !== 1 ? 's' : ''} can be assigned per event
              </p>
            </div>
          )}
        </div>

        {/* Contextual hint */}
        <div className="px-5 py-3 bg-white border-t border-gray-100">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              {isUnlimited
                ? 'This asset has no capacity limit. It can be assigned to as many events and partners as needed — great for digital assets like social posts.'
                : isScarceCap
                  ? `Only ${asset.capacity} unit${asset.capacity !== 1 ? 's' : ''} available — plan carefully when assigning this asset to events. Consider adding to capacity if demand exceeds supply.`
                  : `Up to ${asset.capacity} units can be assigned across events. Each unit represents one available slot for a partner deliverable.`
              }
            </p>
          </div>
        </div>
      </section>

      {/* ===== Details grid ===== */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-3.5 h-3.5 text-gray-300" />
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Created</p>
            </div>
            <p className="text-sm text-gray-700">{formatFullDate(asset.created_at)}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-gray-300" />
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Last Updated</p>
            </div>
            <p className="text-sm text-gray-700">
              {asset.updated_at !== asset.created_at
                ? formatFullDate(asset.updated_at)
                : 'Never modified'}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Notes ===== */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Notes</h2>
        {asset.notes ? (
          <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{asset.notes}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">No notes added yet</p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="text-sm text-copper hover:underline mt-1.5 inline-block"
              >
                Add notes for your team
              </button>
            )}
          </div>
        )}
      </section>

      {/* ===== Modals ===== */}
      <AssetModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        asset={showEdit ? asset : null}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{asset.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this asset from your inventory. Any references to it will need to be updated manually. This cannot be undone.
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

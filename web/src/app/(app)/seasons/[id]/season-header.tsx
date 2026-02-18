'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SlideOver } from '@/components/ui/slide-over'
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
import { useOrg } from '@/hooks/use-org'
import { updateSeasonAction, deleteSeasonAction } from '@/app/(app)/actions/seasons'
import { formatShortDate } from '@/lib/constants'
import type { Season } from '@/lib/types/database'

interface SeasonHeaderProps {
  season: Season
}

export function SeasonHeader({ season }: SeasonHeaderProps) {
  const router = useRouter()
  const { canEdit, isAdmin } = useOrg()
  const formRef = useRef<HTMLFormElement>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateSeasonAction(season.id, formData)
      if (!result.ok) {
        setEditError(result.error ?? 'Failed to update season')
        return
      }
      toast.success('Season updated')
      setShowEditDialog(false)
      router.refresh()
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteSeasonAction(season.id)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete season')
        setIsDeleting(false)
        return
      }
      toast.success('Season deleted')
      router.push('/seasons')
      router.refresh()
    } catch {
      toast.error('Failed to delete season')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{season.name}</h1>
          {(season.start_date || season.end_date) && (
            <p className="text-sm text-gray-400 mt-1">
              {season.start_date ? formatShortDate(season.start_date) : '—'}
              {' → '}
              {season.end_date ? formatShortDate(season.end_date) : '—'}
            </p>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit slide-over */}
      <SlideOver
        open={showEditDialog}
        onClose={() => { if (!isPending) setShowEditDialog(false) }}
        title="Edit Season"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEditDialog(false)}
              disabled={isPending}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button type="submit" form="edit-season-form" isLoading={isPending} loadingText="Saving..." className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="edit-season-form" ref={formRef} onSubmit={handleEdit} className="space-y-5">
          <div className="space-y-3">
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">Season Details</p>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Season Name *</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={season.name}
                required
                autoFocus
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">Date Range</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  name="start_date"
                  type="date"
                  defaultValue={season.start_date ?? ''}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  name="end_date"
                  type="date"
                  defaultValue={season.end_date ?? ''}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {editError && (
            <p className="text-sm text-destructive">{editError}</p>
          )}
        </form>
      </SlideOver>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Events assigned to this season will remain but become unassigned.
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
    </>
  )
}

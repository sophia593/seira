'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { deletePartner } from '@/lib/db/partners'
import { PartnerFormDialog } from '@/components/event-detail/partner-form-dialog'
import type { Partner } from '@/lib/types/database'

interface PartnerActionsProps {
  partner: Partner
  eventId: string
  orgId: string
}

export function PartnerActions({ partner, eventId, orgId }: PartnerActionsProps) {
  const router = useRouter()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const supabase = createClient()
      await deletePartner(supabase, partner.id, orgId)
      toast.success('Partner deleted')
      router.push(`/events/${eventId}`)
    } catch (error) {
      toast.error('Failed to delete partner')
      console.error(error)
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
        <Pencil className="w-4 h-4 mr-1" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDeleteDialog(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </Button>

      {/* Edit dialog */}
      <PartnerFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        eventId={eventId}
        orgId={orgId}
        partner={partner}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{partner.name}&quot; and all its deliverables.
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
              {isDeleting ? 'Deleting...' : 'Delete Partner'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

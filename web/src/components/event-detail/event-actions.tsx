'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
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
import { updateEventStatus, deleteEvent } from '@/lib/db/events'
import { EVENT_STATUS_FLOW, EVENT_STATUS_CONFIG } from '@/lib/constants'
import { EventFormDialog } from '@/components/events/event-form-dialog'
import type { Event, EventStatus } from '@/lib/types/database'

interface EventActionsProps {
  event: Event
  orgId: string
}

export function EventActions({ event, orgId }: EventActionsProps) {
  const router = useRouter()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus: EventStatus) => {
    if (newStatus === event.status) return

    setIsUpdatingStatus(true)
    try {
      const supabase = createClient()
      await updateEventStatus(supabase, event.id, orgId, newStatus)
      toast.success(`Status updated to ${EVENT_STATUS_CONFIG[newStatus].label}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update status')
      console.error(error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const supabase = createClient()
      await deleteEvent(supabase, event.id, orgId)
      toast.success('Event deleted')
      router.push('/events')
    } catch (error) {
      toast.error('Failed to delete event')
      console.error(error)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isUpdatingStatus}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Event
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <RefreshCw className="w-4 h-4 mr-2" />
              Change Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {EVENT_STATUS_FLOW.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={status === event.status}
                >
                  <span className="mr-2">{EVENT_STATUS_CONFIG[status].icon}</span>
                  {EVENT_STATUS_CONFIG[status].label}
                  {status === event.status && (
                    <span className="ml-auto text-xs text-muted-foreground">Current</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <EventFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        orgId={orgId}
        event={event}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{event.name}&quot; and all its partners and deliverables.
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
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

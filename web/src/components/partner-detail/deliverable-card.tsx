'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, AlertTriangle, MoreHorizontal, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CategoryBadge, StatusBadge } from '@/components/ui/badges'
import { toast } from '@/components/ui/sonner'
import { advanceDeliverableStatusAction, deleteDeliverableAction } from '@/app/(app)/actions'
import {
  STATUS_CONFIG,
  isOverdue,
  formatShortDate,
  getNextStatus,
  PROOF_REQUIRED_CONFIG,
} from '@/lib/constants'
import type { Deliverable, DeliverableStatus } from '@/lib/types/database'

interface DeliverableCardProps {
  deliverable: Deliverable
  eventId: string
  onEdit: (deliverable: Deliverable) => void
}

export function DeliverableCard({ deliverable, eventId, onEdit }: DeliverableCardProps) {
  const router = useRouter()
  const [status, setStatus] = useState<DeliverableStatus>(deliverable.status)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const overdue = isOverdue(status, deliverable.due_date)
  const proofConfig = deliverable.proof_required
    ? PROOF_REQUIRED_CONFIG[deliverable.proof_required]
    : null
  const nextStatus = getNextStatus(status)

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return

    const prevStatus = status
    setStatus(nextStatus) // Optimistic update
    setIsUpdating(true)

    try {
      const result = await advanceDeliverableStatusAction(
        deliverable.id,
        eventId,
        deliverable.partner_id,
        nextStatus
      )
      if (!result.ok) {
        setStatus(prevStatus) // Rollback
        toast.error(result.error)
      }
    } catch (error) {
      setStatus(prevStatus) // Rollback
      toast.error('Failed to update status')
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this deliverable?')) return

    setIsDeleting(true)
    try {
      const result = await deleteDeliverableAction(
        deliverable.id,
        eventId,
        deliverable.partner_id
      )
      if (!result.ok) {
        toast.error(result.error)
        setIsDeleting(false)
        return
      }
      toast.success('Deliverable deleted')
    } catch (error) {
      toast.error('Failed to delete deliverable')
      console.error(error)
      setIsDeleting(false)
    }
  }

  return (
    <Card className={overdue ? 'border-amber-300' : undefined}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left side: Category, title, meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge category={deliverable.category} />
              <StatusBadge status={status} />
              {overdue && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>
            <h3 className="font-medium mb-1">{deliverable.title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {deliverable.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatShortDate(deliverable.due_date)}
                </span>
              )}
              {proofConfig && (
                <span className="flex items-center gap-1">
                  <span>{proofConfig.icon}</span>
                  {proofConfig.label} required
                </span>
              )}
            </div>
            {deliverable.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {deliverable.notes}
              </p>
            )}
          </div>

          {/* Right side: Advance button and actions */}
          <div className="flex items-center gap-2 shrink-0">
            {nextStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdvanceStatus}
                disabled={isUpdating}
                className="gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                {STATUS_CONFIG[nextStatus].label}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(deliverable)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

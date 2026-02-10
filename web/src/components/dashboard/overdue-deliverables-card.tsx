'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge } from '@/components/ui/badges'
import { formatShortDate } from '@/lib/constants'
import type { DeliverableWithPartner } from '@/lib/types/database'

interface OverdueDeliverable extends DeliverableWithPartner {
  event_name: string
}

interface OverdueDeliverablesCardProps {
  deliverables: OverdueDeliverable[]
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

export function OverdueDeliverablesCard({ deliverables }: OverdueDeliverablesCardProps) {
  if (deliverables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            Overdue Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No overdue items</p>
            <p className="text-sm mt-1">Great job staying on track!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Overdue Items
          <span className="ml-auto text-sm font-normal text-amber-600">
            {deliverables.length} item{deliverables.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deliverables.map((deliverable) => {
          const daysOverdue = deliverable.due_date ? getDaysOverdue(deliverable.due_date) : 0

          return (
            <Link
              key={deliverable.id}
              href={`/events/${deliverable.event_id}/partners/${deliverable.partner_id}`}
              className="block p-3 -mx-1 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-amber-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryBadge category={deliverable.category} showIcon={false} />
                    <span className="font-medium truncate">{deliverable.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {deliverable.partner.name} &middot; {deliverable.event_name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-amber-600">
                    {daysOverdue}d overdue
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatShortDate(deliverable.due_date)}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

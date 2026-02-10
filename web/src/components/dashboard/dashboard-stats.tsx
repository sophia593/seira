'use client'

import Link from 'next/link'
import { CalendarDays, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  href?: string
  variant?: 'default' | 'warning' | 'info' | 'success'
}

function StatCard({ label, value, icon: Icon, href, variant = 'default' }: StatCardProps) {
  const content = (
    <Card className={cn(
      'transition-colors',
      href && 'hover:bg-muted/50 cursor-pointer'
    )}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            'p-3 rounded-lg',
            variant === 'warning' && 'bg-amber-100 text-amber-700',
            variant === 'info' && 'bg-blue-100 text-blue-700',
            variant === 'success' && 'bg-green-100 text-green-700',
            variant === 'default' && 'bg-muted text-muted-foreground'
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

interface DashboardStatsProps {
  upcomingEventsCount: number
  overdueCount: number
  doneCount: number
}

export function DashboardStats({
  upcomingEventsCount,
  overdueCount,
  doneCount,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Upcoming Events"
        value={upcomingEventsCount}
        icon={CalendarDays}
        href="/events"
        variant="info"
      />
      <StatCard
        label="Overdue Items"
        value={overdueCount}
        icon={AlertTriangle}
        variant={overdueCount > 0 ? 'warning' : 'default'}
      />
      <StatCard
        label="Done Items"
        value={doneCount}
        icon={CheckCircle}
        variant="success"
      />
    </div>
  )
}

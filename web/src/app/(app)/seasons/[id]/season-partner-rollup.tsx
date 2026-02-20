'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { useOrg } from '@/hooks/use-org'
import { SortControl } from '@/components/ui/sort-control'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { computeHealth } from '@/lib/partner-health'
import { canManageRecaps } from '@/lib/permissions'
import { createSeasonRecapAction } from '@/app/(app)/actions/recaps'
import type { SeasonPartnerRollup } from '@/lib/types/database'

interface SeasonPartnerRollupSectionProps {
  seasonId: string
  partners: SeasonPartnerRollup[]
}

function performanceBorder(p: SeasonPartnerRollup): string {
  if (p.total_deliverables === 0) return 'border-l-gray-100'
  if (p.completion_pct >= 80) return 'border-l-green-400'
  if (p.completion_pct < 40) return 'border-l-amber-400'
  return 'border-l-transparent'
}

type PartnerSort = 'completion' | 'name' | 'overdue'
const PARTNER_SORT_OPTIONS = [
  { value: 'completion' as const, label: 'Completion' },
  { value: 'name' as const, label: 'Name' },
  { value: 'overdue' as const, label: 'Overdue' },
]

export function SeasonPartnerRollupSection({ seasonId, partners }: SeasonPartnerRollupSectionProps) {
  const router = useRouter()
  const { role } = useOrg()
  const hasRecapPermission = canManageRecaps(role)
  const [isPending, startTransition] = useTransition()
  const [sort, setSort] = useState<PartnerSort>('completion')

  const sorted = useMemo(
    () =>
      [...partners].sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'overdue') {
          const diff = b.overdue_count - a.overdue_count
          return diff !== 0 ? diff : a.name.localeCompare(b.name)
        }
        // completion: highest first
        const diff = b.completion_pct - a.completion_pct
        return diff !== 0 ? diff : a.name.localeCompare(b.name)
      }),
    [partners, sort]
  )

  const handleGenerateRecap = (partnerName: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('season_id', seasonId)
      formData.set('partner_name', partnerName)

      const result = await createSeasonRecapAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to create recap')
        return
      }
      toast.success('Season recap created')
      router.push(`/seasons/${seasonId}/recap/${result.id}`)
    })
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">No partners in this season</p>
        <p className="text-xs text-muted-foreground mt-1">
          Partners will appear here once events in this season have sponsors added.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">
          Partners
          <span className="text-gray-300 font-normal ml-2">{sorted.length}</span>
        </h2>
        <SortControl options={PARTNER_SORT_OPTIONS} value={sort} onChange={setSort} />
      </div>

      <div className="divide-y divide-gray-100">
        {sorted.map((p) => (
          <div
            key={p.name}
            className={`flex items-center gap-4 px-4 py-3 border-l-[3px] ${performanceBorder(p)}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                {p.total_deliverables > 0 && p.completion_pct >= 80 && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                )}
                {p.total_deliverables > 0 && p.completion_pct < 40 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {p.events.map((e) => e.name).join(' \u00b7 ')}
              </p>
            </div>

            <span className="hidden sm:block text-xs text-gray-300 whitespace-nowrap shrink-0">
              {p.completed_deliverables}/{p.total_deliverables} deliverables
              {p.event_count > 1 && ` \u00b7 ${p.event_count} events`}
            </span>

            {p.total_deliverables > 0 ? (
              <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5">
                <ProgressBar value={p.completion_pct} size="sm" className="w-24" />
                {p.overdue_count > 0 && (
                  <span className="text-xs text-red-400">{p.overdue_count} overdue</span>
                )}
              </div>
            ) : (
              <div className="hidden sm:block w-24 shrink-0" />
            )}

            {p.total_deliverables > 0 && (() => {
              const health = computeHealth({
                total: p.total_deliverables,
                completed: p.completed_deliverables,
                proved: p.proved_deliverables,
                overdue: p.overdue_count,
              })
              return health ? <HealthIndicator health={health} className="hidden md:flex shrink-0" /> : null
            })()}

            {hasRecapPermission && p.total_deliverables > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleGenerateRecap(p.name)}
                className="shrink-0 gap-1 text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Season Recap</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

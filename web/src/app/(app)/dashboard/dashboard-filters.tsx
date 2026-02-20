'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { X, Download } from 'lucide-react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { CATEGORIES, CATEGORY_CONFIG, STATUS_FLOW, STATUS_CONFIG } from '@/lib/constants'

interface FilterOption {
  id: string
  name: string
}

interface DashboardFiltersProps {
  events: FilterOption[]
  seasons: FilterOption[]
  partnerNames: string[]
}

export function DashboardFilters({ events, seasons, partnerNames }: DashboardFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentEvent = searchParams.get('event') ?? ''
  const currentSeason = searchParams.get('season') ?? ''
  const currentPartner = searchParams.get('partner') ?? ''
  const currentCategory = searchParams.get('category') ?? ''
  const currentStatus = searchParams.get('status') ?? ''

  const hasFilters = !!(currentEvent || currentSeason || currentPartner || currentCategory || currentStatus)

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Event and season are mutually exclusive
      if (key === 'event' && value) params.delete('season')
      if (key === 'season' && value) params.delete('event')

      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams],
  )

  const clearAll = useCallback(() => {
    router.replace(pathname)
  }, [router, pathname])

  return (
    <div className="mb-6 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        {/* Event */}
        <Select
          value={currentEvent || '__all__'}
          onValueChange={(v) => updateParam('event', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Events</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Season */}
        {seasons.length > 0 && (
          <Select
            value={currentSeason || '__all__'}
            onValueChange={(v) => updateParam('season', v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
              <SelectValue placeholder="All Seasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Seasons</SelectItem>
              {seasons.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Partner */}
        {partnerNames.length > 0 && (
          <Select
            value={currentPartner || '__all__'}
            onValueChange={(v) => updateParam('partner', v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
              <SelectValue placeholder="All Partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Partners</SelectItem>
              {partnerNames.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Category */}
        <Select
          value={currentCategory || '__all__'}
          onValueChange={(v) => updateParam('category', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={currentStatus || '__all__'}
          onValueChange={(v) => updateParam('status', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            {STATUS_FLOW.map((st) => (
              <SelectItem key={st} value={st}>
                {STATUS_CONFIG[st].icon} {STATUS_CONFIG[st].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        {/* Export CSV */}
        <div className="flex items-center gap-3 ml-auto">
          <a
            href={`/api/export/deliverables?${searchParams.toString()}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-3 w-3" />
            Deliverables
          </a>
          <a
            href={`/api/export/partners?${currentEvent ? `event=${currentEvent}` : ''}${currentSeason ? `season=${currentSeason}` : ''}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-3 w-3" />
            Partners
          </a>
        </div>
      </div>
    </div>
  )
}

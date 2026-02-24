'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/sonner'
import { markCategoryDoneAction } from '@/app/(app)/actions/deliverables'
import { CATEGORY_CONFIG } from '@/lib/constants'
import type { DeliverableCategory } from '@/lib/types/database'

interface GameDayActionsProps {
  eventId: string
  categoryCounts: Record<string, { total: number; incomplete: number }>
}

export function GameDayActions({ eventId, categoryCounts }: GameDayActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const categories = Object.entries(categoryCounts)
    .filter(([, c]) => c.incomplete > 0)
    .sort(([a], [b]) => a.localeCompare(b))

  if (categories.length === 0) return null

  const handleMark = (category: string) => {
    setOpen(false)
    startTransition(async () => {
      const result = await markCategoryDoneAction(eventId, category as DeliverableCategory)
      if (result.ok) {
        toast.success(`Marked ${result.count} deliverable${result.count !== 1 ? 's' : ''} as done`)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to update')
      }
    })
  }

  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(!open)}
            disabled={isPending}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 h-9 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors',
              isPending && 'opacity-50',
            )}
          >
            <Zap className="w-4 h-4" />
            Game Day
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Quickly mark categories as done during the event</TooltipContent>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-[80] w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-400 font-medium">
            Mark all as done
          </p>
          {categories.map(([cat, counts]) => {
            const config = CATEGORY_CONFIG[cat as DeliverableCategory]
            return (
              <button
                key={cat}
                onClick={() => handleMark(cat)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <span>
                  {config?.icon} {config?.label ?? cat}
                </span>
                <span className="text-xs text-gray-400">{counts.incomplete} remaining</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

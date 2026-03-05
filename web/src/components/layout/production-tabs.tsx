'use client'

import Link from 'next/link'
import { useSidebarState } from '@/hooks/use-sidebar-state'

const TABS = [
  { label: 'Overview', section: 'overview', segment: '' },
  { label: 'Crew', section: 'crew', segment: '/crew' },
  { label: 'Schedule', section: 'schedule', segment: '/schedule' },
  { label: 'Call Sheets', section: 'call-sheets', segment: '/call-sheets' },
  { label: 'Documents', section: 'documents', segment: '/documents' },
  { label: 'Tasks', section: 'tasks', segment: '/tasks' },
]

export function ProductionTabs() {
  const { currentPage, activeProductionId, isSectionActive } = useSidebarState()

  if (currentPage !== 'production' || !activeProductionId) return null

  const base = `/production/${activeProductionId}`

  return (
    <div className="flex items-center gap-6">
      {TABS.map((tab) => {
        const href = `${base}${tab.segment}`
        const active = isSectionActive(tab.section)

        return (
          <Link
            key={tab.label}
            href={href}
            className="relative transition-colors duration-150"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: active ? '#C4363A' : '#71717A',
              paddingBottom: 17,
              marginBottom: -17,
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = '#18181B'
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = '#71717A'
            }}
          >
            {tab.label}
            {active && (
              <span
                className="absolute bottom-0 left-0 right-0"
                style={{ height: 2, backgroundColor: '#C4363A' }}
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}

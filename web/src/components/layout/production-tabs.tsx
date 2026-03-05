'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'

const TABS = [
  { label: 'Overview', segment: '' },
  { label: 'Crew', segment: '/crew' },
  { label: 'Schedule', segment: '/schedule' },
  { label: 'Call Sheets', segment: '/call-sheets' },
  { label: 'Documents', segment: '/documents' },
  { label: 'Tasks', segment: '/tasks' },
]

export function ProductionTabs() {
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()

  if (!pathname.startsWith('/production/') || !params.id) return null

  const base = `/production/${params.id}`

  return (
    <div className="flex items-center gap-6">
      {TABS.map((tab) => {
        const href = `${base}${tab.segment}`
        const active = tab.segment === ''
          ? pathname === base
          : pathname.startsWith(href)

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

'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useSidebarState } from '@/hooks/use-sidebar-state'

const SECTION_LABELS: Record<string, string> = {
  crew: 'Crew',
  schedule: 'Schedule',
  'call-sheets': 'Call Sheets',
  documents: 'Documents',
  tasks: 'Tasks',
}

export function Breadcrumbs() {
  const { currentPage, activeProduction, activeSection } = useSidebarState()

  if (currentPage === 'dashboard') {
    return <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>Dashboard</span>
  }

  if (currentPage === 'settings') {
    return <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>Settings</span>
  }

  if (currentPage === 'new-production') {
    return <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>New Production</span>
  }

  if (currentPage === 'production' && activeProduction) {
    const sectionLabel = activeSection && activeSection !== 'overview'
      ? SECTION_LABELS[activeSection]
      : null

    if (sectionLabel) {
      return (
        <div className="flex items-center">
          <Link
            href={`/production/${activeProduction.id}`}
            className="hover:underline"
            style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}
          >
            {activeProduction.name}
          </Link>
          <ChevronRight className="mx-2 size-4 text-[#71717A]" />
          <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>{sectionLabel}</span>
        </div>
      )
    }

    return <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>{activeProduction.name}</span>
  }

  return null
}

'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const PRODUCTIONS: Record<string, string> = {
  '1': 'Untitled Horror Short',
  '2': 'Senior Thesis Film',
  '3': 'Nike Commercial',
}

const SECTION_LABELS: Record<string, string> = {
  crew: 'Crew',
  schedule: 'Schedule',
  'call-sheets': 'Call Sheets',
  documents: 'Documents',
  tasks: 'Tasks',
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()

  if (pathname === '/dashboard') {
    return <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>Dashboard</span>
  }

  if (pathname === '/settings') {
    return <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>Settings</span>
  }

  if (pathname === '/productions/new') {
    return <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>New Production</span>
  }

  if (pathname.startsWith('/production/') && params.id) {
    const name = PRODUCTIONS[params.id] ?? `Production ${params.id}`
    const segments = pathname.split('/').filter(Boolean)
    // segments: ["production", id] or ["production", id, "crew"]
    const section = segments[2]
    const sectionLabel = section ? SECTION_LABELS[section] : null

    if (sectionLabel) {
      return (
        <div className="flex items-center">
          <Link
            href={`/production/${params.id}`}
            className="hover:underline"
            style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}
          >
            {name}
          </Link>
          <ChevronRight className="mx-2 size-4 text-[#71717A]" />
          <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>{sectionLabel}</span>
        </div>
      )
    }

    return <span style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>{name}</span>
  }

  return null
}

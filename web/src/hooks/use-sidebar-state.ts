'use client'

import { usePathname, useParams } from 'next/navigation'
import { getProductionById, type Production } from '@/lib/constants/test-productions'

type CurrentPage = 'dashboard' | 'production' | 'settings' | 'new-production'
type Section = 'overview' | 'crew' | 'schedule' | 'call-sheets' | 'documents' | 'tasks' | null

const SECTION_MAP: Record<string, Section> = {
  crew: 'crew',
  schedule: 'schedule',
  'call-sheets': 'call-sheets',
  documents: 'documents',
  tasks: 'tasks',
}

export function useSidebarState() {
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()

  let currentPage: CurrentPage = 'dashboard'
  let activeProductionId: string | null = null
  let activeSection: Section = null

  if (pathname === '/settings') {
    currentPage = 'settings'
  } else if (pathname === '/productions/new') {
    currentPage = 'new-production'
  } else if (pathname.startsWith('/production/') && params.id) {
    currentPage = 'production'
    activeProductionId = params.id
    const segments = pathname.split('/').filter(Boolean)
    const sectionSlug = segments[2]
    activeSection = sectionSlug ? (SECTION_MAP[sectionSlug] ?? null) : 'overview'
  }

  const activeProduction: Production | null = activeProductionId
    ? getProductionById(activeProductionId)
    : null

  return {
    currentPage,
    activeProductionId,
    activeSection,
    activeProduction,

    isDashboardActive: currentPage === 'dashboard',
    isSettingsActive: currentPage === 'settings',
    isProductionActive: (productionId: string) =>
      currentPage === 'production' && activeProductionId === productionId,
    isSectionActive: (section: string) => activeSection === section,
  }
}

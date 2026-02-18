'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/settings', label: 'General' },
  { href: '/settings/team', label: 'Team' },
  { href: '/settings/templates', label: 'Templates' },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-gray-100 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive =
          tab.href === '/settings'
            ? pathname === '/settings'
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
              isActive
                ? 'border-kurobeni text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

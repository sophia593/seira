'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'how it works', href: '/how-it-works' },
  { label: 'pricing', href: '/pricing' },
  { label: 'blog', href: '/blog' },
]

interface MarketingNavProps {
  variant?: 'dark' | 'light'
}

export function MarketingNav({ variant = 'dark' }: MarketingNavProps) {
  const isDark = variant === 'dark'
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className={cn(
        'left-0 right-0 z-50 px-6 py-5',
        isDark
          ? mobileOpen
            ? 'absolute top-0 bg-kurobeni'
            : 'absolute top-0'
          : 'relative bg-white border-b',
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Logo color={isDark ? 'brand' : 'default'} animated />

        {/* Page links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors lowercase',
                isDark
                  ? 'text-white/50 hover:text-white'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth links — desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className={cn(
              'text-sm font-medium transition-colors lowercase',
              isDark
                ? 'text-white/60 hover:text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            log in
          </Link>
          <Link
            href="/signup"
            className={cn(
              'inline-flex items-center h-9 px-4 rounded-xl text-sm font-semibold lowercase transition-colors',
              isDark
                ? 'bg-white text-kurobeni hover:bg-white/90'
                : 'bg-copper text-white hover:bg-copper/90',
            )}
          >
            get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            'md:hidden p-2 -mr-2 rounded-lg transition-colors',
            isDark
              ? 'text-white/60 hover:text-white hover:bg-white/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-gray-100',
          )}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={cn(
            'md:hidden mt-4 pb-4 border-t pt-4',
            isDark ? 'border-white/10' : 'border-gray-200',
          )}
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-sm font-medium transition-colors lowercase py-1',
                  isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}

            <div
              className={cn(
                'border-t pt-3 mt-1 flex flex-col gap-3',
                isDark ? 'border-white/10' : 'border-gray-200',
              )}
            >
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-sm font-medium transition-colors lowercase py-1',
                  isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'inline-flex items-center justify-center h-9 px-4 rounded-xl text-sm font-semibold lowercase transition-colors',
                  isDark
                    ? 'bg-white text-kurobeni hover:bg-white/90'
                    : 'bg-copper text-white hover:bg-copper/90',
                )}
              >
                get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

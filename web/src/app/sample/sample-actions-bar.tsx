'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Printer } from 'lucide-react'
import { GlobeIcon } from '@/components/logo'

export function SampleActionsBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-xl border-b z-50 print:hidden transition-shadow ${
        scrolled ? 'shadow-md border-gray-100' : 'border-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <GlobeIcon size={18} className="text-copper" />
          <span className="text-sm font-semibold text-kurobeni lowercase">seira</span>
        </Link>

        {/* Center context */}
        <p className="hidden sm:block text-xs text-gray-400 truncate max-w-[200px] md:max-w-xs">
          Metro National Insurance — 2025 Summer Classic
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 h-8 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-copper text-white px-4 h-8 text-xs font-medium hover:bg-copper/90 transition-colors lowercase"
          >
            try seira free
          </Link>
        </div>
      </div>
    </div>
  )
}

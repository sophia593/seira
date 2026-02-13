'use client'

import { useEffect, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { GlobeIcon } from '@/components/logo'

interface PublicRecapActionsProps {
  recapId: string
  shareToken: string
  eventName: string
  partnerName: string
}

export function PublicRecapActions({
  recapId,
  shareToken,
  eventName,
  partnerName,
}: PublicRecapActionsProps) {
  const pdfUrl = `/api/recap/${recapId}/pdf?token=${shareToken}`
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b z-50 print:hidden transition-shadow ${
        scrolled ? 'shadow-md border-gray-100' : 'border-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <GlobeIcon size={18} className="text-[#C59C79]" />
          <span className="text-sm font-semibold text-[#281822] lowercase">seira</span>
        </div>

        {/* Center context */}
        <p className="hidden sm:block text-xs text-gray-400 truncate max-w-[200px] md:max-w-xs">
          {partnerName} — {eventName}
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
          <a
            href={pdfUrl}
            download
            className="inline-flex items-center gap-1.5 rounded-md bg-[#281822] text-white px-4 h-8 text-xs font-medium hover:bg-[#281822]/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </a>
        </div>
      </div>
    </div>
  )
}

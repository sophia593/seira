'use client'

import { Download, Printer } from 'lucide-react'
import { GlobeIcon } from '@/components/logo'

interface PublicRecapActionsProps {
  recapId: string
  shareToken: string
}

export function PublicRecapActions({ recapId, shareToken }: PublicRecapActionsProps) {
  const pdfUrl = `/api/recap/${recapId}/pdf?token=${shareToken}`

  return (
    <div className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-100 z-50 print:hidden">
      <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GlobeIcon size={18} className="text-[#C59C79]" />
          <span className="text-sm font-semibold text-[#281822] lowercase">seira</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 h-8 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <a href={pdfUrl} download>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#C59C79] bg-white px-3 h-8 text-xs text-[#C59C79] hover:bg-[#C59C79]/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </a>
        </div>
      </div>
    </div>
  )
}

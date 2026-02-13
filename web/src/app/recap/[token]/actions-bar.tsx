'use client'

import { Download, Printer } from 'lucide-react'

interface PublicRecapActionsProps {
  recapId: string
  shareToken: string
}

export function PublicRecapActions({ recapId, shareToken }: PublicRecapActionsProps) {
  const pdfUrl = `/api/recap/${recapId}/pdf?token=${shareToken}`

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 print:hidden">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <a href={pdfUrl} download>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#C59C79] bg-white px-3 py-1.5 text-sm text-[#C59C79] hover:bg-[#C59C79]/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </a>
      </div>
    </div>
  )
}

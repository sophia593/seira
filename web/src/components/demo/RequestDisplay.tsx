'use client'

import React, { useState } from 'react'
import type { RequestMeta, DemoStage } from './types'

// =============================================================================
// Component
// =============================================================================

interface RequestDisplayProps {
  query: string
  meta: RequestMeta
  stage: DemoStage
}

export default function RequestDisplay({ query, meta, stage }: RequestDisplayProps) {
  const [showUnderstood, setShowUnderstood] = useState(false)

  const isVisible = stage >= 0

  return (
    <div
      className={`
        bg-white/[0.03] rounded-[14px] border border-white/[0.06]
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
      `}
    >
      {/* Main request bar */}
      <div className="flex items-center gap-5 p-5 md:p-6">
        {/* Icon */}
        <div
          className="
            w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0
            bg-[#cfa872]/10 border border-[#cfa872]/15 text-[#cfa872]
          "
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        {/* Query text */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-[#f5f2ed] tracking-[-0.01em] truncate">
            &ldquo;{query}&rdquo;
          </p>
        </div>

        {/* Metadata pills */}
        <div className="hidden md:flex items-center gap-4 text-[13px] text-[#7a756e] shrink-0">
          <span>{meta.date}</span>
          <span className="text-[#4a4744]">·</span>
          <span>
            {meta.travelers} traveler{meta.travelers !== 1 ? 's' : ''}
          </span>
          <span className="text-[#4a4744]">·</span>
          <span>
            {meta.nights} night{meta.nights !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* "What Seira understood" expandable row (optional) */}
      {meta.understood && meta.understood.length > 0 && (
        <div className="border-t border-white/[0.04]">
          <button
            onClick={() => setShowUnderstood(!showUnderstood)}
            className="
              w-full px-5 md:px-6 py-3 flex items-center justify-between
              text-xs text-[#5a5550] hover:text-[#7a756e] transition-colors
            "
          >
            <span className="uppercase tracking-wide font-medium">
              {showUnderstood ? 'Hide' : 'See'} what Seira understood
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform duration-200 ${showUnderstood ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Expanded content */}
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-out
              ${showUnderstood ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="px-5 md:px-6 pb-4 flex flex-wrap gap-2">
              {meta.understood.map((item, i) => (
                <span
                  key={i}
                  className="
                    text-xs text-[#9a958e] bg-white/[0.04]
                    px-3 py-1.5 rounded-md
                  "
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

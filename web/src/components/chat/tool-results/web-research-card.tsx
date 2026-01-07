'use client'

import { memo, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Info,
  MapPin,
  ShieldCheck,
  Ticket,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface Source {
  title: string
  url: string
  domain?: string
  snippet?: string
  is_official?: boolean
}

interface WebResearchCardProps {
  content: string
  sources: Source[]
  searchType?: string
  query?: string
  className?: string
  maxContentHeight?: number
  defaultCollapsed?: boolean
}

// =============================================================================
// URL Detection Patterns
// =============================================================================

const TICKET_DOMAINS = [
  'ticketmaster.com',
  'livenation.com',
  'axs.com',
  'stubhub.com',
  'seatgeek.com',
  'vividseats.com',
  'tickpick.com',
  'gametime.co',
]

const VENUE_DOMAINS = [
  'msg.com',
  'thegarden.com',
  'crypto.com',
  'chasecenter.com',
  'barclayscenter.com',
  '.mlb.com',
  '.nba.com',
  '.nfl.com',
  '.nhl.com',
]

// =============================================================================
// Helpers
// =============================================================================

function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname.replace('www.', '')
  } catch {
    return url
  }
}

function parseContentWithLinks(content: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
  const parts = content.split(urlRegex)

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0
      const domain = extractDomain(part)
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:no-underline inline-flex items-center gap-0.5"
        >
          {domain}
          <ExternalLink className="w-3 h-3 inline" />
        </a>
      )
    }
    return part
  })
}

// =============================================================================
// Main Component
// =============================================================================

export const WebResearchCard = memo(function WebResearchCard({
  content,
  sources,
  searchType,
  query,
  className,
  maxContentHeight = 280,
  defaultCollapsed = true,
}: WebResearchCardProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed)

  const officialSources = sources.filter((s) => s.is_official)
  const otherSources = sources.filter((s) => !s.is_official)

  const quickLinks = useMemo(() => {
    const tickets: Source[] = []
    const venues: Source[] = []

    sources.forEach((source) => {
      const domain = (source.domain || extractDomain(source.url)).toLowerCase()

      if (TICKET_DOMAINS.some((d) => domain.includes(d))) {
        tickets.push(source)
      } else if (VENUE_DOMAINS.some((d) => domain.includes(d))) {
        venues.push(source)
      }
    })

    return { tickets: tickets.slice(0, 2), venues: venues.slice(0, 2) }
  }, [sources])

  const hasQuickLinks = quickLinks.tickets.length > 0 || quickLinks.venues.length > 0
  const parsedContent = useMemo(() => parseContentWithLinks(content), [content])

  const needsExpansion = useMemo(() => {
    const estimatedLines = content.length / 70
    const estimatedHeight = estimatedLines * 24
    return estimatedHeight > maxContentHeight
  }, [content, maxContentHeight])

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800/30',
        'overflow-hidden',
        className
      )}
    >
      {/* Simple header - no AI badge, no warning */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-amber-100/50 dark:bg-amber-900/30 border-b border-amber-200/50 dark:border-amber-800/30">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            web results
          </span>
          {sources.length > 0 && (
            <span className="text-xs text-amber-600/70 dark:text-amber-400/60">
              · {sources.length} source{sources.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {query && (
          <span className="text-xs text-amber-600/60 dark:text-amber-400/50 truncate max-w-[200px]">
            "{query}"
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="relative">
        <div
          className={cn(
            'p-4 space-y-3 overflow-hidden transition-all duration-300'
          )}
          style={{
            maxHeight: !isExpanded && needsExpansion ? `${maxContentHeight}px` : undefined,
          }}
        >
          {/* Search type badge if not general */}
          {searchType && searchType !== 'general' && (
            <span className="inline-block px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 text-[10px] uppercase tracking-wide font-medium">
              {searchType.replace('_', ' ')}
            </span>
          )}

          {/* Quick links */}
          {hasQuickLinks && (
            <div className="flex flex-wrap gap-2">
              {quickLinks.tickets.map((source, i) => (
                <QuickLink
                  key={`ticket-${i}`}
                  href={source.url}
                  icon={<Ticket className="w-3.5 h-3.5" />}
                  label={`Buy on ${extractDomain(source.url)}`}
                />
              ))}
              {quickLinks.venues.map((source, i) => (
                <QuickLink
                  key={`venue-${i}`}
                  href={source.url}
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  label={extractDomain(source.url)}
                />
              ))}
            </div>
          )}

          {/* Main content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {parsedContent}
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-amber-200/40 dark:border-amber-800/30">
              <p className="text-[10px] font-medium text-amber-600/70 dark:text-amber-400/60 uppercase tracking-wide">
                sources
              </p>
              <div className="space-y-1">
                {officialSources.map((source, i) => (
                  <SourceLink key={`official-${i}`} source={source} isOfficial />
                ))}
                {otherSources.slice(0, 3).map((source, i) => (
                  <SourceLink key={`other-${i}`} source={source} />
                ))}
                {otherSources.length > 3 && (
                  <p className="text-xs text-gray-400 pl-5">
                    +{otherSources.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {sources.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Info className="w-3.5 h-3.5" />
              <span>no sources cited</span>
            </div>
          )}
        </div>

        {/* Gradient when collapsed */}
        {needsExpansion && !isExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-50 dark:from-amber-950/80 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Expand/collapse */}
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-800/30 border-t border-amber-200/50 dark:border-amber-800/30 transition-colors"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show more
            </>
          )}
        </button>
      )}
    </div>
  )
})

// =============================================================================
// Subcomponents
// =============================================================================

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100/70 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200/70 dark:hover:bg-amber-700/40 transition-colors"
    >
      {icon}
      <span className="truncate max-w-[140px]">{label}</span>
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  )
}

function SourceLink({ source, isOfficial }: { source: Source; isOfficial?: boolean }) {
  const domain = source.domain || extractDomain(source.url)

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors group"
    >
      {isOfficial ? (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      ) : (
        <Globe className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
      )}
      <span className="truncate flex-1">{source.title || domain}</span>
      <span className="text-[10px] opacity-50">{domain}</span>
    </a>
  )
}

export default WebResearchCard

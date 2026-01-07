'use client'

import { memo } from 'react'
import {
  AlertTriangle,
  ExternalLink,
  Globe,
  Search,
  ShieldCheck,
  Info,
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
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Displays web research results from Gemini with clear disclaimers.
 * Visually distinct from verified Ticketmaster event cards.
 */
export const WebResearchCard = memo(function WebResearchCard({
  content,
  sources,
  searchType,
  query,
  className,
}: WebResearchCardProps) {
  const officialSources = sources.filter((s) => s.is_official)
  const otherSources = sources.filter((s) => !s.is_official)

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20',
        'overflow-hidden',
        className
      )}
    >
      {/* Disclaimer Banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/80 dark:bg-amber-900/30 border-b border-amber-500/20">
        <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          web research results
        </span>
        <span className="text-xs text-amber-600/80 dark:text-amber-400/80 ml-auto">
          verify before booking
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Search context */}
        {query && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Globe className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>searched: "{query}"</span>
            {searchType && searchType !== 'general' && (
              <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase tracking-wide">
                {searchType.replace('_', ' ')}
              </span>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>

        {/* Warning callout */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <p className="font-medium">this information may be outdated</p>
            <p className="text-amber-700/80 dark:text-amber-300/80">
              prices, dates, and availability should be verified on official
              ticketing sites before booking.
            </p>
          </div>
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              sources ({sources.length})
            </p>

            {/* Official sources first */}
            {officialSources.length > 0 && (
              <div className="space-y-1.5">
                {officialSources.map((source, i) => (
                  <SourceLink key={`official-${i}`} source={source} isOfficial />
                ))}
              </div>
            )}

            {/* Other sources */}
            {otherSources.length > 0 && (
              <div className="space-y-1.5">
                {otherSources.slice(0, 3).map((source, i) => (
                  <SourceLink key={`other-${i}`} source={source} />
                ))}
                {otherSources.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-5">
                    +{otherSources.length - 3} more sources
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* No sources fallback */}
        {sources.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            <span>no source citations available for this search</span>
          </div>
        )}
      </div>
    </div>
  )
})

// =============================================================================
// Subcomponents
// =============================================================================

interface SourceLinkProps {
  source: Source
  isOfficial?: boolean
}

function SourceLink({ source, isOfficial }: SourceLinkProps) {
  const domain = source.domain || extractDomain(source.url)

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-start gap-2 p-2 rounded-lg transition-colors group',
        'hover:bg-muted/50'
      )}
    >
      {isOfficial ? (
        <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
      ) : (
        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {source.title || domain}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{domain}</span>
          {isOfficial && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
              official
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname.replace('www.', '')
  } catch {
    return url
  }
}

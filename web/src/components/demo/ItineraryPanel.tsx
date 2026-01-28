'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Itinerary, DemoStage, IconKey, PriceRange } from './types'
import { formatMoneyRange } from './types'

// =============================================================================
// Constants
// =============================================================================

const ANIMATION_DURATION = 0.4
const ITEM_STAGGER_DELAY = 0.08

// =============================================================================
// Icon Components
// =============================================================================

interface IconProps {
  className?: string
}

function TicketIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  )
}

function FlightIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  )
}

function HotelIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
      <path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16" />
      <path d="M8 7h.01" />
      <path d="M16 7h.01" />
      <path d="M12 7h.01" />
      <path d="M12 11h.01" />
      <path d="M16 11h.01" />
      <path d="M8 11h.01" />
    </svg>
  )
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function LocationIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function StarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function RefreshIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

function MusicIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function TrophyIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function TheaterIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 10s3-3 10-3 10 3 10 3" />
      <path d="M12 21c-4 0-7-3-7-3s3-3 7-3 7 3 7 3-3 3-7 3z" />
      <circle cx="12" cy="13" r="2" />
    </svg>
  )
}

function FlagIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  )
}

// =============================================================================
// Icon Mapping
// =============================================================================

const IconComponents: Record<IconKey, React.ComponentType<IconProps>> = {
  ticket: TicketIcon,
  flight: FlightIcon,
  hotel: HotelIcon,
  music: MusicIcon,
  trophy: TrophyIcon,
  theater: TheaterIcon,
  flag: FlagIcon,
}

function getIcon(iconKey: IconKey, className?: string): React.ReactNode {
  const IconComponent = IconComponents[iconKey] || TicketIcon
  return <IconComponent className={className} />
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    scale: 0.98,
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: i * ITEM_STAGGER_DELAY,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
}

const totalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.3,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

const buttonVariants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.4 + i * 0.1,
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  }),
}

// =============================================================================
// Line Item Component
// =============================================================================

interface LineItemProps {
  iconKey: IconKey
  label: string
  detail: string
  range: PriceRange
  index: number
  isPopulated: boolean
}

function LineItem({ iconKey, label, detail, range, index, isPopulated }: LineItemProps) {
  const isIncluded = range.min === 0 && range.max === 0

  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate={isPopulated ? 'visible' : 'hidden'}
      className={cn(
        'flex items-center gap-3 p-3.5 rounded-xl',
        'bg-white/[0.02] border border-white/[0.04]',
        'hover:bg-white/[0.03] hover:border-white/[0.06] transition-colors duration-200',
        'group'
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          'bg-white/[0.04] text-[#8a857e]',
          'group-hover:bg-white/[0.06] group-hover:text-[#a5a09a] transition-colors duration-200'
        )}
      >
        {getIcon(iconKey)}
      </div>

      {/* Label + detail */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#e8e4de] mb-0.5 truncate">
          {label}
        </p>
        <p className="text-[11px] text-[#5a5550]">{detail}</p>
      </div>

      {/* Price range */}
      <div className="text-right shrink-0">
        <span
          className={cn(
            'text-[13px] font-medium tabular-nums',
            isIncluded ? 'text-[#6b6560]' : 'text-[#9a958e]'
          )}
        >
          {formatMoneyRange(range)}
        </span>
      </div>
    </motion.div>
  )
}

// =============================================================================
// Skeleton Loader
// =============================================================================

function LineItemSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.03]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="w-9 h-9 rounded-lg bg-white/[0.03] animate-pulse" />
      <div className="flex-1">
        <div className="h-3 w-32 bg-white/[0.04] rounded animate-pulse mb-2" />
        <div className="h-2.5 w-20 bg-white/[0.03] rounded animate-pulse" />
      </div>
      <div className="h-3 w-16 bg-white/[0.04] rounded animate-pulse" />
    </div>
  )
}

// =============================================================================
// Total Section
// =============================================================================

interface TotalSectionProps {
  totalRange: PriceRange
  isPopulated: boolean
}

function TotalSection({ totalRange, isPopulated }: TotalSectionProps) {
  return (
    <motion.div
      variants={totalVariants}
      initial="hidden"
      animate={isPopulated ? 'visible' : 'hidden'}
      className="border-t border-white/[0.05] pt-4"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-xs text-[#5a5550] block mb-0.5">
            Typical total range
          </span>
          <span className="text-[10px] text-[#4a4744]">
            Based on sample pricing
          </span>
        </div>
        <motion.span
          className="text-2xl font-semibold text-[#f5f2ed] tracking-[-0.02em] tabular-nums"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          {formatMoneyRange(totalRange)}
        </motion.span>
      </div>
    </motion.div>
  )
}

// =============================================================================
// CTA Buttons
// =============================================================================

interface CTAButtonsProps {
  query: string
  isPopulated: boolean
}

function CTAButtons({ query, isPopulated }: CTAButtonsProps) {
  const searchUrl = `/chat?prompt=${encodeURIComponent(`plan a trip for: ${query}`)}`

  return (
    <div className="mt-auto pt-5 flex flex-col gap-2.5">
      {/* Primary CTA */}
      <motion.div
        custom={0}
        variants={buttonVariants}
        initial="hidden"
        animate={isPopulated ? 'visible' : 'hidden'}
      >
        <Link
          href={searchUrl}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl',
            'bg-[#e8e4de] text-[#1a1816]',
            'text-sm font-semibold tracking-[-0.01em]',
            'hover:bg-[#f5f2ed] active:scale-[0.98] transition-all duration-200',
            'shadow-sm hover:shadow-md'
          )}
        >
          <span>Try this search</span>
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* Secondary CTA */}
      <motion.div
        custom={1}
        variants={buttonVariants}
        initial="hidden"
        animate={isPopulated ? 'visible' : 'hidden'}
      >
        <Link
          href="/search"
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl',
            'bg-transparent text-[#7a756e]',
            'border border-white/[0.08]',
            'text-[13px] font-medium',
            'hover:border-white/[0.12] hover:text-[#9a958e] hover:bg-white/[0.02]',
            'active:scale-[0.98] transition-all duration-200'
          )}
        >
          <RefreshIcon className="w-3.5 h-3.5" />
          <span>Start with something else</span>
        </Link>
      </motion.div>
    </div>
  )
}

// =============================================================================
// Header Section
// =============================================================================

interface HeaderSectionProps {
  title: string
  subtitle: string
  isPopulated: boolean
}

function HeaderSection({ title, subtitle, isPopulated }: HeaderSectionProps) {
  return (
    <div className="mb-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <h4
            className={cn(
              'text-xl font-semibold tracking-[-0.02em] mb-1.5 transition-colors duration-300',
              isPopulated ? 'text-[#f5f2ed]' : 'text-[#6b6560]'
            )}
          >
            {title}
          </h4>
          <p className="text-[13px] text-[#7a756e] leading-relaxed">{subtitle}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// Status Badge
// =============================================================================

interface StatusBadgeProps {
  stage: DemoStage
}

function StatusBadge({ stage }: StatusBadgeProps) {
  const statusConfig = useMemo(() => {
    if (stage >= 4) {
      return {
        text: 'Ready to book',
        dotColor: 'bg-[#8fad8b]',
        textColor: 'text-[#8fad8b]',
      }
    }
    if (stage >= 2) {
      return {
        text: 'Building...',
        dotColor: 'bg-[#cfa872]',
        textColor: 'text-[#cfa872]',
      }
    }
    return {
      text: 'Waiting',
      dotColor: 'bg-[#4a4744]',
      textColor: 'text-[#4a4744]',
    }
  }, [stage])

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'w-[5px] h-[5px] rounded-full transition-colors duration-300',
          statusConfig.dotColor,
          stage >= 2 && stage < 4 && 'animate-pulse'
        )}
      />
      <span className={cn('text-[11px] font-medium', statusConfig.textColor)}>
        {statusConfig.text}
      </span>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

interface ItineraryPanelProps {
  itinerary: Itinerary
  stage: DemoStage
  className?: string
}

export default function ItineraryPanel({
  itinerary,
  stage,
  className,
}: ItineraryPanelProps) {
  // Derived states
  const isVisible = stage >= 2
  const isPopulated = stage >= 4
  const isBuilding = stage >= 2 && stage < 4

  // Build query string from itinerary title
  const queryString = itinerary.title.toLowerCase()

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className={cn(
        'bg-white/[0.02] rounded-2xl p-5 flex flex-col',
        'transition-all duration-500 ease-out',
        isPopulated && 'border border-[#cfa872]/15 shadow-lg shadow-[#cfa872]/5',
        !isPopulated && 'border border-white/[0.05]',
        className
      )}
      role="region"
      aria-label="Trip itinerary draft"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-[#6b6560] uppercase">
          Draft Itinerary
        </h3>
        <StatusBadge stage={stage} />
      </div>

      {/* Event title */}
      <HeaderSection
        title={itinerary.title}
        subtitle={itinerary.subtitle}
        isPopulated={isPopulated}
      />

      {/* Line items */}
      <div className="flex flex-col gap-2.5 mb-5">
        {isBuilding && !isPopulated ? (
          // Show skeletons while building
          <>
            {[0, 1, 2].map((i) => (
              <LineItemSkeleton key={i} index={i} />
            ))}
          </>
        ) : (
          // Show actual items
          itinerary.lineItems.map((item, i) => (
            <LineItem
              key={`${item.label}-${i}`}
              iconKey={item.iconKey}
              label={item.label}
              detail={item.detail}
              range={item.range}
              index={i}
              isPopulated={isPopulated}
            />
          ))
        )}
      </div>

      {/* Total */}
      <TotalSection totalRange={itinerary.totalRange} isPopulated={isPopulated} />

      {/* CTAs */}
      <CTAButtons query={queryString} isPopulated={isPopulated} />
    </motion.div>
  )
}

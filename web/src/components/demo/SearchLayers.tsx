'use client'

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { SearchLayer, DemoStage, IconKey } from './types'

// =============================================================================
// Constants
// =============================================================================

const ANIMATION_DURATION = 0.4
const STAGGER_DELAY = 0.08

// =============================================================================
// Icon Components (SVG for crisp rendering)
// =============================================================================

interface IconProps {
  className?: string
}

function TicketIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
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
      width="16"
      height="16"
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
      width="16"
      height="16"
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
      width="16"
      height="16"
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
      width="16"
      height="16"
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
      width="16"
      height="16"
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
      width="16"
      height="16"
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

function MusicIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
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
      width="16"
      height="16"
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
      width="16"
      height="16"
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
      width="16"
      height="16"
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

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function LoaderIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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
      staggerChildren: STAGGER_DELAY,
    },
  },
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

const signalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.25,
      ease: 'easeOut' as const,
    },
  }),
}

const statusVariants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
}

// =============================================================================
// Source Badges
// =============================================================================

interface SourceBadge {
  name: string
  color: string
}

const LAYER_SOURCES: Record<string, SourceBadge[]> = {
  ticket: [
    { name: 'Ticketmaster', color: '#026cdf' },
    { name: 'StubHub', color: '#3a1d8a' },
    { name: 'SeatGeek', color: '#ff5858' },
    { name: 'VividSeats', color: '#8338ec' },
  ],
  flight: [
    { name: 'Google Flights', color: '#4285f4' },
    { name: 'Kayak', color: '#ff690f' },
    { name: 'Skyscanner', color: '#00d4c6' },
    { name: 'Direct', color: '#6b7280' },
  ],
  hotel: [
    { name: 'Booking.com', color: '#003580' },
    { name: 'Expedia', color: '#ffcc00' },
    { name: 'Hotels.com', color: '#d32f2f' },
    { name: 'Direct', color: '#6b7280' },
  ],
}

interface SourceBadgesProps {
  iconKey: IconKey
  isVisible: boolean
}

function SourceBadges({ iconKey, isVisible }: SourceBadgesProps) {
  const sources = LAYER_SOURCES[iconKey] || []

  if (!isVisible || sources.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3 pt-3 border-t border-white/[0.04]"
    >
      <p className="text-[10px] text-[#4a4744] uppercase tracking-wider mb-2">
        Checking sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <motion.span
            key={source.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.2 }}
            className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-[#6b6560]"
            style={{ borderLeft: `2px solid ${source.color}` }}
          >
            {source.name}
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}

// =============================================================================
// Progress Indicator
// =============================================================================

interface ProgressIndicatorProps {
  stage: DemoStage
  totalLayers: number
  activeLayerIndex: number
}

function ProgressIndicator({ stage, totalLayers, activeLayerIndex }: ProgressIndicatorProps) {
  const isSearching = stage >= 2 && stage < 4
  const isComplete = stage >= 4

  const progress = useMemo(() => {
    if (isComplete) return 100
    if (!isSearching) return 0
    return Math.min(((activeLayerIndex + 1) / totalLayers) * 100, 100)
  }, [isComplete, isSearching, activeLayerIndex, totalLayers])

  return (
    <div className="relative h-1 bg-white/[0.04] rounded-full overflow-hidden">
      <motion.div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          isComplete ? 'bg-[#8fad8b]' : 'bg-[#cfa872]'
        )}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      {isSearching && (
        <motion.div
          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  )
}

// =============================================================================
// Search Layer Card
// =============================================================================

interface SearchLayerCardProps {
  layer: SearchLayer
  index: number
  isActive: boolean
  isComplete: boolean
  isSearching: boolean
  showSources: boolean
}

function SearchLayerCard({
  layer,
  index,
  isActive,
  isComplete,
  isSearching,
  showSources,
}: SearchLayerCardProps) {
  // Determine card state
  const cardState = useMemo(() => {
    if (isComplete) return 'complete'
    if (isActive) return 'active'
    if (isSearching) return 'waiting'
    return 'idle'
  }, [isComplete, isActive, isSearching])

  // Status display
  const statusDisplay = useMemo(() => {
    switch (cardState) {
      case 'complete':
        return {
          icon: <CheckIcon className="text-[#8fad8b]" />,
          text: layer.status,
          color: 'text-[#8fad8b]',
        }
      case 'active':
        return {
          icon: <LoaderIcon className="text-[#cfa872]" />,
          text: 'Searching...',
          color: 'text-[#cfa872]',
        }
      case 'waiting':
        return {
          icon: null,
          text: 'Queued',
          color: 'text-[#4a4744]',
        }
      default:
        return {
          icon: null,
          text: '—',
          color: 'text-[#4a4744]',
        }
    }
  }, [cardState, layer.status])

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        'rounded-xl p-4 transition-all duration-300',
        cardState === 'active' && 'bg-[#cfa872]/[0.06] border border-[#cfa872]/[0.15] shadow-lg shadow-[#cfa872]/5',
        cardState === 'complete' && 'bg-[#8fad8b]/[0.04] border border-[#8fad8b]/[0.08]',
        cardState === 'waiting' && 'bg-white/[0.015] border border-white/[0.03] opacity-60',
        cardState === 'idle' && 'bg-white/[0.02] border border-white/[0.04]'
      )}
      role="listitem"
      aria-label={`${layer.label}: ${statusDisplay.text}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icon container */}
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300',
              cardState === 'active' && 'bg-[#cfa872]/15 text-[#cfa872]',
              cardState === 'complete' && 'bg-[#8fad8b]/15 text-[#8fad8b]',
              (cardState === 'waiting' || cardState === 'idle') && 'bg-white/[0.04] text-[#6b6560]'
            )}
          >
            {getIcon(layer.iconKey)}
          </div>

          {/* Label */}
          <div>
            <span
              className={cn(
                'text-sm font-medium transition-colors duration-300',
                cardState === 'complete' ? 'text-[#e8e4de]' : 'text-[#b5b0a8]'
              )}
            >
              {layer.label}
            </span>
            {/* Layer index indicator */}
            <span className="ml-2 text-[10px] text-[#4a4744]">
              Layer {index + 1}
            </span>
          </div>
        </div>

        {/* Status */}
        <AnimatePresence mode="wait">
          <motion.div
            key={cardState}
            variants={statusVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn('flex items-center gap-1.5 text-[11px] font-medium', statusDisplay.color)}
          >
            {statusDisplay.icon}
            <span>{statusDisplay.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Signals */}
      <div className="flex flex-wrap gap-1.5">
        {layer.signals.map((signal, i) => (
          <motion.span
            key={signal}
            custom={i}
            variants={signalVariants}
            initial="hidden"
            animate={isComplete || isActive ? 'visible' : 'hidden'}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-md transition-all duration-300',
              isComplete && 'text-[#9a958e] bg-white/[0.05]',
              isActive && 'text-[#cfa872] bg-[#cfa872]/10',
              !isComplete && !isActive && 'text-[#5a5550] bg-transparent'
            )}
          >
            {signal}
          </motion.span>
        ))}
      </div>

      {/* Source badges (shown when searching) */}
      <AnimatePresence>
        {showSources && isActive && (
          <SourceBadges iconKey={layer.iconKey} isVisible={isActive} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// =============================================================================
// Status Header
// =============================================================================

interface StatusHeaderProps {
  stage: DemoStage
}

function StatusHeader({ stage }: StatusHeaderProps) {
  const isComplete = stage >= 4
  const isSearching = stage >= 2 && stage < 4
  const isReady = stage >= 1 && stage < 2

  const statusConfig = useMemo(() => {
    if (isComplete) {
      return {
        dotColor: 'bg-[#8fad8b]',
        textColor: 'text-[#8fad8b]',
        text: 'Complete',
        pulse: false,
      }
    }
    if (isSearching) {
      return {
        dotColor: 'bg-[#cfa872]',
        textColor: 'text-[#cfa872]',
        text: 'Searching',
        pulse: true,
      }
    }
    if (isReady) {
      return {
        dotColor: 'bg-[#6b6560]',
        textColor: 'text-[#6b6560]',
        text: 'Ready',
        pulse: false,
      }
    }
    return {
      dotColor: 'bg-[#4a4744]',
      textColor: 'text-[#4a4744]',
      text: 'Idle',
      pulse: false,
    }
  }, [isComplete, isSearching, isReady])

  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[11px] font-semibold tracking-[0.08em] text-[#6b6560] uppercase">
        Search Layers
      </h3>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-[6px] h-[6px] rounded-full transition-colors duration-300',
            statusConfig.dotColor,
            statusConfig.pulse && 'animate-pulse'
          )}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={statusConfig.text}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={cn('text-xs font-medium', statusConfig.textColor)}
          >
            {statusConfig.text}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

// =============================================================================
// Footer with Sources
// =============================================================================

interface FooterProps {
  isVisible: boolean
}

function Footer({ isVisible }: FooterProps) {
  const sources = [
    'Ticketmaster',
    'StubHub',
    'Google Flights',
    'Booking.com',
    'Expedia',
    'SeatGeek',
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mt-5 pt-4 border-t border-white/[0.04]"
    >
      <p className="text-[10px] text-[#4a4744] mb-2">
        Sources may include:
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {sources.map((source) => (
          <span key={source} className="text-[10px] text-[#5a5550]">
            {source}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

interface SearchLayersProps {
  layers: SearchLayer[]
  stage: DemoStage
  activeLayerIndex: number
  className?: string
  showSources?: boolean
}

export default function SearchLayers({
  layers,
  stage,
  activeLayerIndex,
  className,
  showSources = true,
}: SearchLayersProps) {
  // Derived states
  const isVisible = stage >= 1
  const isSearching = stage >= 2 && stage < 4
  const isComplete = stage >= 4

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className={cn(
        'bg-white/[0.02] rounded-2xl border border-white/[0.05] p-5',
        'transition-shadow duration-500',
        isSearching && 'shadow-lg shadow-[#cfa872]/5',
        isComplete && 'shadow-md shadow-[#8fad8b]/5',
        className
      )}
      role="list"
      aria-label="Search layers progress"
    >
      {/* Header */}
      <StatusHeader stage={stage} />

      {/* Progress indicator */}
      <div className="mb-5">
        <ProgressIndicator
          stage={stage}
          totalLayers={layers.length}
          activeLayerIndex={activeLayerIndex}
        />
      </div>

      {/* Layer cards */}
      <div className="flex flex-col gap-3">
        {layers.map((layer, i) => (
          <SearchLayerCard
            key={layer.id || `layer-${i}`}
            layer={layer}
            index={i}
            isActive={isSearching && activeLayerIndex === i}
            isComplete={stage >= 3}
            isSearching={isSearching}
            showSources={showSources}
          />
        ))}
      </div>

      {/* Footer */}
      <Footer isVisible={isComplete} />
    </motion.div>
  )
}

'use client'

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DemoExample, DemoStage, DemoCategory } from './types'
import {
  defaultExample,
  getExampleById,
  getFirstExampleForCategory,
  getNextExampleInCategory,
  getExamplesByCategory,
  demoPrompts,
  categoryTabs,
} from './demoExamples'
import RequestDisplay from './RequestDisplay'
import SearchLayers from './SearchLayers'
import ItineraryPanel from './ItineraryPanel'
import DemoPrompts from './DemoPrompts'

// =============================================================================
// Constants
// =============================================================================

/** Timing for each stage transition (cumulative from start) */
const STAGE_TIMINGS: Record<DemoStage, number> = {
  0: 0,      // Initial
  1: 400,    // Query received
  2: 1000,   // Searching starts
  3: 2400,   // Results building
  4: 3200,   // Complete
}

/** Duration between layer highlight changes */
const LAYER_CYCLE_DURATION = 500

/** Time to wait at completion before auto-advancing */
const AUTO_ADVANCE_DELAY = 4000

/** Minimum time user must hover to pause */
const HOVER_PAUSE_THRESHOLD = 100

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to detect if element is in viewport
 */
function useIntersectionObserver(
  ref: React.RefObject<Element | null>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, {
      threshold: 0.3,
      ...options,
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, options])

  return isIntersecting
}

/**
 * Hook to detect reduced motion preference
 */
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook for keyboard navigation
 */
function useKeyboardNavigation(
  onNext: () => void,
  onPrev: () => void,
  onTogglePlay: () => void,
  onRestart: () => void,
  isEnabled: boolean
) {
  useEffect(() => {
    if (!isEnabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'l':
          event.preventDefault()
          onNext()
          break
        case 'ArrowLeft':
        case 'h':
          event.preventDefault()
          onPrev()
          break
        case ' ':
        case 'k':
          event.preventDefault()
          onTogglePlay()
          break
        case 'r':
          event.preventDefault()
          onRestart()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onPrev, onTogglePlay, onRestart, isEnabled])
}

// =============================================================================
// Sub-components
// =============================================================================

interface ProgressBarProps {
  stage: DemoStage
  isPlaying: boolean
}

function ProgressBar({ stage, isPlaying }: ProgressBarProps) {
  const progress = useMemo(() => {
    const stages: DemoStage[] = [0, 1, 2, 3, 4]
    const currentIndex = stages.indexOf(stage)
    return ((currentIndex + 1) / stages.length) * 100
  }, [stage])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2a2825]">
      <motion.div
        className="h-full bg-gradient-to-r from-[#cfa872]/60 to-[#cfa872]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      {isPlaying && stage === 4 && (
        <motion.div
          className="absolute top-0 right-0 h-full bg-[#cfa872]/30"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: AUTO_ADVANCE_DELAY / 1000, ease: 'linear' }}
        />
      )}
    </div>
  )
}

interface PlaybackControlsProps {
  isPlaying: boolean
  onTogglePlay: () => void
  onRestart: () => void
  onPrev: () => void
  onNext: () => void
  canGoPrev: boolean
  canGoNext: boolean
}

function PlaybackControls({
  isPlaying,
  onTogglePlay,
  onRestart,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Previous */}
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className={cn(
          'p-2 rounded-lg transition-colors',
          canGoPrev
            ? 'text-[#9a958e] hover:text-[#e8e4de] hover:bg-[#2a2825]'
            : 'text-[#4a4540] cursor-not-allowed'
        )}
        aria-label="Previous example"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        className="p-2 rounded-lg text-[#9a958e] hover:text-[#e8e4de] hover:bg-[#2a2825] transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      {/* Restart */}
      <button
        onClick={onRestart}
        className="p-2 rounded-lg text-[#9a958e] hover:text-[#e8e4de] hover:bg-[#2a2825] transition-colors"
        aria-label="Restart animation"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={cn(
          'p-2 rounded-lg transition-colors',
          canGoNext
            ? 'text-[#9a958e] hover:text-[#e8e4de] hover:bg-[#2a2825]'
            : 'text-[#4a4540] cursor-not-allowed'
        )}
        aria-label="Next example"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

interface CategoryTabsProps {
  activeCategory: DemoCategory
  onCategoryChange: (category: DemoCategory) => void
}

function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-[#1a1916] rounded-lg">
      {categoryTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onCategoryChange(tab.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            activeCategory === tab.id
              ? 'bg-[#2a2825] text-[#e8e4de] shadow-sm'
              : 'text-[#6b6560] hover:text-[#9a958e]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

interface ExampleIndicatorProps {
  examples: DemoExample[]
  currentId: string
  onSelect: (id: string) => void
}

function ExampleIndicator({ examples, currentId, onSelect }: ExampleIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {examples.map((example) => (
        <button
          key={example.id}
          onClick={() => onSelect(example.id)}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-300',
            example.id === currentId
              ? 'bg-[#cfa872] scale-125'
              : 'bg-[#3a3530] hover:bg-[#4a4540]'
          )}
          aria-label={`Go to ${example.itinerary.title}`}
        />
      ))}
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

interface DemoSectionProps {
  className?: string
  autoPlay?: boolean
  showControls?: boolean
  showCategoryTabs?: boolean
}

export default function DemoSection({
  className = '',
  autoPlay = true,
  showControls = true,
  showCategoryTabs = true,
}: DemoSectionProps) {
  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const sectionRef = useRef<HTMLElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimersRef = useRef<NodeJS.Timeout[]>([])

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [stage, setStage] = useState<DemoStage>(0)
  const [activeLayerIndex, setActiveLayerIndex] = useState(0)
  const [selectedExample, setSelectedExample] = useState<DemoExample>(defaultExample)
  const [selectedCategory, setSelectedCategory] = useState<DemoCategory>('sports')
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isPausedByHover, setIsPausedByHover] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const isInView = useIntersectionObserver(sectionRef)
  const prefersReducedMotion = useReducedMotion()

  // Get examples for current category
  const categoryExamples = useMemo(
    () => getExamplesByCategory(selectedCategory),
    [selectedCategory]
  )

  // Current example index
  const currentExampleIndex = useMemo(
    () => categoryExamples.findIndex((ex) => ex.id === selectedExample.id),
    [categoryExamples, selectedExample.id]
  )

  // ---------------------------------------------------------------------------
  // Animation helpers
  // ---------------------------------------------------------------------------
  const clearAllTimers = useCallback(() => {
    animationTimersRef.current.forEach(clearTimeout)
    animationTimersRef.current = []
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }, [])

  const runAnimation = useCallback(() => {
    clearAllTimers()

    // Reset state
    setStage(0)
    setActiveLayerIndex(0)

    // If reduced motion, skip to final state
    if (prefersReducedMotion) {
      setStage(4)
      setActiveLayerIndex(selectedExample.layers.length - 1)
      return
    }

    // Schedule stage transitions
    const stages: DemoStage[] = [1, 2, 3, 4]
    stages.forEach((s) => {
      const timer = setTimeout(() => setStage(s), STAGE_TIMINGS[s])
      animationTimersRef.current.push(timer)
    })
  }, [clearAllTimers, prefersReducedMotion, selectedExample.layers.length])

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------
  const goToExample = useCallback((example: DemoExample) => {
    setSelectedExample(example)
    setSelectedCategory(example.category)
    setHasInteracted(true)
    runAnimation()
  }, [runAnimation])

  const goToNextExample = useCallback(() => {
    const nextExample = getNextExampleInCategory(selectedExample.id, selectedCategory)
    goToExample(nextExample)
  }, [selectedExample.id, selectedCategory, goToExample])

  const goToPrevExample = useCallback(() => {
    const prevIndex = currentExampleIndex === 0
      ? categoryExamples.length - 1
      : currentExampleIndex - 1
    goToExample(categoryExamples[prevIndex])
  }, [currentExampleIndex, categoryExamples, goToExample])

  const handleCategoryChange = useCallback((category: DemoCategory) => {
    setSelectedCategory(category)
    const example = getFirstExampleForCategory(category)
    if (example) {
      setSelectedExample(example)
      setHasInteracted(true)
      runAnimation()
    }
  }, [runAnimation])

  const handlePromptSelect = useCallback((exampleId: string) => {
    const example = getExampleById(exampleId)
    if (example) {
      goToExample(example)
    }
  }, [goToExample])

  const handleRestart = useCallback(() => {
    setHasInteracted(true)
    runAnimation()
  }, [runAnimation])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
    setHasInteracted(true)
  }, [])

  // ---------------------------------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------------------------------
  useKeyboardNavigation(
    goToNextExample,
    goToPrevExample,
    togglePlay,
    handleRestart,
    isInView
  )

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Initial animation when coming into view
  useEffect(() => {
    if (isInView && !hasInteracted) {
      runAnimation()
    }
  }, [isInView, hasInteracted, runAnimation])

  // Layer cycling during search phase
  useEffect(() => {
    if (stage >= 2 && stage < 4 && !prefersReducedMotion) {
      const maxLayers = selectedExample.layers.length - 1

      const interval = setInterval(() => {
        setActiveLayerIndex((prev) => {
          if (prev >= maxLayers) return prev
          return prev + 1
        })
      }, LAYER_CYCLE_DURATION)

      return () => clearInterval(interval)
    }
  }, [stage, selectedExample.layers.length, prefersReducedMotion])

  // Auto-advance to next example when complete
  useEffect(() => {
    if (stage === 4 && isPlaying && !isPausedByHover && isInView) {
      autoAdvanceRef.current = setTimeout(() => {
        goToNextExample()
      }, AUTO_ADVANCE_DELAY)

      return () => {
        if (autoAdvanceRef.current) {
          clearTimeout(autoAdvanceRef.current)
        }
      }
    }
  }, [stage, isPlaying, isPausedByHover, isInView, goToNextExample])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers()
  }, [clearAllTimers])

  // ---------------------------------------------------------------------------
  // Hover handlers (pause on hover)
  // ---------------------------------------------------------------------------
  const handleMouseEnter = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsPausedByHover(true)
    }, HOVER_PAUSE_THRESHOLD)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsPausedByHover(false)
  }, [])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <section
      ref={sectionRef}
      className={cn('relative overflow-hidden py-20 md:py-28', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Interactive demo showing how Seira plans trips"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#141211]" />

      {/* Warm ambient glow - top right */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[60%] h-[70%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(207, 168, 114, 0.06) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Cool balance - bottom left */}
      <div
        className="absolute bottom-0 left-[-10%] w-[50%] h-[60%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(120, 140, 155, 0.04) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content container */}
      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Left: Disclaimer + Category tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-xs font-medium tracking-wide text-[#6b6560] uppercase">
              Example preview — real results after you search
            </p>

            {showCategoryTabs && (
              <CategoryTabs
                activeCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            )}
          </div>

          {/* Right: Controls */}
          {showControls && (
            <div className="flex items-center gap-4">
              <ExampleIndicator
                examples={categoryExamples}
                currentId={selectedExample.id}
                onSelect={handlePromptSelect}
              />

              <div className="w-px h-4 bg-[#2a2825]" />

              <PlaybackControls
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onRestart={handleRestart}
                onPrev={goToPrevExample}
                onNext={goToNextExample}
                canGoPrev={categoryExamples.length > 1}
                canGoNext={categoryExamples.length > 1}
              />
            </div>
          )}
        </div>

        {/* Demo card container */}
        <div className="relative">
          {/* Progress bar */}
          <ProgressBar stage={stage} isPlaying={isPlaying} />

          {/* Demo grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedExample.id}
              initial={{ opacity: 0.8, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.8, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4"
            >
              {/* Request bar - full width */}
              <div className="lg:col-span-2">
                <RequestDisplay
                  query={selectedExample.query}
                  meta={selectedExample.meta}
                  stage={stage}
                />
              </div>

              {/* Search layers panel */}
              <SearchLayers
                layers={selectedExample.layers}
                stage={stage}
                activeLayerIndex={activeLayerIndex}
              />

              {/* Itinerary panel */}
              <ItineraryPanel
                itinerary={selectedExample.itinerary}
                stage={stage}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quick prompts */}
        <DemoPrompts prompts={demoPrompts} onSelect={handlePromptSelect} />

        {/* Keyboard hints (shown on desktop when focused) */}
        {isInView && (
          <div className="hidden lg:flex items-center justify-center gap-6 mt-8 text-[10px] text-[#4a4540]">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#1a1916] rounded text-[#6b6560]">
                ←
              </kbd>{' '}
              /{' '}
              <kbd className="px-1.5 py-0.5 bg-[#1a1916] rounded text-[#6b6560]">
                →
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#1a1916] rounded text-[#6b6560]">
                Space
              </kbd>{' '}
              Play/Pause
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#1a1916] rounded text-[#6b6560]">
                R
              </kbd>{' '}
              Restart
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

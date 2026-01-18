// =============================================================================
// Demo Section - Type Definitions
// =============================================================================

// =============================================================================
// Core Types
// =============================================================================

/**
 * Event categories supported by the demo
 */
export type DemoCategory = 'concerts' | 'sports' | 'theater' | 'racing'

/**
 * Icon keys for consistent icon mapping across components
 */
export type IconKey = 'ticket' | 'flight' | 'hotel' | 'music' | 'trophy' | 'theater' | 'flag'

/**
 * Price range object with min/max
 */
export interface PriceRange {
  min: number
  max: number
}

/**
 * Animation phases for search layers
 */
export type AnimationPhase = 'idle' | 'searching' | 'found'

/**
 * Demo stages for orchestrating the full animation sequence
 * 0 = Initial/idle
 * 1 = Query received, starting to process
 * 2 = Searching layers (cycling through)
 * 3 = Results found, building itinerary
 * 4 = Complete, showing final output
 */
export type DemoStage = 0 | 1 | 2 | 3 | 4

// =============================================================================
// Search Layer Types
// =============================================================================

/**
 * A single search layer (ticket, flight, hotel) with status
 */
export interface SearchLayer {
  id?: string
  iconKey: IconKey
  label: string
  signals: string[]
  status: string
}

// =============================================================================
// Demo Example Types
// =============================================================================

/**
 * Metadata about the trip request
 */
export interface DemoExampleMeta {
  date: string
  travelers: number
  nights: number
  origin: string
  originCity: string
  destination: string
  understood: string[]
}

/**
 * Alias for component props (RequestDisplay uses this name)
 */
export type RequestMeta = DemoExampleMeta

/**
 * A single line item in the itinerary
 */
export interface ItineraryLineItem {
  iconKey: IconKey
  label: string
  detail: string
  range: PriceRange
}

/**
 * The complete itinerary output
 */
export interface DemoItinerary {
  title: string
  subtitle: string
  lineItems: ItineraryLineItem[]
  totalRange: PriceRange
}

/**
 * Alias for component props (ItineraryPanel uses this name)
 */
export type Itinerary = DemoItinerary

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format a price range for display
 */
export function formatMoneyRange(range: PriceRange): string {
  if (range.min === 0 && range.max === 0) {
    return 'Included'
  }
  if (range.min === range.max) {
    return `~$${range.min.toLocaleString()}`
  }
  return `~$${range.min.toLocaleString()}–${range.max.toLocaleString()}`
}

/**
 * A complete demo example with all data
 */
export interface DemoExample {
  id: string
  category: DemoCategory
  query: string
  meta: DemoExampleMeta
  layers: SearchLayer[]
  itinerary: DemoItinerary
}

// =============================================================================
// UI Configuration Types
// =============================================================================

/**
 * Category tab configuration
 */
export interface CategoryTab {
  id: DemoCategory
  label: string
  iconKey: IconKey
}

/**
 * Quick prompt tag for bottom of demo
 */
export interface DemoPrompt {
  label: string
  exampleId: string
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for DemoSection (parent orchestrator)
 */
export interface DemoSectionProps {
  className?: string
  autoPlay?: boolean
  initialCategory?: DemoCategory
}

/**
 * Props for RequestDisplay
 */
export interface RequestDisplayProps {
  query: string
  understood: string[]
  isExpanded?: boolean
  onToggleExpand?: () => void
  className?: string
}

/**
 * Props for SearchLayers
 */
export interface SearchLayersProps {
  layers: SearchLayer[]
  activeIndex: number
  className?: string
}

/**
 * Props for ItineraryPanel
 */
export interface ItineraryPanelProps {
  itinerary: DemoItinerary
  isVisible: boolean
  className?: string
}

/**
 * Props for DemoPrompts
 */
export interface DemoPromptsProps {
  prompts: DemoPrompt[]
  onPromptClick?: (prompt: DemoPrompt) => void
  className?: string
}

// =============================================================================
// Animation & State Types
// =============================================================================

/**
 * Animation timing configuration
 */
export interface AnimationTiming {
  stepDelay: number
  searchDuration: number
  cycleDuration: number
}

/**
 * Demo state managed by DemoSection
 */
export interface DemoState {
  activeCategory: DemoCategory
  currentExample: DemoExample
  activeLayerIndex: number
  showItinerary: boolean
  isTransitioning: boolean
}

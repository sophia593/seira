// =============================================================================
// Demo Section - Public Exports
// =============================================================================

// Main component
export { default as DemoSection } from './DemoSection'

// Sub-components (if needed individually)
export { default as RequestDisplay } from './RequestDisplay'
export { default as SearchLayers } from './SearchLayers'
export { default as ItineraryPanel } from './ItineraryPanel'
export { default as DemoPrompts } from './DemoPrompts'

// Types
export * from './types'

// Data
export {
  demoExamples,
  demoPrompts,
  categoryTabs,
  defaultExample,
  getExampleById,
  getExamplesByCategory,
  getFirstExampleForCategory,
} from './demoExamples'

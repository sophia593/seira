// =============================================================================
// Base UI Colors & Category Fallbacks
// =============================================================================
// Default colors, fallbacks, and base design tokens
// =============================================================================

// -----------------------------------------------------------------------------
// Category Fallbacks
// Used when a specific team/artist/event isn't found in the registry
// -----------------------------------------------------------------------------
export const categoryFallbacks = {
  // Sports
  nba: '#C9082A',
  nfl: '#003069',
  mlb: '#002D72',
  nhl: '#000000',
  mls: '#6CC24A',
  soccer: '#38003C',
  'premier-league': '#38003C',
  'la-liga': '#EE8707',
  bundesliga: '#D20515',
  'serie-a': '#024494',
  'ligue-1': '#091C3E',

  // Motorsports & Combat
  f1: '#E10600',
  nascar: '#FECD00',
  indycar: '#DA291C',
  motogp: '#E10600',
  ufc: '#D20A0A',
  boxing: '#8B0000',
  wrestling: '#000000',

  // Individual Sports
  tennis: '#006633',
  golf: '#006747',
  olympics: '#0085C7',

  // Entertainment
  concerts: '#D4AF37',
  'hip-hop': '#FFD700',
  rock: '#000000',
  pop: '#FF69B4',
  country: '#8B4513',
  rnb: '#800080',
  electronic: '#FF00FF',
  latin: '#FF4500',
  kpop: '#7C4DFF',

  // Other
  theater: '#7B2D3E',
  broadway: '#7B2D3E',
  festivals: '#FF00FF',
  comedy: '#FFD700',
} as const;

// -----------------------------------------------------------------------------
// Base UI Colors
// Design tokens for the Seira dark theme
// -----------------------------------------------------------------------------
export const base = {
  // Backgrounds
  bgBase: '#000000',
  bgCard: '#0f0f0f',
  bgElevated: '#1a1a1a',
  bgHover: '#242424',
  bgActive: '#2a2a2a',
  bgOverlay: 'rgba(0, 0, 0, 0.8)',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderMedium: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  borderFocus: 'rgba(207, 168, 114, 0.5)', // gold focus ring

  // Text
  textPrimary: '#f5f3f0',
  textSecondary: '#a8a5a0',
  textMuted: '#6b6864',
  textDisabled: '#4a4744',

  // Brand colors
  gold: '#cfa872',
  goldLight: '#e8dcc8',
  goldDark: '#a88a5c',
  green: '#8fad8b',
  greenLight: '#a8c4a5',

  // Semantic colors
  success: '#8fad8b',
  warning: '#e8a855',
  error: '#d45555',
  info: '#6b8a9f',

  // Global accent (fallback when nothing matches)
  accent: '#6b8a9f',
} as const;

// -----------------------------------------------------------------------------
// Gradient Presets
// For fancy card borders and backgrounds
// -----------------------------------------------------------------------------
export const gradients = {
  // Gold gradient (primary brand)
  goldShimmer: 'linear-gradient(135deg, #cfa872 0%, #e8dcc8 50%, #cfa872 100%)',

  // Dark fade (for card backgrounds)
  darkFade: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',

  // Accent border (subtle glow)
  accentBorder: 'linear-gradient(135deg, rgba(207, 168, 114, 0.3), rgba(207, 168, 114, 0.1))',

  // Radial spotlight
  spotlight: 'radial-gradient(ellipse at center, rgba(207, 168, 114, 0.1) 0%, transparent 70%)',
} as const;

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------
export type Category = keyof typeof categoryFallbacks;
export type BaseColor = keyof typeof base;
export type Gradient = keyof typeof gradients;

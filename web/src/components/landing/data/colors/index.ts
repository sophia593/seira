// =============================================================================
// Seira - Accent Color Registry
// =============================================================================
// Central export for all accent colors and helper functions.
//
// Usage:
//   import { getAccent, getAccentWithFallback, hasAccent } from './colors'
//
//   const color = getAccent('taylor-swift')  // '#B97D8B'
//   const color = getAccent('unknown-artist') // '#6b8a9f' (fallback)
//   const color = getAccentWithFallback('unknown', 'concerts') // '#D4AF37'
//
// To add new colors:
//   1. Find the appropriate sub-file (sports.ts, entertainment.ts, etc.)
//   2. Add the slug and hex color to the relevant object
//   3. The color will automatically be available via getAccent()
// =============================================================================

// Sub-file imports
export * from './sports';
export * from './soccer';
export * from './motorsports';
export * from './entertainment';
export * from './base';

import { nba, nfl, mlb, nhl, mls } from './sports';
import {
  premierLeague,
  laLiga,
  bundesliga,
  serieA,
  ligue1,
  euroCompetitions,
  international,
} from './soccer';
import {
  f1,
  nascar,
  indycar,
  motogp,
  ufc,
  boxing,
  wrestling,
  tennis,
  golf,
  olympics,
} from './motorsports';
import { artists, theater, festivals, comedy } from './entertainment';
import { base, categoryFallbacks } from './base';

// =============================================================================
// Combined Registry
// =============================================================================

/**
 * All accent colors combined into a single lookup object.
 * Keys are kebab-case slugs, values are hex colors.
 */
export const allAccents = {
  // US Sports
  ...nba,
  ...nfl,
  ...mlb,
  ...nhl,
  ...mls,

  // European Soccer
  ...premierLeague,
  ...laLiga,
  ...bundesliga,
  ...serieA,
  ...ligue1,
  ...euroCompetitions,
  ...international,

  // Motorsports & Combat
  ...f1,
  ...nascar,
  ...indycar,
  ...motogp,
  ...ufc,
  ...boxing,
  ...wrestling,

  // Individual Sports
  ...tennis,
  ...golf,
  ...olympics,

  // Entertainment
  ...artists,
  ...theater,
  ...festivals,
  ...comedy,
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize a string to kebab-case for lookup.
 * "Taylor Swift" → "taylor-swift"
 * "Los Angeles Lakers" → "los-angeles-lakers"
 */
function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Get accent color for a slug.
 * Falls back to global accent if not found.
 *
 * @example
 * getAccent('taylor-swift') // '#B97D8B'
 * getAccent('Taylor Swift') // '#B97D8B' (normalized)
 * getAccent('unknown') // '#6b8a9f' (fallback)
 */
export function getAccent(slug: string): string {
  const normalized = normalizeSlug(slug);
  return (allAccents as Record<string, string>)[normalized] ?? base.accent;
}

/**
 * Get accent color with category fallback.
 * Tries slug first, then category fallback, then global accent.
 *
 * @example
 * getAccentWithFallback('taylor-swift', 'concerts') // '#B97D8B'
 * getAccentWithFallback('unknown-artist', 'concerts') // '#D4AF37'
 * getAccentWithFallback('unknown', undefined) // '#6b8a9f'
 */
export function getAccentWithFallback(
  slug: string,
  category?: keyof typeof categoryFallbacks
): string {
  const normalized = normalizeSlug(slug);
  const direct = (allAccents as Record<string, string>)[normalized];

  if (direct) return direct;

  if (category && categoryFallbacks[category]) {
    return categoryFallbacks[category];
  }

  return base.accent;
}

/**
 * Check if a slug exists in the registry.
 *
 * @example
 * hasAccent('taylor-swift') // true
 * hasAccent('unknown-artist') // false
 */
export function hasAccent(slug: string): boolean {
  const normalized = normalizeSlug(slug);
  return normalized in allAccents;
}

/**
 * Get all slugs for a specific category.
 * Useful for autocomplete or validation.
 */
export function getSlugsByCategory(
  category: 'nba' | 'nfl' | 'mlb' | 'nhl' | 'mls' | 'premierLeague' | 'f1' | 'artists' | 'theater' | 'festivals' | 'comedy'
): string[] {
  const categoryMaps: Record<string, Record<string, string>> = {
    nba,
    nfl,
    mlb,
    nhl,
    mls,
    premierLeague,
    f1,
    artists,
    theater,
    festivals,
    comedy,
  };

  const map = categoryMaps[category];
  return map ? Object.keys(map) : [];
}

/**
 * Search for slugs matching a query.
 * Returns up to `limit` results.
 */
export function searchAccents(query: string, limit = 10): string[] {
  const normalized = normalizeSlug(query);
  const allKeys = Object.keys(allAccents);

  return allKeys
    .filter((key) => key.includes(normalized))
    .slice(0, limit);
}

// =============================================================================
// Type Exports
// =============================================================================

/** All possible accent slugs */
export type AccentSlug = keyof typeof allAccents;

/** Category keys for fallback lookup */
export type Category = keyof typeof categoryFallbacks;

/** Stats about the registry */
export const registryStats = {
  totalAccents: Object.keys(allAccents).length,
  sports: Object.keys(nba).length + Object.keys(nfl).length + Object.keys(mlb).length + Object.keys(nhl).length + Object.keys(mls).length,
  soccer: Object.keys(premierLeague).length + Object.keys(laLiga).length + Object.keys(bundesliga).length + Object.keys(serieA).length,
  motorsports: Object.keys(f1).length + Object.keys(nascar).length + Object.keys(ufc).length + Object.keys(tennis).length + Object.keys(golf).length,
  entertainment: Object.keys(artists).length + Object.keys(theater).length + Object.keys(festivals).length + Object.keys(comedy).length,
} as const;

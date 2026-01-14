/**
 * Shared Flight types used across chat results and trip details
 */

// =============================================================================
// Currency Types
// =============================================================================

/**
 * Supported currencies
 */
export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'MXN'

/**
 * Currency display configuration
 */
export const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; name: string; locale: string }> = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  MXN: { symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX' },
}

export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

// =============================================================================
// Currency Helpers
// =============================================================================

/**
 * Format a price with currency symbol
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode = DEFAULT_CURRENCY
): string {
  const config = CURRENCY_CONFIG[currency]

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return CURRENCY_CONFIG[currency].symbol
}

// =============================================================================
// Flight Types
// =============================================================================

/**
 * Flight stop information (for multi-leg flights)
 */
export interface FlightStop {
  airport: string
  city: string
  arrivalTime: string
  departureTime: string
  layoverDuration: string
}

/**
 * Flight data from API responses
 */
export interface Flight {
  id: string
  airline: string
  flight_number: string
  departure_airport: string
  departure_time: string
  departure_date: string
  arrival_airport: string
  arrival_time: string
  arrival_date: string
  price: number
  currency: CurrencyCode
  duration: string
  stops?: number
  stopDetails?: FlightStop[]
  aircraft?: string
  cabin_class?: string
  booking_url?: string | null
}

/**
 * Selected flight with normalized structure for state management
 */
export interface SelectedFlight {
  id: string
  airline: string
  flightNumber: string
  departure: {
    airport: string
    time: string
    date: string
  }
  arrival: {
    airport: string
    time: string
    date: string
  }
  price: number
  currency: CurrencyCode
  duration: string
}

/**
 * Flight saved to a trip with additional booking details
 */
export interface TripFlight extends Flight {
  booking_reference?: string
  confirmation_number?: string
  seat_assignment?: string
  baggage_allowance?: string
  is_outbound: boolean
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Flight search filters
 */
export interface FlightFilters {
  maxPrice?: number
  maxStops?: number
  airlines?: string[]
  cabinClass?: string
  departureTimeRange?: {
    start: string  // "06:00"
    end: string    // "18:00"
  }
}

/**
 * Flight sort options
 */
export type FlightSortOption =
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc'
  | 'departure-asc'
  | 'arrival-asc'

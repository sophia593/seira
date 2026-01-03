/**
 * Trip-related types with forward-compatible structures
 *
 * These types support both:
 * - Current flat TripDetail API response
 * - Future richer nested structures
 */

// =============================================================================
// Event Types
// =============================================================================

/**
 * Minimal event data from flat TripDetail
 */
export interface TripEventFlat {
  name: string
  date: string | null
  time?: string | null
  venue?: string | null
  venue_address?: string | null
  price_estimate?: number | null
  purchase_url?: string | null
}

/**
 * Rich event data (future API or manually constructed)
 */
export interface TripEventRich {
  id: string
  name: string
  date: string
  time?: string | null
  venue_name: string
  venue_city: string
  venue_state?: string | null
  venue_address?: string | null
  image_url?: string | null
  ticket_url: string
  section?: string | null
  row?: string | null
  seats?: string | null
  price_per_ticket?: number | null
  quantity: number
}

/**
 * Union type that accepts either format
 */
export type TripEventData = TripEventFlat | TripEventRich

/**
 * Type guard to check if event data is the rich format
 */
export function isRichEvent(event: TripEventData): event is TripEventRich {
  return 'id' in event && 'venue_name' in event && 'ticket_url' in event
}

// =============================================================================
// Flight Types
// =============================================================================

/**
 * Minimal flight data from flat TripDetail
 */
export interface TripFlightFlat {
  direction: 'outbound' | 'return'
  origin: string | null
  destination: string | null
  date: string | null
  time?: string | null
  carrier?: string | null
  price?: number | null
  purchase_url?: string | null
}

/**
 * Rich flight data (future API or manually constructed)
 */
export interface TripFlightRich {
  id: string
  direction: 'outbound' | 'return'
  airline_name: string
  airline_code: string
  airline_logo_url?: string | null
  flight_number: string
  origin_code: string
  origin_city: string
  origin_timezone?: string
  destination_code: string
  destination_city: string
  destination_timezone?: string
  departure_time: string
  arrival_time: string
  duration_minutes: number
  stops: number
  stop_details?: Array<{
    airport_code: string
    airport_city: string
    layover_minutes: number
  }>
  cabin_class?: string
  price_per_person: number
  currency?: string
  booking_url: string
}

/**
 * Union type that accepts either format
 */
export type TripFlightData = TripFlightFlat | TripFlightRich

/**
 * Type guard to check if flight data is the rich format
 */
export function isRichFlight(flight: TripFlightData): flight is TripFlightRich {
  return 'id' in flight && 'airline_name' in flight && 'departure_time' in flight
}

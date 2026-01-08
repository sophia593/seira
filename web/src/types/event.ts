/**
 * Shared Event type used across chat results and trip details
 */
export interface Event {
  id: string
  name: string
  date: string // ISO date "2025-03-15"
  time?: string | null // "20:00" or null
  venue_name: string
  venue_city: string
  venue_state?: string | null
  image_url?: string | null
  price_min?: number | null
  price_max?: number | null
  currency?: string // Default "USD"
  purchase_url?: string | null
}

/**
 * Event with additional ticket details for saved trips
 */
export interface TripEvent extends Event {
  ticket_url: string
  section?: string | null
  row?: string | null
  seats?: string | null
  price_per_ticket?: number | null
  quantity: number
}

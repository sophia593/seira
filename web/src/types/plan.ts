// =============================================================================
// Plan Types - Source of Truth
// =============================================================================

// -----------------------------------------------------------------------------
// Enums & Constants
// -----------------------------------------------------------------------------

export type PlanStatus =
  | 'draft'        // User is building the plan
  | 'ready'        // All selections made, ready to book
  | 'booked'       // User has booked (external)
  | 'completed'    // Trip has happened
  | 'cancelled'    // User cancelled

export type FlightTimingTag =
  | 'arrives_day_before'      // Arrives day before event
  | 'arrives_morning_of'      // Arrives morning of event day
  | 'arrives_before_event'    // Arrives with buffer before event
  | 'arrives_tight'           // Cutting it close
  | 'arrives_after_event'     // Would miss the event (invalid)
  | 'departs_next_morning'    // Leaves morning after event
  | 'departs_same_night'      // Red-eye after event
  | 'departs_day_after'       // Full day after event

export type HotelDistanceTag =
  | 'walkable'         // < 1km from venue
  | 'short_ride'       // 1-5km from venue
  | 'moderate'         // 5-15km from venue
  | 'far'              // > 15km from venue

export type GroundTransportMode =
  | 'rideshare'
  | 'taxi'
  | 'public_transit'
  | 'rental_car'
  | 'hotel_shuttle'
  | 'walk'

export type ConstraintFlag =
  | 'tight_arrival'           // Less than 3 hours before event
  | 'late_arrival'            // Arrives after event starts
  | 'early_departure'         // Leaves before event ends
  | 'red_eye_outbound'        // Overnight outbound flight
  | 'red_eye_return'          // Overnight return flight
  | 'long_layover'            // Layover > 3 hours
  | 'short_connection'        // Connection < 1 hour
  | 'hotel_far_from_venue'    // Hotel > 10km from venue
  | 'no_airport_transport'    // No clear transport to/from airport
  | 'event_sold_out'          // Event may be sold out
  | 'price_spike'             // Prices higher than usual
  | 'limited_availability'    // Few options remaining

// -----------------------------------------------------------------------------
// Event Block
// -----------------------------------------------------------------------------

export interface PlanEvent {
  // Identity
  id: string
  provider: 'ticketmaster' | 'stubhub' | 'seatgeek' | 'manual'
  provider_id: string | null

  // Core info
  name: string
  date: string                    // YYYY-MM-DD
  time: string | null             // HH:MM:SS (local time)
  end_time: string | null         // HH:MM:SS (estimated end)

  // Venue
  venue_name: string | null
  venue_address: string | null
  venue_city: string | null
  venue_state: string | null
  venue_country: string | null
  venue_lat: number | null
  venue_lng: number | null

  // Category
  segment: string | null          // Music, Sports, Arts & Theatre
  genre: string | null            // Rock, NBA, Broadway

  // Pricing
  price_estimate: number | null   // Per ticket estimate
  price_min: number | null
  price_max: number | null

  // Links
  purchase_url: string | null
  image_url: string | null
}

// -----------------------------------------------------------------------------
// Origin
// -----------------------------------------------------------------------------

export interface PlanOrigin {
  city: string | null
  airport_code: string              // IATA code (LAX, JFK, etc.)
  airport_name: string | null
  lat: number | null
  lng: number | null
  timezone: string | null           // e.g., "America/Los_Angeles"
}

// -----------------------------------------------------------------------------
// Travel Dates
// -----------------------------------------------------------------------------

export interface PlanTravelDates {
  outbound_date: string             // YYYY-MM-DD
  return_date: string | null        // YYYY-MM-DD, null for one-way
  nights: number
  is_flexible: boolean              // User open to ±1 day
}

// -----------------------------------------------------------------------------
// Flight Options
// -----------------------------------------------------------------------------

export interface FlightSegment {
  departure_airport: string         // IATA code
  departure_time: string            // ISO datetime
  arrival_airport: string           // IATA code
  arrival_time: string              // ISO datetime
  carrier_code: string              // e.g., "AA"
  carrier_name: string              // e.g., "American Airlines"
  flight_number: string             // e.g., "AA1234"
  aircraft: string | null
  duration_minutes: number
  duration_formatted: string        // e.g., "5h 30m"
}

export interface FlightOption {
  id: string
  source: 'amadeus' | 'mock'

  // Pricing
  price: number                     // Total price USD
  price_per_person: number
  currency: string

  // Outbound
  outbound_segments: FlightSegment[]
  outbound_duration_minutes: number
  outbound_duration_formatted: string
  outbound_stops: number
  outbound_timing_tags: FlightTimingTag[]

  // Return (null for one-way)
  return_segments: FlightSegment[] | null
  return_duration_minutes: number | null
  return_duration_formatted: string | null
  return_stops: number | null
  return_timing_tags: FlightTimingTag[] | null

  // Meta
  validating_carrier: string
  validating_carrier_name: string
  cabin_class: 'economy' | 'premium_economy' | 'business' | 'first'
  seats_available: number | null
  is_nonstop: boolean
  booking_url: string | null

  // Constraint analysis
  constraints: ConstraintFlag[]
  arrival_buffer_minutes: number | null  // Minutes before event starts
}

// -----------------------------------------------------------------------------
// Hotel Options
// -----------------------------------------------------------------------------

export interface HotelOption {
  id: string
  source: 'amadeus' | 'mock'

  // Property
  hotel_id: string
  name: string
  chain: string | null              // e.g., "Marriott", "Hilton"
  star_rating: number | null        // 1-5
  address: string | null
  city: string
  lat: number | null
  lng: number | null

  // Distance from venue
  venue_distance_km: number | null
  venue_distance_formatted: string | null  // e.g., "2.3 km"
  venue_distance_tag: HotelDistanceTag | null

  // Room
  room_type: string | null          // e.g., "STANDARD", "SUITE"
  room_description: string | null
  bed_type: string | null           // e.g., "KING", "DOUBLE"
  guests: number

  // Pricing
  price: number                     // Total stay price USD
  price_per_night: number
  currency: string

  // Stay dates
  check_in: string                  // YYYY-MM-DD
  check_out: string                 // YYYY-MM-DD
  nights: number

  // Amenities
  amenities: string[]               // ["WiFi", "Parking", "Breakfast", "Pool"]

  // Policies
  cancellation_policy: string | null
  cancellation_deadline: string | null  // ISO datetime
  is_refundable: boolean

  // Links
  booking_url: string | null
  image_url: string | null

  // Constraint analysis
  constraints: ConstraintFlag[]
}

// -----------------------------------------------------------------------------
// Ground Transport
// -----------------------------------------------------------------------------

export interface GroundTransportLeg {
  type: 'airport_to_hotel' | 'hotel_to_venue' | 'venue_to_hotel' | 'hotel_to_airport'
  mode: GroundTransportMode
  distance_km: number | null
  duration_minutes: number | null
  price_estimate: number | null     // USD
  price_range: { min: number; max: number } | null
  notes: string | null              // e.g., "Uber/Lyft available"
}

export interface PlanGroundTransport {
  legs: GroundTransportLeg[]
  total_estimate: number | null     // USD, all legs
  total_range: { min: number; max: number } | null
  recommended_mode: GroundTransportMode | null
}

// -----------------------------------------------------------------------------
// Cost Range
// -----------------------------------------------------------------------------

export interface PlanCostRange {
  // Component costs (estimated)
  event_low: number | null
  event_high: number | null
  flight_low: number | null
  flight_high: number | null
  hotel_low: number | null
  hotel_high: number | null
  transport_low: number | null
  transport_high: number | null

  // Totals
  total_low: number | null
  total_high: number | null

  // Selected costs (after user picks options)
  event_selected: number | null
  flight_selected: number | null
  hotel_selected: number | null
  transport_selected: number | null
  total_selected: number | null

  // Currency
  currency: string                  // Always "USD" for now

  // Per person (for multi-traveler)
  travelers: number
  total_per_person_low: number | null
  total_per_person_high: number | null
}

// -----------------------------------------------------------------------------
// Selections
// -----------------------------------------------------------------------------

export interface PlanSelections {
  flight: FlightOption | null
  hotel: HotelOption | null
  ground_transport: GroundTransportMode | null

  // Selection timestamps
  flight_selected_at: string | null   // ISO datetime
  hotel_selected_at: string | null
  transport_selected_at: string | null
}

// -----------------------------------------------------------------------------
// Sharing
// -----------------------------------------------------------------------------

export interface PlanSharing {
  is_shared: boolean
  share_token: string | null
  share_url: string | null
  shared_by_name: string | null
  shared_at: string | null          // ISO datetime
}

// -----------------------------------------------------------------------------
// Plan Object (Complete)
// -----------------------------------------------------------------------------

export interface Plan {
  // Identity
  id: string
  user_id: string
  title: string

  // Status
  status: PlanStatus
  created_at: string                // ISO datetime
  updated_at: string                // ISO datetime

  // Core components
  event: PlanEvent
  origin: PlanOrigin
  travel_dates: PlanTravelDates

  // Options (search results)
  flight_options: FlightOption[]
  hotel_options: HotelOption[]

  // User selections
  selections: PlanSelections

  // Derived data
  ground_transport: PlanGroundTransport | null
  cost_range: PlanCostRange
  constraints: ConstraintFlag[]     // Aggregated from all selections

  // Sharing
  sharing: PlanSharing

  // Notes
  notes: string | null

  // Timestamps
  quoted_at: string | null          // When prices were fetched
  quote_expires_at: string | null   // When prices may be stale
  booked_at: string | null          // When user marked as booked
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface PlanSummary {
  id: string
  title: string
  status: PlanStatus
  event_name: string
  event_date: string
  destination_city: string | null
  total_estimate: number | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface CreatePlanRequest {
  // Required
  event: Omit<PlanEvent, 'id'>
  origin: PlanOrigin

  // Optional
  title?: string
  travel_dates?: Partial<PlanTravelDates>
  notes?: string
}

export interface UpdatePlanRequest {
  title?: string
  status?: PlanStatus
  origin?: Partial<PlanOrigin>
  travel_dates?: Partial<PlanTravelDates>
  selections?: Partial<PlanSelections>
  notes?: string
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export type PlanStep = 'event' | 'flights' | 'hotel' | 'review'

export interface PlanProgress {
  current_step: PlanStep
  event_confirmed: boolean
  origin_set: boolean
  dates_set: boolean
  flight_selected: boolean
  hotel_selected: boolean
  is_complete: boolean
  completion_percentage: number     // 0-100
}

export function getPlanProgress(plan: Plan): PlanProgress {
  const event_confirmed = !!plan.event.id
  const origin_set = !!plan.origin.airport_code
  const dates_set = !!plan.travel_dates.outbound_date
  const flight_selected = !!plan.selections.flight
  const hotel_selected = !!plan.selections.hotel

  const steps = [event_confirmed, origin_set, dates_set, flight_selected, hotel_selected]
  const completed = steps.filter(Boolean).length
  const completion_percentage = Math.round((completed / steps.length) * 100)

  let current_step: PlanStep = 'event'
  if (event_confirmed && origin_set && dates_set) {
    if (!flight_selected) {
      current_step = 'flights'
    } else if (!hotel_selected) {
      current_step = 'hotel'
    } else {
      current_step = 'review'
    }
  }

  return {
    current_step,
    event_confirmed,
    origin_set,
    dates_set,
    flight_selected,
    hotel_selected,
    is_complete: flight_selected && hotel_selected,
    completion_percentage,
  }
}

// -----------------------------------------------------------------------------
// Constraint Helpers
// -----------------------------------------------------------------------------

export function getConstraintSeverity(flag: ConstraintFlag): 'warning' | 'error' {
  const errors: ConstraintFlag[] = [
    'late_arrival',
    'early_departure',
    'short_connection',
  ]
  return errors.includes(flag) ? 'error' : 'warning'
}

export function getConstraintMessage(flag: ConstraintFlag): string {
  const messages: Record<ConstraintFlag, string> = {
    tight_arrival: 'Arrives less than 3 hours before event',
    late_arrival: 'Flight arrives after event starts',
    early_departure: 'Flight departs before event ends',
    red_eye_outbound: 'Overnight outbound flight',
    red_eye_return: 'Overnight return flight',
    long_layover: 'Layover over 3 hours',
    short_connection: 'Connection under 1 hour',
    hotel_far_from_venue: 'Hotel is far from venue',
    no_airport_transport: 'Transport to/from airport unclear',
    event_sold_out: 'Event may be sold out',
    price_spike: 'Prices are higher than usual',
    limited_availability: 'Limited options remaining',
  }
  return messages[flag]
}

// =============================================================================
// Seira Foundation Types
// =============================================================================

// -----------------------------------------------------------------------------
// Event
// -----------------------------------------------------------------------------

export type EventCategory =
  | "sports"
  | "music"
  | "theater"
  | "festival"
  | "film"

export interface EventVenue {
  name: string
  address: string
  city: string
  state: string
  country: string
  coordinates: {
    lat: number
    lng: number
  }
}

export interface Event {
  id: string
  name: string
  date: string // ISO date
  startTime: string // e.g. "19:30"
  doorsTime?: string
  endTimeEstimate?: string
  timezone: string
  venue: EventVenue
  category: EventCategory
  imageUrl?: string
  sourceId?: string
}

// -----------------------------------------------------------------------------
// Flight
// -----------------------------------------------------------------------------

export type TimingSeverity = "comfortable" | "tight" | "risky"

export interface TimingTag {
  label: string
  severity: TimingSeverity
  minutesBuffer: number
}

export interface FlightEndpoint {
  airport: string // IATA code
  time: string // ISO datetime
  city: string
}

export interface FlightOption {
  id: string
  airline: string
  flightNumber: string
  departure: FlightEndpoint
  arrival: FlightEndpoint
  stops: number
  stopCities?: string[]
  duration: string // e.g. "4h 10m"
  price: number
  timingTag: TimingTag
}

// -----------------------------------------------------------------------------
// Hotel
// -----------------------------------------------------------------------------

export type HotelCluster = "near-venue" | "value"
export type TransportMode = "walk" | "drive" | "transit"

export interface DistanceToVenue {
  miles: number
  transitMinutes: number
  mode: TransportMode
}

export interface HotelOption {
  id: string
  name: string
  pricePerNight: number
  totalPrice: number
  nights: number
  rating: number
  distanceToVenue: DistanceToVenue
  checkIn: string // ISO date
  checkOut: string // ISO date
  imageUrl?: string
  cluster: HotelCluster
}

// -----------------------------------------------------------------------------
// Ground Transport
// -----------------------------------------------------------------------------

export interface TransportSegment {
  label: string
  distance: string // e.g. "18.2 mi"
  estimatedMinutes: number
  rideshareEstimate: number
  transitNote?: string
  lateNightNote?: string
}

// -----------------------------------------------------------------------------
// Constraint Flags
// -----------------------------------------------------------------------------

export type ConstraintType =
  | "tight-arrival"
  | "hotel-far"
  | "return-early"
  | "late-egress"
  | "overnight-recommended"
  | "connection-risk"
  | "checkout-conflict"

export type ConstraintSeverity = "info" | "warning" | "danger"

export interface ConstraintFlag {
  id: string
  type: ConstraintType
  severity: ConstraintSeverity
  message: string
  targetType?: "flight" | "hotel" | "transport"
  targetId?: string
}

// -----------------------------------------------------------------------------
// Cost Estimate
// -----------------------------------------------------------------------------

export interface CostBreakdownItem {
  category: string
  min: number
  max: number
}

export interface CostEstimate {
  min: number
  max: number
  breakdown: CostBreakdownItem[]
}

// -----------------------------------------------------------------------------
// Plan
// -----------------------------------------------------------------------------

export type PlanStatus = "generating" | "draft" | "ready" | "shared"

export interface PlanOrigin {
  city: string
  state: string
  airportCode: string
}

export interface PlanTravelDates {
  arrive: string // ISO date
  depart: string // ISO date
}

export interface PlanFlights {
  outbound: FlightOption[]
  return: FlightOption[]
}

export interface PlanSelections {
  flightOutbound?: string // FlightOption id
  flightReturn?: string
  hotel?: string // HotelOption id
}

export interface Plan {
  id: string
  event: Event
  origin: PlanOrigin
  travelDates: PlanTravelDates
  flights: PlanFlights
  hotels: HotelOption[]
  groundTransport: TransportSegment[]
  costEstimate: CostEstimate
  constraintFlags: ConstraintFlag[]
  selections: PlanSelections
  status: PlanStatus
  userId?: string
  shareToken?: string
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
}

// -----------------------------------------------------------------------------
// User Preferences
// -----------------------------------------------------------------------------

export type CabinClass =
  | "economy"
  | "premium_economy"
  | "business"
  | "first"

export interface UserPreferences {
  homeAirport?: string
  preferredAirlines?: string[]
  cabinClass: CabinClass
  budgetRange?: {
    min: number
    max: number
  }
  preferNonstop: boolean
}

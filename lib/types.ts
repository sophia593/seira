export type EventCategory =
  | "sports"
  | "music"
  | "theater"
  | "festival"
  | "film"

export interface Coordinates {
  lat: number
  lng: number
}

export interface Venue {
  name: string
  address: string
  city: string
  state: string
  country: string
  coordinates: Coordinates
}

export interface Event {
  id: string
  name: string
  date: string // ISO
  startTime: string
  doorsTime?: string
  endTimeEstimate?: string
  timezone: string
  venue: Venue
  category: EventCategory
  imageUrl?: string
  sourceId?: string
}

export interface FlightEndpoint {
  airport: string
  time: string
  city: string
}

export interface TimingTag {
  label: string
  severity: "comfortable" | "tight" | "risky"
  minutesBuffer: number
}

export interface FlightOption {
  id: string
  airline: string
  flightNumber: string
  departure: FlightEndpoint
  arrival: FlightEndpoint
  stops: number
  stopCities?: string[]
  duration: string
  price: number
  timingTag: TimingTag
}

export interface DistanceToVenue {
  miles: number
  transitMinutes: number
  mode: "walk" | "drive" | "transit"
}

export interface HotelOption {
  id: string
  name: string
  pricePerNight: number
  totalPrice: number
  nights: number
  rating: number
  distanceToVenue: DistanceToVenue
  checkIn: string
  checkOut: string
  imageUrl?: string
  cluster: "near-venue" | "value"
}

export interface TransportSegment {
  label: string
  distance: string
  estimatedMinutes: number
  rideshareEstimate: string
  transitNote?: string
  lateNightNote?: string
}

export type ConstraintFlagType =
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
  type: ConstraintFlagType
  severity: ConstraintSeverity
  message: string
  targetType?: "flight" | "hotel" | "transport"
  targetId?: string
}

export interface CostBreakdown {
  category: string
  min: number
  max: number
}

export interface CostEstimate {
  min: number
  max: number
  breakdown: CostBreakdown[]
}

export interface Selections {
  flightOutbound?: string
  flightReturn?: string
  hotel?: string
}

export type PlanStatus = "generating" | "draft" | "ready" | "shared"

export interface Plan {
  id: string
  event: Event
  origin: {
    city: string
    state: string
    airportCode: string
  }
  travelDates: {
    arrive: string
    depart: string
  }
  flights: {
    outbound: FlightOption[]
    return: FlightOption[]
  }
  hotels: HotelOption[]
  groundTransport: TransportSegment[]
  costEstimate: CostEstimate
  constraintFlags: ConstraintFlag[]
  selections: Selections
  status: PlanStatus
  userId?: string
  shareToken?: string
  createdAt: string
  updatedAt: string
}

export type CabinClass = "economy" | "premium_economy" | "business" | "first"

export interface UserPreferences {
  homeAirport?: string
  preferredAirlines?: string[]
  cabinClass: CabinClass
  budgetRange?: { min: number; max: number }
  preferNonstop: boolean
}

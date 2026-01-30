import type {
  FlightOffer,
  FlightSegment,
  FlightSearchParams,
  FlightSearchResult,
} from '@/hooks/use-flight-search'

// =============================================================================
// Deterministic seeding
// =============================================================================

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function seeded(seed: number, index: number): number {
  const x = Math.sin(seed + index * 127.1) * 10000
  return x - Math.floor(x) // 0..1
}

// =============================================================================
// Carrier data
// =============================================================================

const CARRIERS = [
  { code: 'AA', name: 'American Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'B6', name: 'JetBlue Airways' },
  { code: 'WN', name: 'Southwest Airlines' },
  { code: 'NK', name: 'Spirit Airlines' },
  { code: 'F9', name: 'Frontier Airlines' },
  { code: 'AS', name: 'Alaska Airlines' },
]

const AIRCRAFT = ['Boeing 737-800', 'Airbus A320', 'Boeing 757-200', 'Airbus A321', 'Boeing 737 MAX 8', 'Embraer E175']

const HUB_AIRPORTS = ['ATL', 'ORD', 'DFW', 'DEN', 'CLT', 'IAH', 'PHX', 'MSP']

// =============================================================================
// Route duration heuristic
// =============================================================================

const KNOWN_ROUTES: Record<string, number> = {
  'LAX-JFK': 5.25, 'LAX-SFO': 1.25, 'LAX-ORD': 4.0, 'LAX-MIA': 5.0,
  'LAX-SEA': 2.5,  'LAX-DEN': 2.5,  'LAX-DFW': 3.25, 'LAX-BOS': 5.5,
  'JFK-LAX': 5.5,  'JFK-ORD': 2.5,  'JFK-MIA': 3.0,  'JFK-SFO': 6.0,
  'JFK-BOS': 1.25, 'JFK-DFW': 3.75, 'JFK-ATL': 2.25, 'JFK-DEN': 4.5,
  'SFO-JFK': 5.5,  'SFO-LAX': 1.5,  'SFO-ORD': 4.25, 'SFO-SEA': 2.0,
  'ORD-LAX': 4.25, 'ORD-JFK': 2.75, 'ORD-MIA': 3.0,  'ORD-DFW': 2.5,
  'MIA-JFK': 3.25, 'MIA-LAX': 5.25, 'MIA-ORD': 3.0,  'MIA-ATL': 1.75,
  'ATL-JFK': 2.25, 'ATL-LAX': 4.5,  'ATL-ORD': 2.0,  'ATL-MIA': 1.75,
  'DFW-JFK': 3.75, 'DFW-LAX': 3.25, 'DFW-ORD': 2.5,  'DFW-MIA': 3.0,
  'BOS-JFK': 1.25, 'BOS-LAX': 5.5,  'BOS-ORD': 2.75, 'BOS-MIA': 3.5,
  'SEA-LAX': 2.75, 'SEA-SFO': 2.0,  'SEA-ORD': 4.0,  'SEA-JFK': 5.5,
  'DEN-LAX': 2.5,  'DEN-JFK': 4.5,  'DEN-ORD': 2.5,  'DEN-SFO': 2.75,
}

function estimateFlightHours(origin: string, dest: string): number {
  const key = `${origin}-${dest}`
  const rev = `${dest}-${origin}`
  if (KNOWN_ROUTES[key]) return KNOWN_ROUTES[key]
  if (KNOWN_ROUTES[rev]) return KNOWN_ROUTES[rev] + 0.25
  // Fallback: hash-based 1.5–6 hours
  return 1.5 + (simpleHash(key) % 45) / 10
}

// =============================================================================
// Cabin class pricing
// =============================================================================

const CABIN_MULTIPLIER: Record<string, number> = {
  ECONOMY: 1.0,
  PREMIUM_ECONOMY: 1.6,
  BUSINESS: 3.2,
  FIRST: 5.5,
}

// =============================================================================
// Helpers
// =============================================================================

function formatDuration(hours: number): { raw: string; formatted: string } {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return {
    raw: `PT${h}H${m}M`,
    formatted: `${h}h ${m.toString().padStart(2, '0')}m`,
  }
}

function addHours(isoDate: string, hours: number): string {
  const d = new Date(isoDate)
  d.setMinutes(d.getMinutes() + Math.round(hours * 60))
  return d.toISOString().slice(0, 19)
}

// =============================================================================
// Generator
// =============================================================================

export function generateMockFlights(params: FlightSearchParams): FlightSearchResult {
  const seed = simpleHash(
    params.origin + params.destination + params.departureDate + (params.returnDate || '') + (params.cabinClass || '')
  )
  const cabin = params.cabinClass || 'ECONOMY'
  const multiplier = CABIN_MULTIPLIER[cabin] || 1.0
  const directHours = estimateFlightHours(params.origin, params.destination)
  const isRoundTrip = !!params.returnDate

  const offers: FlightOffer[] = []

  for (let i = 0; i < 10; i++) {
    const r = (idx: number) => seeded(seed, i * 100 + idx)
    const carrier = CARRIERS[Math.floor(r(0) * CARRIERS.length)]
    const isNonstop = i < 5 // first 5 nonstop, rest 1-stop
    const aircraft = AIRCRAFT[Math.floor(r(1) * AIRCRAFT.length)]

    // Departure time: spread across 6am–9pm
    const depHour = 6 + Math.floor(r(2) * 15)
    const depMinute = Math.floor(r(3) * 4) * 15 // 0, 15, 30, 45
    const depTime = `${params.departureDate}T${depHour.toString().padStart(2, '0')}:${depMinute.toString().padStart(2, '0')}:00`

    let outboundSegments: FlightSegment[]
    let totalOutboundHours: number
    let outboundStops: number

    if (isNonstop) {
      totalOutboundHours = directHours + (r(4) - 0.5) * 0.5 // +/- 15min variance
      const arrTime = addHours(depTime, totalOutboundHours)
      const dur = formatDuration(totalOutboundHours)
      outboundSegments = [{
        departure_airport: params.origin,
        departure_time: depTime,
        arrival_airport: params.destination,
        arrival_time: arrTime,
        carrier_code: carrier.code,
        carrier_name: carrier.name,
        flight_number: `${carrier.code} ${1000 + Math.floor(r(5) * 8000)}`,
        aircraft,
        duration: dur.raw,
        duration_formatted: dur.formatted,
        stops: 0,
      }]
      outboundStops = 0
    } else {
      // 1-stop via hub
      const hub = HUB_AIRPORTS.filter(h => h !== params.origin && h !== params.destination)[Math.floor(r(6) * 6)]
      const leg1Hours = directHours * (0.4 + r(7) * 0.2)
      const layoverHours = 1 + r(8) * 1.5
      const leg2Hours = directHours * (0.5 + r(9) * 0.2)
      totalOutboundHours = leg1Hours + layoverHours + leg2Hours

      const leg1Arr = addHours(depTime, leg1Hours)
      const leg2Dep = addHours(leg1Arr, layoverHours)
      const leg2Arr = addHours(leg2Dep, leg2Hours)
      const dur1 = formatDuration(leg1Hours)
      const dur2 = formatDuration(leg2Hours)
      const carrier2 = CARRIERS[Math.floor(r(10) * CARRIERS.length)]

      outboundSegments = [
        {
          departure_airport: params.origin,
          departure_time: depTime,
          arrival_airport: hub,
          arrival_time: leg1Arr,
          carrier_code: carrier.code,
          carrier_name: carrier.name,
          flight_number: `${carrier.code} ${1000 + Math.floor(r(11) * 8000)}`,
          aircraft,
          duration: dur1.raw,
          duration_formatted: dur1.formatted,
          stops: 0,
        },
        {
          departure_airport: hub,
          departure_time: leg2Dep,
          arrival_airport: params.destination,
          arrival_time: leg2Arr,
          carrier_code: carrier2.code,
          carrier_name: carrier2.name,
          flight_number: `${carrier2.code} ${1000 + Math.floor(r(12) * 8000)}`,
          aircraft: AIRCRAFT[Math.floor(r(13) * AIRCRAFT.length)],
          duration: dur2.raw,
          duration_formatted: dur2.formatted,
          stops: 0,
        },
      ]
      outboundStops = 1
    }

    const outDur = formatDuration(totalOutboundHours)

    // Return segments (if round trip)
    let returnSegments: FlightSegment[] | null = null
    let returnDuration: string | null = null
    let returnDurationFormatted: string | null = null
    let returnStops: number | null = null

    if (isRoundTrip && params.returnDate) {
      const retHours = directHours + (r(20) - 0.5) * 0.5
      const retDepHour = 8 + Math.floor(r(21) * 12)
      const retDepMinute = Math.floor(r(22) * 4) * 15
      const retDepTime = `${params.returnDate}T${retDepHour.toString().padStart(2, '0')}:${retDepMinute.toString().padStart(2, '0')}:00`
      const retArrTime = addHours(retDepTime, retHours)
      const retDur = formatDuration(retHours)
      const retCarrier = CARRIERS[Math.floor(r(23) * CARRIERS.length)]

      returnSegments = [{
        departure_airport: params.destination,
        departure_time: retDepTime,
        arrival_airport: params.origin,
        arrival_time: retArrTime,
        carrier_code: retCarrier.code,
        carrier_name: retCarrier.name,
        flight_number: `${retCarrier.code} ${1000 + Math.floor(r(24) * 8000)}`,
        aircraft: AIRCRAFT[Math.floor(r(25) * AIRCRAFT.length)],
        duration: retDur.raw,
        duration_formatted: retDur.formatted,
        stops: 0,
      }]
      returnDuration = retDur.raw
      returnDurationFormatted = retDur.formatted
      returnStops = 0
    }

    // Price: base from duration, vary by cabin and per-offer
    const basePrice = 80 + directHours * 45
    const stopDiscount = isNonstop ? 1.0 : 0.75
    const variance = 0.8 + r(30) * 0.4 // 0.8–1.2
    const price = Math.round(basePrice * multiplier * stopDiscount * variance * (isRoundTrip ? 1.8 : 1.0))

    offers.push({
      id: `mock_flight_${seed}_${i}`,
      source: 'mock',
      price,
      currency: 'USD',
      price_per_adult: price,
      outbound_segments: outboundSegments,
      outbound_duration: outDur.raw,
      outbound_duration_formatted: outDur.formatted,
      outbound_stops: outboundStops,
      return_segments: returnSegments,
      return_duration: returnDuration,
      return_duration_formatted: returnDurationFormatted,
      return_stops: returnStops,
      validating_carrier: carrier.code,
      validating_carrier_name: carrier.name,
      booking_class: cabin === 'ECONOMY' ? 'Y' : cabin === 'BUSINESS' ? 'J' : cabin === 'FIRST' ? 'F' : 'W',
      seats_available: 2 + Math.floor(r(31) * 7),
      is_round_trip: isRoundTrip,
      is_nonstop: isNonstop,
    })
  }

  // Apply filters
  let filtered = offers
  if (params.nonstopOnly) {
    filtered = filtered.filter(o => o.is_nonstop)
  }
  if (params.maxOffers) {
    filtered = filtered.slice(0, params.maxOffers)
  }

  // Sort by price
  filtered.sort((a, b) => a.price - b.price)

  return {
    offers: filtered,
    searchParams: { ...params } as Record<string, unknown>,
    totalCount: filtered.length,
  }
}

import type {
  HotelOffer,
  HotelSearchParams,
  HotelSearchResult,
} from '@/hooks/use-hotel-search'

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
  return x - Math.floor(x)
}

// =============================================================================
// Hotel chain templates
// =============================================================================

interface HotelTemplate {
  prefix: string
  stars: number
}

const HOTEL_TEMPLATES: HotelTemplate[] = [
  { prefix: 'Four Seasons', stars: 5 },
  { prefix: 'W', stars: 5 },
  { prefix: 'The Westin', stars: 4 },
  { prefix: 'Hyatt Regency', stars: 4 },
  { prefix: 'Hilton', stars: 4 },
  { prefix: 'Marriott', stars: 4 },
  { prefix: 'Sheraton', stars: 4 },
  { prefix: 'Courtyard by Marriott', stars: 3 },
  { prefix: 'Hampton Inn', stars: 3 },
  { prefix: 'Residence Inn by Marriott', stars: 3 },
  { prefix: 'Holiday Inn', stars: 3 },
  { prefix: 'Best Western Plus', stars: 3 },
]

// =============================================================================
// Pricing by star rating
// =============================================================================

const STAR_PRICE_RANGE: Record<number, [number, number]> = {
  3: [120, 220],
  4: [200, 400],
  5: [380, 600],
}

// =============================================================================
// Amenity pools by star rating
// =============================================================================

const BASE_AMENITIES = ['Free WiFi', 'Air Conditioning']

const STAR_AMENITIES: Record<number, string[]> = {
  3: ['Free Parking', 'Fitness Center'],
  4: ['Free Parking', 'Breakfast Included', 'Fitness Center', 'Restaurant', 'Bar'],
  5: ['Valet Parking', 'Breakfast Included', 'Fitness Center', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Room Service', 'Concierge'],
}

// =============================================================================
// Room and bed data
// =============================================================================

const BED_TYPES_BY_STAR: Record<number, string[]> = {
  3: ['DOUBLE', 'QUEEN', 'SINGLE'],
  4: ['QUEEN', 'KING', 'DOUBLE'],
  5: ['KING', 'CALIFORNIA_KING', 'QUEEN'],
}

const ROOM_TYPES_BY_STAR: Record<number, string[]> = {
  3: ['STANDARD', 'SUPERIOR'],
  4: ['SUPERIOR', 'DELUXE', 'STANDARD'],
  5: ['DELUXE', 'SUITE', 'SUPERIOR'],
}

// =============================================================================
// City code mapping
// =============================================================================

const CITY_CODES: Record<string, string> = {
  'new york': 'NYC', 'los angeles': 'LAX', 'chicago': 'CHI',
  'miami': 'MIA', 'san francisco': 'SFO', 'boston': 'BOS',
  'seattle': 'SEA', 'denver': 'DEN', 'dallas': 'DFW',
  'atlanta': 'ATL', 'houston': 'HOU', 'phoenix': 'PHX',
  'las vegas': 'LAS', 'nashville': 'BNA', 'austin': 'AUS',
  'portland': 'PDX', 'san diego': 'SAN', 'philadelphia': 'PHL',
  'washington': 'DCA', 'minneapolis': 'MSP', 'detroit': 'DTW',
  'brooklyn': 'NYC', 'inglewood': 'LAX', 'santa clara': 'SJC',
  'arlington': 'DFW', 'east rutherford': 'EWR', 'miami gardens': 'MIA',
  'kansas city': 'MCI', 'green bay': 'GRB', 'milwaukee': 'MKE',
  'pittsburgh': 'PIT', 'fort lauderdale': 'FLL', 'carson': 'LAX',
}

function getCityCode(city: string): string {
  return CITY_CODES[city.toLowerCase()] || city.slice(0, 3).toUpperCase()
}

// =============================================================================
// Address data
// =============================================================================

const STREET_NAMES = [
  'Broadway', 'Main St', 'Market St', 'Park Ave', 'Ocean Blvd',
  '5th Ave', 'Michigan Ave', 'Peachtree St', 'Sunset Blvd', 'State St',
  'Lexington Ave', 'Union Square', 'Convention Center Dr',
]

// =============================================================================
// Helpers
// =============================================================================

function calculateNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn + 'T00:00:00')
  const d2 = new Date(checkOut + 'T00:00:00')
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)))
}

// =============================================================================
// Generator
// =============================================================================

export function generateMockHotels(params: HotelSearchParams): HotelSearchResult {
  const seed = simpleHash(params.city + params.checkIn + params.checkOut)
  const nights = calculateNights(params.checkIn, params.checkOut)
  const cityCode = getCityCode(params.city)
  const guests = params.adults || 2

  const offers: HotelOffer[] = []

  for (let i = 0; i < 12; i++) {
    const r = (idx: number) => seeded(seed, i * 100 + idx)
    const template = HOTEL_TEMPLATES[i % HOTEL_TEMPLATES.length]
    const stars = template.stars

    // Price
    const [minPrice, maxPrice] = STAR_PRICE_RANGE[stars]
    const pricePerNight = Math.round(minPrice + r(0) * (maxPrice - minPrice))
    const totalPrice = pricePerNight * nights

    // Distance: 5-star closer, 3-star wider range
    const distBase = stars === 5 ? 0.2 : stars === 4 ? 0.5 : 1.0
    const distRange = stars === 5 ? 2.8 : stars === 4 ? 4.5 : 7.0
    const distance = Math.round((distBase + r(1) * distRange) * 10) / 10

    // Bed type and room type
    const bedTypes = BED_TYPES_BY_STAR[stars]
    const roomTypes = ROOM_TYPES_BY_STAR[stars]
    const bedType = bedTypes[Math.floor(r(2) * bedTypes.length)]
    const roomType = roomTypes[Math.floor(r(3) * roomTypes.length)]

    // Amenities: base + star-specific subset
    const starAmenities = STAR_AMENITIES[stars]
    const amenityCount = Math.min(starAmenities.length, 2 + Math.floor(r(4) * (starAmenities.length - 1)))
    const amenities = [...BASE_AMENITIES, ...starAmenities.slice(0, amenityCount)]

    // Address
    const streetName = STREET_NAMES[Math.floor(r(5) * STREET_NAMES.length)]
    const streetNum = 100 + Math.floor(r(6) * 900)

    // Room description
    const roomDescriptions: Record<string, string> = {
      STANDARD: 'Standard room with city view',
      SUPERIOR: 'Superior room with premium amenities',
      DELUXE: 'Deluxe room with panoramic views',
      SUITE: 'Spacious suite with separate living area',
    }

    // Cancellation policy
    const cancellation = stars >= 4
      ? 'Free cancellation until 24 hours before check-in'
      : r(7) > 0.5 ? 'Free cancellation until 48 hours before check-in' : 'Non-refundable'

    offers.push({
      id: `mock_hotel_${seed}_${i}`,
      hotel_id: `mock_htl_${seed}_${i}`,
      hotel_name: `${template.prefix} ${params.city}`,
      hotel_rating: stars,
      city_code: cityCode,
      address: `${streetNum} ${streetName}`,
      distance_km: distance,
      room_type: roomType,
      room_description: roomDescriptions[roomType] || 'Comfortable room',
      bed_type: bedType,
      guests,
      price: totalPrice,
      currency: 'USD',
      price_per_night: pricePerNight,
      check_in: params.checkIn,
      check_out: params.checkOut,
      nights,
      amenities,
      cancellation_policy: cancellation,
      payment_type: r(8) > 0.3 ? 'CREDIT_CARD' : 'PAY_AT_PROPERTY',
    })
  }

  // Apply filters
  let filtered = offers
  if (params.minRating) {
    filtered = filtered.filter(o => (o.hotel_rating ?? 0) >= params.minRating!)
  }
  if (params.maxPrice) {
    filtered = filtered.filter(o => o.price <= params.maxPrice!)
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

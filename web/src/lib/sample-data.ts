import type {
  Event,
  Plan,
  FlightOption,
  HotelOption,
  TransportSegment,
  ConstraintFlag,
  CostEstimate,
} from "./types"

// =============================================================================
// Sample Events (12)
// =============================================================================

export const sampleEvents: Event[] = [
  // ---- Sports: NBA ----
  {
    id: "evt-lakers-celtics",
    name: "Los Angeles Lakers vs Boston Celtics",
    date: "2026-02-14",
    startTime: "19:30",
    doorsTime: "18:00",
    endTimeEstimate: "22:00",
    timezone: "America/Los_Angeles",
    venue: {
      name: "Crypto.com Arena",
      address: "1111 S Figueroa St",
      city: "Los Angeles",
      state: "CA",
      country: "US",
      coordinates: { lat: 34.043, lng: -118.2673 },
    },
    category: "sports",
  },
  // ---- Sports: MLS ----
  {
    id: "evt-lafc-inter-miami",
    name: "LAFC vs Inter Miami CF",
    date: "2026-03-07",
    startTime: "19:30",
    doorsTime: "18:00",
    endTimeEstimate: "21:30",
    timezone: "America/Los_Angeles",
    venue: {
      name: "BMO Stadium",
      address: "3939 S Figueroa St",
      city: "Los Angeles",
      state: "CA",
      country: "US",
      coordinates: { lat: 34.0128, lng: -118.2841 },
    },
    category: "sports",
  },
  // ---- Sports: NFL ----
  {
    id: "evt-chiefs-bills",
    name: "Kansas City Chiefs vs Buffalo Bills",
    date: "2026-01-18",
    startTime: "18:30",
    doorsTime: "16:00",
    endTimeEstimate: "22:00",
    timezone: "America/Chicago",
    venue: {
      name: "GEHA Field at Arrowhead Stadium",
      address: "1 Arrowhead Dr",
      city: "Kansas City",
      state: "MO",
      country: "US",
      coordinates: { lat: 39.0489, lng: -94.4839 },
    },
    category: "sports",
  },
  // ---- Sports: NHL ----
  {
    id: "evt-rangers-bruins",
    name: "New York Rangers vs Boston Bruins",
    date: "2026-02-21",
    startTime: "19:00",
    doorsTime: "17:30",
    endTimeEstimate: "21:30",
    timezone: "America/New_York",
    venue: {
      name: "Madison Square Garden",
      address: "4 Pennsylvania Plaza",
      city: "New York",
      state: "NY",
      country: "US",
      coordinates: { lat: 40.7505, lng: -73.9934 },
    },
    category: "sports",
  },
  // ---- Music: Arena Concert ----
  {
    id: "evt-kendrick-lamar",
    name: "Kendrick Lamar - Grand National Tour",
    date: "2026-04-11",
    startTime: "20:00",
    doorsTime: "18:30",
    endTimeEstimate: "23:00",
    timezone: "America/New_York",
    venue: {
      name: "Barclays Center",
      address: "620 Atlantic Ave",
      city: "Brooklyn",
      state: "NY",
      country: "US",
      coordinates: { lat: 40.6826, lng: -73.9754 },
    },
    category: "music",
  },
  // ---- Music: Festival ----
  {
    id: "evt-coachella",
    name: "Coachella Valley Music and Arts Festival",
    date: "2026-04-10",
    startTime: "12:00",
    doorsTime: "11:00",
    endTimeEstimate: "01:00",
    timezone: "America/Los_Angeles",
    venue: {
      name: "Empire Polo Club",
      address: "81-800 Avenue 51",
      city: "Indio",
      state: "CA",
      country: "US",
      coordinates: { lat: 33.6803, lng: -116.2378 },
    },
    category: "festival",
  },
  // ---- Music: Small Venue ----
  {
    id: "evt-japanese-breakfast",
    name: "Japanese Breakfast",
    date: "2026-03-20",
    startTime: "20:00",
    doorsTime: "19:00",
    endTimeEstimate: "22:30",
    timezone: "America/Chicago",
    venue: {
      name: "Thalia Hall",
      address: "1807 S Allport St",
      city: "Chicago",
      state: "IL",
      country: "US",
      coordinates: { lat: 41.8577, lng: -87.6574 },
    },
    category: "music",
  },
  // ---- Music: Tour Stop ----
  {
    id: "evt-sza-tour",
    name: "SZA - Lana World Tour",
    date: "2026-05-16",
    startTime: "20:00",
    doorsTime: "18:30",
    endTimeEstimate: "23:00",
    timezone: "America/Denver",
    venue: {
      name: "Ball Arena",
      address: "1000 Chopper Cir",
      city: "Denver",
      state: "CO",
      country: "US",
      coordinates: { lat: 39.7487, lng: -105.0077 },
    },
    category: "music",
  },
  // ---- Theater: Broadway ----
  {
    id: "evt-hamilton-broadway",
    name: "Hamilton",
    date: "2026-03-14",
    startTime: "19:00",
    doorsTime: "18:30",
    endTimeEstimate: "21:45",
    timezone: "America/New_York",
    venue: {
      name: "Richard Rodgers Theatre",
      address: "226 W 46th St",
      city: "New York",
      state: "NY",
      country: "US",
      coordinates: { lat: 40.7591, lng: -73.9868 },
    },
    category: "theater",
  },
  // ---- Theater: Touring Production ----
  {
    id: "evt-wicked-tour",
    name: "Wicked - National Tour",
    date: "2026-04-25",
    startTime: "19:30",
    doorsTime: "19:00",
    endTimeEstimate: "22:15",
    timezone: "America/Chicago",
    venue: {
      name: "Cadillac Palace Theatre",
      address: "151 W Randolph St",
      city: "Chicago",
      state: "IL",
      country: "US",
      coordinates: { lat: 41.8847, lng: -87.6324 },
    },
    category: "theater",
  },
  // ---- Festival: Multi-Day ----
  {
    id: "evt-sxsw",
    name: "SXSW Music Festival",
    date: "2026-03-13",
    startTime: "11:00",
    doorsTime: "10:00",
    endTimeEstimate: "02:00",
    timezone: "America/Chicago",
    venue: {
      name: "Austin Convention Center",
      address: "500 E Cesar Chavez St",
      city: "Austin",
      state: "TX",
      country: "US",
      coordinates: { lat: 30.2636, lng: -97.7394 },
    },
    category: "festival",
  },
  // ---- Film: Premiere ----
  {
    id: "evt-film-premiere",
    name: "Dune: Part Three - World Premiere",
    date: "2026-06-12",
    startTime: "19:00",
    doorsTime: "17:30",
    endTimeEstimate: "22:00",
    timezone: "America/Los_Angeles",
    venue: {
      name: "TCL Chinese Theatre",
      address: "6925 Hollywood Blvd",
      city: "Los Angeles",
      state: "CA",
      country: "US",
      coordinates: { lat: 34.1022, lng: -118.3409 },
    },
    category: "film",
  },
]

// =============================================================================
// Full Sample Plan: Lakers vs Celtics, Feb 14 2026 — Origin: Chicago (ORD)
// =============================================================================

const outboundFlights: FlightOption[] = [
  {
    id: "fl-out-1",
    airline: "United Airlines",
    flightNumber: "UA 1423",
    departure: {
      airport: "ORD",
      time: "2026-02-14T08:15:00-06:00",
      city: "Chicago",
    },
    arrival: {
      airport: "LAX",
      time: "2026-02-14T10:45:00-08:00",
      city: "Los Angeles",
    },
    stops: 0,
    duration: "4h 30m",
    price: 289,
    timingTag: {
      label: "comfortable",
      severity: "comfortable",
      minutesBuffer: 525,
    },
  },
  {
    id: "fl-out-2",
    airline: "American Airlines",
    flightNumber: "AA 2087",
    departure: {
      airport: "ORD",
      time: "2026-02-14T06:00:00-06:00",
      city: "Chicago",
    },
    arrival: {
      airport: "LAX",
      time: "2026-02-14T10:10:00-08:00",
      city: "Los Angeles",
    },
    stops: 1,
    stopCities: ["Dallas (DFW)"],
    duration: "6h 10m",
    price: 189,
    timingTag: {
      label: "comfortable",
      severity: "comfortable",
      minutesBuffer: 560,
    },
  },
  {
    id: "fl-out-3",
    airline: "Spirit Airlines",
    flightNumber: "NK 684",
    departure: {
      airport: "ORD",
      time: "2026-02-14T11:30:00-06:00",
      city: "Chicago",
    },
    arrival: {
      airport: "LAX",
      time: "2026-02-14T14:05:00-08:00",
      city: "Los Angeles",
    },
    stops: 0,
    duration: "4h 35m",
    price: 159,
    timingTag: {
      label: "tight",
      severity: "tight",
      minutesBuffer: 325,
    },
  },
  {
    id: "fl-out-4",
    airline: "Frontier Airlines",
    flightNumber: "F9 1192",
    departure: {
      airport: "ORD",
      time: "2026-02-14T13:45:00-06:00",
      city: "Chicago",
    },
    arrival: {
      airport: "LAX",
      time: "2026-02-14T16:55:00-08:00",
      city: "Los Angeles",
    },
    stops: 1,
    stopCities: ["Denver (DEN)"],
    duration: "5h 10m",
    price: 139,
    timingTag: {
      label: "risky",
      severity: "risky",
      minutesBuffer: 155,
    },
  },
]

const returnFlights: FlightOption[] = [
  {
    id: "fl-ret-1",
    airline: "United Airlines",
    flightNumber: "UA 538",
    departure: {
      airport: "LAX",
      time: "2026-02-15T14:20:00-08:00",
      city: "Los Angeles",
    },
    arrival: {
      airport: "ORD",
      time: "2026-02-15T20:15:00-06:00",
      city: "Chicago",
    },
    stops: 0,
    duration: "3h 55m",
    price: 199,
    timingTag: {
      label: "comfortable",
      severity: "comfortable",
      minutesBuffer: 0,
    },
  },
  {
    id: "fl-ret-2",
    airline: "American Airlines",
    flightNumber: "AA 340",
    departure: {
      airport: "LAX",
      time: "2026-02-15T23:55:00-08:00",
      city: "Los Angeles",
    },
    arrival: {
      airport: "ORD",
      time: "2026-02-16T05:50:00-06:00",
      city: "Chicago",
    },
    stops: 0,
    duration: "3h 55m",
    price: 149,
    timingTag: {
      label: "feasible red-eye",
      severity: "tight",
      minutesBuffer: 0,
    },
  },
  {
    id: "fl-ret-3",
    airline: "Spirit Airlines",
    flightNumber: "NK 721",
    departure: {
      airport: "LAX",
      time: "2026-02-15T06:00:00-08:00",
      city: "Los Angeles",
    },
    arrival: {
      airport: "ORD",
      time: "2026-02-15T12:05:00-06:00",
      city: "Chicago",
    },
    stops: 0,
    duration: "4h 05m",
    price: 129,
    timingTag: {
      label: "too early / dangerous",
      severity: "risky",
      minutesBuffer: 0,
    },
  },
]

const hotels: HotelOption[] = [
  {
    id: "htl-1",
    name: "JW Marriott Los Angeles L.A. LIVE",
    pricePerNight: 279,
    totalPrice: 279,
    nights: 1,
    rating: 4.6,
    distanceToVenue: { miles: 0.3, transitMinutes: 6, mode: "walk" },
    checkIn: "2026-02-14",
    checkOut: "2026-02-15",
    cluster: "near-venue",
  },
  {
    id: "htl-2",
    name: "The Ritz-Carlton, Los Angeles",
    pricePerNight: 349,
    totalPrice: 349,
    nights: 1,
    rating: 4.8,
    distanceToVenue: { miles: 0.8, transitMinutes: 5, mode: "drive" },
    checkIn: "2026-02-14",
    checkOut: "2026-02-15",
    cluster: "near-venue",
  },
  {
    id: "htl-3",
    name: "Courtyard by Marriott LA LIVE",
    pricePerNight: 199,
    totalPrice: 199,
    nights: 1,
    rating: 4.3,
    distanceToVenue: { miles: 1.5, transitMinutes: 8, mode: "drive" },
    checkIn: "2026-02-14",
    checkOut: "2026-02-15",
    cluster: "near-venue",
  },
  {
    id: "htl-4",
    name: "Holiday Inn Express Los Angeles",
    pricePerNight: 129,
    totalPrice: 129,
    nights: 1,
    rating: 3.9,
    distanceToVenue: { miles: 4.0, transitMinutes: 15, mode: "drive" },
    checkIn: "2026-02-14",
    checkOut: "2026-02-15",
    cluster: "value",
  },
  {
    id: "htl-5",
    name: "Comfort Inn & Suites LAX Airport",
    pricePerNight: 99,
    totalPrice: 99,
    nights: 1,
    rating: 3.5,
    distanceToVenue: { miles: 7.0, transitMinutes: 28, mode: "drive" },
    checkIn: "2026-02-14",
    checkOut: "2026-02-15",
    cluster: "value",
  },
]

const groundTransport: TransportSegment[] = [
  {
    label: "LAX to Hotel",
    distance: "18.2 mi",
    estimatedMinutes: 35,
    rideshareEstimate: 32,
    transitNote: "Metro C Line + transfer to Metro E Line. ~55 min.",
  },
  {
    label: "Hotel to Crypto.com Arena",
    distance: "0.3 mi",
    estimatedMinutes: 6,
    rideshareEstimate: 8,
    transitNote: "Walking distance from L.A. LIVE hotels.",
  },
  {
    label: "Crypto.com Arena to Hotel (post-game)",
    distance: "0.3 mi",
    estimatedMinutes: 10,
    rideshareEstimate: 12,
    lateNightNote:
      "Expect 2-3x rideshare surge pricing after events. Walking recommended for nearby hotels.",
  },
]

const costEstimate: CostEstimate = {
  min: 480,
  max: 720,
  breakdown: [
    { category: "Flights (round-trip)", min: 268, max: 488 },
    { category: "Hotel (1 night)", min: 99, max: 349 },
    { category: "Ground Transport", min: 52, max: 90 },
    { category: "Event Tickets (est.)", min: 110, max: 420 },
  ],
}

const constraintFlags: ConstraintFlag[] = [
  {
    id: "cf-1",
    type: "tight-arrival",
    severity: "danger",
    message:
      "Frontier F9 1192 lands at 4:55 PM with only a 2h 35m buffer before tip-off. Factor in baggage, ground transport, and arena entry.",
    targetType: "flight",
    targetId: "fl-out-4",
  },
  {
    id: "cf-2",
    type: "hotel-far",
    severity: "warning",
    message:
      "Comfort Inn & Suites is 7 mi from the arena. Post-game return will take 28+ min by car and surge pricing is likely.",
    targetType: "hotel",
    targetId: "htl-5",
  },
  {
    id: "cf-3",
    type: "checkout-conflict",
    severity: "info",
    message:
      "Standard checkout is 11 AM on Feb 15. If taking an afternoon return flight, request late checkout or store luggage.",
  },
  {
    id: "cf-4",
    type: "late-egress",
    severity: "info",
    message:
      "Post-game rideshare demand spikes 2-3x around Crypto.com Arena. Budget extra time and cost, or walk if hotel is within 1 mile.",
    targetType: "transport",
  },
]

export const samplePlan: Plan = {
  id: "plan-lakers-celtics-feb14",
  event: sampleEvents[0], // Lakers vs Celtics
  origin: {
    city: "Chicago",
    state: "IL",
    airportCode: "ORD",
  },
  travelDates: {
    arrive: "2026-02-14",
    depart: "2026-02-15",
  },
  flights: {
    outbound: outboundFlights,
    return: returnFlights,
  },
  hotels,
  groundTransport,
  costEstimate,
  constraintFlags,
  selections: {},
  status: "draft",
  createdAt: "2026-02-01T10:00:00Z",
  updatedAt: "2026-02-01T10:00:00Z",
}

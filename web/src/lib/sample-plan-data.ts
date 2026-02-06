import type { Plan, FlightTimingTag } from '@/types/plan'

// =============================================================================
// Sample Plan Data
// =============================================================================

export const SAMPLE_PLAN: Plan = {
  id: 'sample-plan-001',
  user_id: 'sample-user',
  title: 'Formula 1 Miami Grand Prix Trip',
  status: 'quoted',
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-15T14:30:00Z',

  // Event
  event: {
    id: 'evt-001',
    provider: 'ticketmaster',
    provider_id: 'tm-f1-miami-2024',
    name: 'Formula 1 Miami Grand Prix',
    date: '2024-05-05',
    time: '15:30:00',
    end_time: '17:30:00',
    venue_name: 'Miami International Autodrome',
    venue_address: '19801 NW 27th Ave, Miami Gardens, FL 33056',
    venue_city: 'Miami',
    venue_state: 'FL',
    venue_country: 'USA',
    venue_lat: 25.9581,
    venue_lng: -80.2389,
    segment: 'Sports',
    genre: 'Motorsports',
    price_estimate: 850,
    price_min: 450,
    price_max: 2500,
    purchase_url: 'https://www.ticketmaster.com/formula-1-miami',
    image_url: '/images/f1-miami.jpg',
  },

  // Origin
  origin: {
    city: 'Los Angeles',
    airport_code: 'LAX',
    airport_name: 'Los Angeles International Airport',
    lat: 33.9416,
    lng: -118.4085,
    timezone: 'America/Los_Angeles',
  },

  // Travel dates
  travel_dates: {
    outbound_date: '2024-05-04',
    return_date: '2024-05-06',
    nights: 2,
    is_flexible: false,
  },

  // Flight options with Seira Tags
  flight_options: [
    {
      id: 'flt-001',
      source: 'amadeus',
      price: 425,
      price_per_person: 425,
      currency: 'USD',
      
      // Outbound - Arrives Day Before (GREEN TAG)
      outbound_segments: [
        {
          departure_airport: 'LAX',
          departure_time: '2024-05-04T08:00:00',
          arrival_airport: 'MIA',
          arrival_time: '2024-05-04T16:15:00',
          carrier_code: 'AA',
          carrier_name: 'American Airlines',
          flight_number: 'AA2345',
          aircraft: 'Boeing 737-800',
          duration_minutes: 315,
          duration_formatted: '5h 15m',
        },
      ],
      outbound_duration_minutes: 315,
      outbound_duration_formatted: '5h 15m',
      outbound_stops: 0,
      outbound_timing_tags: ['arrives_day_before'],
      
      // Return
      return_segments: [
        {
          departure_airport: 'MIA',
          departure_time: '2024-05-06T20:00:00',
          arrival_airport: 'LAX',
          arrival_time: '2024-05-06T23:30:00',
          carrier_code: 'AA',
          carrier_name: 'American Airlines',
          flight_number: 'AA2346',
          aircraft: 'Boeing 737-800',
          duration_minutes: 330,
          duration_formatted: '5h 30m',
        },
      ],
      return_duration_minutes: 330,
      return_duration_formatted: '5h 30m',
      return_stops: 0,
      return_timing_tags: ['departs_same_night'],
      
      validating_carrier: 'AA',
      validating_carrier_name: 'American Airlines',
      cabin_class: 'economy',
      seats_available: 5,
      is_nonstop: true,
      booking_url: 'https://aa.com/booking',
      constraints: [],
      arrival_buffer_minutes: 1395, // ~23 hours before event
    },
    {
      id: 'flt-002',
      source: 'amadeus',
      price: 385,
      price_per_person: 385,
      currency: 'USD',
      
      // Outbound - Arrives Morning Of (AMBER TAG)
      outbound_segments: [
        {
          departure_airport: 'LAX',
          departure_time: '2024-05-05T06:00:00',
          arrival_airport: 'MIA',
          arrival_time: '2024-05-05T14:15:00',
          carrier_code: 'DL',
          carrier_name: 'Delta Air Lines',
          flight_number: 'DL1234',
          aircraft: 'Airbus A320',
          duration_minutes: 315,
          duration_formatted: '5h 15m',
        },
      ],
      outbound_duration_minutes: 315,
      outbound_duration_formatted: '5h 15m',
      outbound_stops: 0,
      outbound_timing_tags: ['arrives_morning_of'],
      
      // Return
      return_segments: [
        {
          departure_airport: 'MIA',
          departure_time: '2024-05-06T10:00:00',
          arrival_airport: 'LAX',
          arrival_time: '2024-05-06T13:30:00',
          carrier_code: 'DL',
          carrier_name: 'Delta Air Lines',
          flight_number: 'DL1235',
          aircraft: 'Airbus A320',
          duration_minutes: 330,
          duration_formatted: '5h 30m',
        },
      ],
      return_duration_minutes: 330,
      return_duration_formatted: '5h 30m',
      return_stops: 0,
      return_timing_tags: ['departs_next_morning'],
      
      validating_carrier: 'DL',
      validating_carrier_name: 'Delta Air Lines',
      cabin_class: 'economy',
      seats_available: 3,
      is_nonstop: true,
      booking_url: 'https://delta.com/booking',
      constraints: [],
      arrival_buffer_minutes: 75, // ~1.25 hours before event
    },
    {
      id: 'flt-003',
      source: 'amadeus',
      price: 310,
      price_per_person: 310,
      currency: 'USD',
      
      // Outbound - Arrives Tight (RED TAG)
      outbound_segments: [
        {
          departure_airport: 'LAX',
          departure_time: '2024-05-05T10:00:00',
          arrival_airport: 'ATL',
          arrival_time: '2024-05-05T17:45:00',
          carrier_code: 'NK',
          carrier_name: 'Spirit Airlines',
          flight_number: 'NK5678',
          aircraft: 'Airbus A320',
          duration_minutes: 285,
          duration_formatted: '4h 45m',
        },
        {
          departure_airport: 'ATL',
          departure_time: '2024-05-05T18:30:00',
          arrival_airport: 'MIA',
          arrival_time: '2024-05-05T20:45:00',
          carrier_code: 'NK',
          carrier_name: 'Spirit Airlines',
          flight_number: 'NK5679',
          aircraft: 'Airbus A320',
          duration_minutes: 135,
          duration_formatted: '2h 15m',
        },
      ],
      outbound_duration_minutes: 645,
      outbound_duration_formatted: '10h 45m',
      outbound_stops: 1,
      outbound_timing_tags: ['arrives_tight'],
      
      // Return
      return_segments: [
        {
          departure_airport: 'MIA',
          departure_time: '2024-05-06T22:00:00',
          arrival_airport: 'LAX',
          arrival_time: '2024-05-07T01:30:00',
          carrier_code: 'NK',
          carrier_name: 'Spirit Airlines',
          flight_number: 'NK5680',
          aircraft: 'Airbus A320',
          duration_minutes: 330,
          duration_formatted: '5h 30m',
        },
      ],
      return_duration_minutes: 330,
      return_duration_formatted: '5h 30m',
      return_stops: 0,
      return_timing_tags: ['departs_same_night'],
      
      validating_carrier: 'NK',
      validating_carrier_name: 'Spirit Airlines',
      cabin_class: 'economy',
      seats_available: 8,
      is_nonstop: false,
      booking_url: 'https://spirit.com/booking',
      constraints: ['tight_arrival', 'long_layover'],
      arrival_buffer_minutes: -285, // Negative = cutting it close!
    },
  ],

  // Hotel options
  hotel_options: [
    {
      id: 'htl-001',
      source: 'amadeus',
      hotel_id: 'mia-htl-001',
      name: 'Four Seasons Miami',
      chain: 'Four Seasons',
      star_rating: 5,
      address: '1435 Brickell Ave',
      city: 'Miami',
      lat: 25.7617,
      lng: -80.1918,
      venue_distance_km: 2.3,
      venue_distance_formatted: '2.3 km',
      venue_distance_tag: 'walkable',
      room_type: 'DELUXE',
      room_description: 'Deluxe room with bay view',
      bed_type: 'KING',
      guests: 2,
      price: 950,
      price_per_night: 475,
      currency: 'USD',
      check_in: '2024-05-04',
      check_out: '2024-05-06',
      nights: 2,
      amenities: ['Free WiFi', 'Pool', 'Spa', 'Fitness Center', 'Restaurant', 'Bar'],
      cancellation_policy: 'Free cancellation until 24 hours before check-in',
      cancellation_deadline: '2024-05-03T16:00:00Z',
      is_refundable: true,
      booking_url: 'https://fourseasons.com/miami',
      image_url: '/images/four-seasons-miami.jpg',
      constraints: [],
    },
    {
      id: 'htl-002',
      source: 'amadeus',
      hotel_id: 'mia-htl-002',
      name: 'Courtyard by Marriott Miami Airport',
      chain: 'Marriott',
      star_rating: 3,
      address: '1201 NW Le Jeune Rd',
      city: 'Miami',
      lat: 25.7959,
      lng: -80.2870,
      venue_distance_km: 8.5,
      venue_distance_formatted: '8.5 km',
      venue_distance_tag: 'moderate',
      room_type: 'STANDARD',
      room_description: 'Standard room with city view',
      bed_type: 'QUEEN',
      guests: 2,
      price: 380,
      price_per_night: 190,
      currency: 'USD',
      check_in: '2024-05-04',
      check_out: '2024-05-06',
      nights: 2,
      amenities: ['Free WiFi', 'Free Parking', 'Fitness Center', 'Breakfast Included'],
      cancellation_policy: 'Free cancellation until 48 hours before check-in',
      cancellation_deadline: '2024-05-02T16:00:00Z',
      is_refundable: true,
      booking_url: 'https://marriott.com/booking',
      image_url: '/images/courtyard-miami.jpg',
      constraints: [],
    },
  ],

  // User selections
  selections: {
    flight: null,
    hotel: null,
    ground_transport: 'rideshare',
    flight_selected_at: null,
    hotel_selected_at: null,
    transport_selected_at: null,
  },

  // Ground transport
  ground_transport: {
    legs: [
      {
        type: 'airport_to_hotel',
        mode: 'rideshare',
        distance_km: 12.5,
        duration_minutes: 25,
        price_estimate: 35,
        price_range: { min: 28, max: 45 },
        notes: 'Uber/Lyft available at MIA',
      },
      {
        type: 'hotel_to_venue',
        mode: 'rideshare',
        distance_km: 2.3,
        duration_minutes: 10,
        price_estimate: 15,
        price_range: { min: 12, max: 20 },
        notes: 'Quick ride to the track',
      },
      {
        type: 'venue_to_hotel',
        mode: 'rideshare',
        distance_km: 2.3,
        duration_minutes: 15,
        price_estimate: 18,
        price_range: { min: 15, max: 25 },
        notes: 'Surge pricing likely post-event',
      },
      {
        type: 'hotel_to_airport',
        mode: 'rideshare',
        distance_km: 12.5,
        duration_minutes: 25,
        price_estimate: 35,
        price_range: { min: 28, max: 45 },
        notes: 'Uber/Lyft to MIA',
      },
    ],
    total_estimate: 103,
    total_range: { min: 83, max: 135 },
    recommended_mode: 'rideshare',
  },

  // Cost range
  cost_range: {
    event_low: 450,
    event_high: 2500,
    flight_low: 310,
    flight_high: 425,
    hotel_low: 380,
    hotel_high: 950,
    transport_low: 83,
    transport_high: 135,
    total_low: 1223,
    total_high: 4010,
    event_selected: 850,
    flight_selected: null,
    hotel_selected: null,
    transport_selected: 103,
    total_selected: null,
    currency: 'USD',
    travelers: 1,
    total_per_person_low: 1223,
    total_per_person_high: 4010,
  },

  // Constraints
  constraints: [],

  // Sharing
  sharing: {
    is_shared: false,
    share_token: null,
    share_url: null,
    shared_by_name: null,
    shared_at: null,
  },

  // Notes
  notes: 'First F1 race! Remember to bring earplugs and sunscreen.',

  // Timestamps
  quoted_at: '2024-03-15T14:30:00Z',
  quote_expires_at: '2024-03-22T14:30:00Z',
  booked_at: null,
}

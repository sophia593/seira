/**
 * Shared Flight types used across chat results and trip details
 */

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
  duration: string
  stops?: number
  stopDetails?: FlightStop[]
  aircraft?: string
  cabin_class?: string
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

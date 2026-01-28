'use client'

import { useState, useCallback } from 'react'
import { getApi } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

export interface FlightSegment {
  departure_airport: string
  departure_time: string
  arrival_airport: string
  arrival_time: string
  carrier_code: string
  carrier_name: string | null
  flight_number: string
  aircraft: string | null
  duration: string
  duration_formatted: string
  stops: number
}

export interface FlightOffer {
  id: string
  source: string

  // Price
  price: number
  currency: string
  price_per_adult: number | null

  // Outbound
  outbound_segments: FlightSegment[]
  outbound_duration: string
  outbound_duration_formatted: string
  outbound_stops: number

  // Return (optional)
  return_segments: FlightSegment[] | null
  return_duration: string | null
  return_duration_formatted: string | null
  return_stops: number | null

  // Booking info
  validating_carrier: string
  validating_carrier_name: string | null
  booking_class: string | null
  seats_available: number | null

  // Convenience
  is_round_trip: boolean
  is_nonstop: boolean
}

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  maxOffers?: number
  nonstopOnly?: boolean
}

export interface FlightSearchResult {
  offers: FlightOffer[]
  searchParams: Record<string, unknown>
  totalCount: number
}

export interface UseFlightSearchReturn {
  search: (params: FlightSearchParams) => Promise<FlightSearchResult | null>
  results: FlightSearchResult | null
  isLoading: boolean
  error: string | null
  clear: () => void
}

// =============================================================================
// Hook
// =============================================================================

export function useFlightSearch(): UseFlightSearchReturn {
  const [results, setResults] = useState<FlightSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (params: FlightSearchParams): Promise<FlightSearchResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const api = getApi()

      // Build query string
      const queryParams = new URLSearchParams()
      queryParams.set('origin', params.origin)
      queryParams.set('destination', params.destination)
      queryParams.set('departure_date', params.departureDate)

      if (params.returnDate) queryParams.set('return_date', params.returnDate)
      if (params.adults !== undefined) queryParams.set('adults', params.adults.toString())
      if (params.cabinClass) queryParams.set('cabin_class', params.cabinClass)
      if (params.maxOffers !== undefined) queryParams.set('max_offers', params.maxOffers.toString())
      if (params.nonstopOnly) queryParams.set('nonstop_only', 'true')

      const response = await api.get<{
        offers: FlightOffer[]
        search_params: Record<string, unknown>
        total_count: number
      }>(`/api/v1/flights/search?${queryParams.toString()}`)

      const result: FlightSearchResult = {
        offers: response.offers,
        searchParams: response.search_params,
        totalCount: response.total_count,
      }

      setResults(result)
      return result

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Flight search failed'
      setError(message)
      return null

    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults(null)
    setError(null)
  }, [])

  return {
    search,
    results,
    isLoading,
    error,
    clear,
  }
}

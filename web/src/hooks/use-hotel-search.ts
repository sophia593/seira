'use client'

import { useState, useCallback } from 'react'
import { getApi } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

export interface HotelOffer {
  id: string
  hotel_id: string
  hotel_name: string
  hotel_rating: number | null

  // Location
  city_code: string
  address: string | null
  distance_km: number | null

  // Room
  room_type: string | null
  room_description: string | null
  bed_type: string | null
  guests: number

  // Price
  price: number
  currency: string
  price_per_night: number | null

  // Dates
  check_in: string
  check_out: string
  nights: number

  // Amenities
  amenities: string[]

  // Policies
  cancellation_policy: string | null
  payment_type: string | null
}

export interface HotelSearchParams {
  city: string
  checkIn: string
  checkOut: string
  adults?: number
  rooms?: number
  minRating?: number
  maxPrice?: number
  maxOffers?: number
}

export interface HotelSearchResult {
  offers: HotelOffer[]
  searchParams: Record<string, unknown>
  totalCount: number
}

export interface UseHotelSearchReturn {
  search: (params: HotelSearchParams) => Promise<HotelSearchResult | null>
  results: HotelSearchResult | null
  isLoading: boolean
  error: string | null
  clear: () => void
}

// =============================================================================
// Hook
// =============================================================================

export function useHotelSearch(): UseHotelSearchReturn {
  const [results, setResults] = useState<HotelSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (params: HotelSearchParams): Promise<HotelSearchResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const api = getApi()

      // Build query string
      const queryParams = new URLSearchParams()
      queryParams.set('city', params.city)
      queryParams.set('check_in', params.checkIn)
      queryParams.set('check_out', params.checkOut)

      if (params.adults !== undefined) queryParams.set('adults', params.adults.toString())
      if (params.rooms !== undefined) queryParams.set('rooms', params.rooms.toString())
      if (params.minRating !== undefined) queryParams.set('min_rating', params.minRating.toString())
      if (params.maxPrice !== undefined) queryParams.set('max_price', params.maxPrice.toString())
      if (params.maxOffers !== undefined) queryParams.set('max_offers', params.maxOffers.toString())

      const response = await api.get<{
        offers: HotelOffer[]
        search_params: Record<string, unknown>
        total_count: number
      }>(`/api/v1/hotels/search?${queryParams.toString()}`)

      const result: HotelSearchResult = {
        offers: response.offers,
        searchParams: response.search_params,
        totalCount: response.total_count,
      }

      setResults(result)
      return result

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hotel search failed'
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

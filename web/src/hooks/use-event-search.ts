'use client'

import { useState, useCallback } from 'react'
import { getApi } from '@/lib/api'
import { filterMockEvents } from '@/lib/mock-events'

// =============================================================================
// Types
// =============================================================================

export interface Venue {
  name: string
  city: string | null
  state: string | null
  address: string | null
}

export interface PriceRange {
  min: number | null
  max: number | null
  currency: string
}

export interface EventResult {
  id: string
  name: string
  date: string
  time: string | null
  venue: Venue | null
  image_url: string | null
  price_range: PriceRange | null
  purchase_url: string
  genre: string | null
  segment: string | null
  status: string | null
  provider: string
  provider_id: string
}

export interface EventSearchParams {
  q?: string
  city?: string
  state?: string
  dateFrom?: string
  dateTo?: string
  genre?: string      // e.g., "Basketball", "Football", "Rock"
  segment?: string    // e.g., "Sports", "Music", "Arts & Theatre"
  page?: number
  size?: number
}

export interface EventSearchResult {
  events: EventResult[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UseEventSearchReturn {
  search: (params: EventSearchParams) => Promise<EventSearchResult | null>
  results: EventSearchResult | null
  isLoading: boolean
  error: string | null
  clear: () => void
}

// =============================================================================
// Hook
// =============================================================================

export function useEventSearch(): UseEventSearchReturn {
  const [results, setResults] = useState<EventSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (params: EventSearchParams): Promise<EventSearchResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const api = getApi()

      // Build query string
      const queryParams = new URLSearchParams()
      if (params.q) queryParams.set('q', params.q)
      if (params.city) queryParams.set('city', params.city)
      if (params.state) queryParams.set('state', params.state)
      if (params.dateFrom) queryParams.set('date_from', params.dateFrom)
      if (params.dateTo) queryParams.set('date_to', params.dateTo)
      if (params.genre) queryParams.set('genre', params.genre)
      if (params.segment) queryParams.set('segment', params.segment)
      if (params.page !== undefined) queryParams.set('page', params.page.toString())
      if (params.size !== undefined) queryParams.set('size', params.size.toString())

      const response = await api.get<{
        events: EventResult[]
        total_count: number
        page: number
        page_size: number
        total_pages: number
      }>(`/api/v1/events/search?${queryParams.toString()}`)

      const result: EventSearchResult = {
        events: response.events,
        totalCount: response.total_count,
        page: response.page,
        pageSize: response.page_size,
        totalPages: response.total_pages,
      }

      setResults(result)
      return result

    } catch {
      // Fall back to mock data when API is unavailable
      const fallback = filterMockEvents(params)
      setResults(fallback)
      return fallback

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

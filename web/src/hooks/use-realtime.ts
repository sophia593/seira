import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ============================================================
// Types — adjust these to match your generated Supabase types
// ============================================================

interface CallSheet {
  id: string
  production_id: string
  shoot_day_id: string
  status: string
  general_call_time: string | null
  location_id: string | null
  lunch_time: string | null
  second_meal_time: string | null
  weather_summary: string | null
  weather_temp_high: number | null
  weather_temp_low: number | null
  sunrise: string | null
  sunset: string | null
  nearest_hospital_name: string | null
  nearest_hospital_address: string | null
  parking_notes: string | null
  catering_notes: string | null
  special_instructions: string | null
  published_at: string | null
  updated_at: string
}

interface CallSheetScene {
  id: string
  call_sheet_id: string
  scene_id: string | null
  scene_number_override: string | null
  description_override: string | null
  location_name: string | null
  estimated_duration_min: number | null
  sort_order: number
  notes: string | null
}

interface CrewCall {
  id: string
  call_sheet_id: string
  member_id: string
  call_time: string
  notes: string | null
  sort_order: number
  viewed_at: string | null
  confirmed_at: string | null
}

interface ActivityLogEntry {
  id: string
  production_id: string
  call_sheet_id: string | null
  actor_id: string
  action: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  summary: string | null
  is_urgent: boolean
  notify_crew: boolean
  created_at: string
}


// ============================================================
// useRealtimeCallSheet
//
// Subscribes to a call sheet and everything on it:
// the call sheet itself, its scenes, and its crew calls.
//
// Returns live data that updates automatically when anything changes.
// ============================================================

interface RealtimeCallSheetData {
  callSheet: CallSheet | null
  scenes: CallSheetScene[]
  crewCalls: CrewCall[]
  isLoading: boolean
  error: string | null
}

export function useRealtimeCallSheet(callSheetId: string | null): RealtimeCallSheetData {
  const [callSheet, setCallSheet] = useState<CallSheet | null>(null)
  const [scenes, setScenes] = useState<CallSheetScene[]>([])
  const [crewCalls, setCrewCalls] = useState<CrewCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!callSheetId) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const [sheetResult, scenesResult, crewResult] = await Promise.all([
        supabase
          .from('call_sheets')
          .select('*')
          .eq('id', callSheetId)
          .single(),
        supabase
          .from('call_sheet_scenes')
          .select('*')
          .eq('call_sheet_id', callSheetId)
          .order('sort_order'),
        supabase
          .from('call_sheet_crew_calls')
          .select('*')
          .eq('call_sheet_id', callSheetId)
          .order('sort_order'),
      ])

      if (sheetResult.error) throw sheetResult.error
      if (scenesResult.error) throw scenesResult.error
      if (crewResult.error) throw crewResult.error

      setCallSheet(sheetResult.data)
      setScenes(scenesResult.data)
      setCrewCalls(crewResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load call sheet')
    } finally {
      setIsLoading(false)
    }
  }, [callSheetId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!callSheetId) return

    const supabase = createClient()
    let channel: RealtimeChannel

    channel = supabase
      .channel(`call-sheet-${callSheetId}`)

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sheets',
          filter: `id=eq.${callSheetId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCallSheet(payload.new as CallSheet)
          } else if (payload.eventType === 'DELETE') {
            setCallSheet(null)
          }
        }
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sheet_scenes',
          filter: `call_sheet_id=eq.${callSheetId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setScenes((prev) =>
              [...prev, payload.new as CallSheetScene].sort(
                (a, b) => a.sort_order - b.sort_order
              )
            )
          } else if (payload.eventType === 'UPDATE') {
            setScenes((prev) =>
              prev
                .map((s) => (s.id === payload.new.id ? (payload.new as CallSheetScene) : s))
                .sort((a, b) => a.sort_order - b.sort_order)
            )
          } else if (payload.eventType === 'DELETE') {
            setScenes((prev) => prev.filter((s) => s.id !== payload.old.id))
          }
        }
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sheet_crew_calls',
          filter: `call_sheet_id=eq.${callSheetId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCrewCalls((prev) =>
              [...prev, payload.new as CrewCall].sort(
                (a, b) => a.sort_order - b.sort_order
              )
            )
          } else if (payload.eventType === 'UPDATE') {
            setCrewCalls((prev) =>
              prev
                .map((c) => (c.id === payload.new.id ? (payload.new as CrewCall) : c))
                .sort((a, b) => a.sort_order - b.sort_order)
            )
          } else if (payload.eventType === 'DELETE') {
            setCrewCalls((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )

      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [callSheetId])

  return { callSheet, scenes, crewCalls, isLoading, error }
}


// ============================================================
// useRealtimeProduction
//
// Subscribes to the activity log for a production.
// Returns the latest activity entries as they happen.
// ============================================================

interface RealtimeProductionData {
  activities: ActivityLogEntry[]
  latestActivity: ActivityLogEntry | null
  isLoading: boolean
  error: string | null
}

export function useRealtimeProduction(
  productionId: string | null,
  limit: number = 20
): RealtimeProductionData {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!productionId) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('production_id', productionId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setIsLoading(false)
    }
  }, [productionId, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!productionId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`production-activity-${productionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `production_id=eq.${productionId}`,
        },
        (payload) => {
          const newEntry = payload.new as ActivityLogEntry
          setActivities((prev) => [newEntry, ...prev].slice(0, limit))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productionId, limit])

  return {
    activities,
    latestActivity: activities[0] ?? null,
    isLoading,
    error,
  }
}

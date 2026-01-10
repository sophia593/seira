"use client"

import { useEffect } from "react"
import { useUserStore } from "@/stores/user-store"
import { getApi } from "@/lib/api"
import { TooltipProvider } from "@/components/ui/tooltip"

interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
}

interface AppShellProviderProps {
  initialUser: User
  children: React.ReactNode
}

export function AppShellProvider({
  initialUser,
  children,
}: AppShellProviderProps) {
  const setUser = useUserStore((state) => state.setUser)
  const setPreferences = useUserStore((state) => state.setPreferences)
  const setLoading = useUserStore((state) => state.setLoading)
  const setHydrated = useUserStore((state) => state.setHydrated)

  // Hydrate store with initial user from server
  useEffect(() => {
    setUser(initialUser)
    setHydrated(true)

    // Fetch full user profile and preferences from API
    async function fetchUserData() {
      try {
        const api = getApi()
        const data = await api.getMe()
        setUser(data.user)
        setPreferences(data.preferences)
      } catch {
        // Silent fail - session user data is still valid, preferences are optional
        // The app continues to work, user just won't have saved preferences loaded
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [initialUser, setUser, setPreferences, setLoading, setHydrated])

  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
}

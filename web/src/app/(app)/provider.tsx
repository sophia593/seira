"use client"

import { useEffect, useState, useCallback, createContext, useContext } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUserStore } from "@/stores/user-store"
import { useNotificationStore } from "@/stores/notification-store"
import { createClient } from "@/lib/supabase/client"
import { TooltipProvider } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/sonner"

// =============================================================================
// Types
// =============================================================================

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

interface AppShellContextValue {
  // Connection
  isOnline: boolean

  // Viewport
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number

  // Idle
  isIdle: boolean
  lastActivity: Date

  // Session
  sessionExpiresAt: Date | null
}

// =============================================================================
// Context
// =============================================================================

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error("useAppShell must be used within AppShellProvider")
  }
  return context
}

// =============================================================================
// Constants
// =============================================================================

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000 // Check every 5 minutes
const SESSION_WARNING_THRESHOLD_MS = 30 * 60 * 1000 // Warn 30 min before expiry

const IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const IDLE_CHECK_INTERVAL_MS = 60 * 1000 // Check every minute

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

// =============================================================================
// Main Provider
// =============================================================================

export function AppShellProvider({
  initialUser,
  children,
}: AppShellProviderProps) {
  const router = useRouter()
  const pathname = usePathname()

  // User store
  const setUser = useUserStore((state) => state.setUser)
  const setLoading = useUserStore((state) => state.setLoading)
  const setHydrated = useUserStore((state) => state.setHydrated)

  // Notification store
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount)

  // Connection state
  const [isOnline, setIsOnline] = useState(true)

  // Viewport state
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  )
  const isMobile = screenWidth < MOBILE_BREAKPOINT
  const isTablet = screenWidth >= MOBILE_BREAKPOINT && screenWidth < TABLET_BREAKPOINT
  const isDesktop = screenWidth >= TABLET_BREAKPOINT

  // Idle state
  const [isIdle, setIsIdle] = useState(false)
  const [lastActivity, setLastActivity] = useState(new Date())

  // Session state
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null)

  // ===========================================================================
  // Hydrate user store
  // ===========================================================================

  useEffect(() => {
    setUser(initialUser)
    setHydrated(true)
    setLoading(false)
    setUnreadCount(0)

    // Set initial session expiry (24 hours from now)
    setSessionExpiresAt(new Date(Date.now() + SESSION_DURATION_MS))
  }, [initialUser, setUser, setLoading, setHydrated, setUnreadCount])

  // ===========================================================================
  // Online/Offline Detection
  // ===========================================================================

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      toast.success("you're back online")
    }

    function handleOffline() {
      setIsOnline(false)
      toast.error("you're offline — some features may not work")
    }

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // ===========================================================================
  // Viewport Detection
  // ===========================================================================

  useEffect(() => {
    function handleResize() {
      setScreenWidth(window.innerWidth)
    }

    setScreenWidth(window.innerWidth)

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // ===========================================================================
  // Idle Detection
  // ===========================================================================

  const resetActivity = useCallback(() => {
    setLastActivity(new Date())
    setIsIdle(false)
  }, [])

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"]

    function handleActivity() {
      resetActivity()
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    const idleInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity.getTime()
      if (timeSinceActivity >= IDLE_TIMEOUT_MS && !isIdle) {
        setIsIdle(true)
      }
    }, IDLE_CHECK_INTERVAL_MS)

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      clearInterval(idleInterval)
    }
  }, [lastActivity, isIdle, resetActivity])

  // ===========================================================================
  // Session Refresh (24 hour expiry)
  // ===========================================================================

  useEffect(() => {
    const supabase = createClient()

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          toast.error("your session has expired")
          router.push("/login")
          return
        }

        if (data.session.expires_at) {
          const expiresAt = new Date(data.session.expires_at * 1000)
          setSessionExpiresAt(expiresAt)

          const timeUntilExpiry = expiresAt.getTime() - Date.now()
          if (timeUntilExpiry < SESSION_WARNING_THRESHOLD_MS && timeUntilExpiry > 0) {
            toast.warning("your session expires soon — save your work", {
              duration: 10000,
            })
          }
        }

        const timeUntilExpiry = sessionExpiresAt
          ? sessionExpiresAt.getTime() - Date.now()
          : SESSION_DURATION_MS

        if (timeUntilExpiry < SESSION_WARNING_THRESHOLD_MS) {
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError) {
            setSessionExpiresAt(new Date(Date.now() + SESSION_DURATION_MS))
          }
        }
      } catch {
        // Silent fail - will retry on next interval
      }
    }

    checkSession()

    const sessionInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS)

    return () => clearInterval(sessionInterval)
  }, [router, sessionExpiresAt])

  // ===========================================================================
  // Auth State Change Listener
  // ===========================================================================

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          useUserStore.getState().clear()
          router.replace('/')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // ===========================================================================
  // Reset activity on route change
  // ===========================================================================

  useEffect(() => {
    resetActivity()
  }, [pathname, resetActivity])

  // ===========================================================================
  // Context Value
  // ===========================================================================

  const contextValue: AppShellContextValue = {
    isOnline,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    isIdle,
    lastActivity,
    sessionExpiresAt,
  }

  return (
    <AppShellContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        {children}
      </TooltipProvider>
    </AppShellContext.Provider>
  )
}

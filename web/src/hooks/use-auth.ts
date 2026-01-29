'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'
import { useConversationStore } from '@/stores/conversation-store'

// =============================================================================
// Types
// =============================================================================

interface AuthError {
  message: string
  code?: string
}

interface SignUpResult {
  user: User | null
  needsConfirmation: boolean
}

interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: AuthError | null
  isEmailVerified: boolean
  clearError: () => void
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signOut: () => Promise<void>
  logout: () => Promise<void>  // Clears all state + signs out (caller handles redirect)
  updatePassword: (newPassword: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  // ---------------------------------------------------------------------------
  // Initialize & Subscribe to Auth Changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const supabase = createClient()

    // Fetch initial user
    async function initialize() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          // Don't set error for "not authenticated" — that's expected
          if (error.message !== 'Auth session missing!') {
            setError({ message: error.message, code: error.code })
          }
        }

        setUser(user)
      } catch (err) {
        setError({ message: 'Failed to initialize auth' })
      } finally {
        setLoading(false)
      }
    }

    initialize()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        // Clear any previous errors on successful auth change
        if (session?.user) {
          setError(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Clear Error
  // ---------------------------------------------------------------------------

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Sign In (Email/Password)
  // ---------------------------------------------------------------------------

  const signIn = useCallback(async (email: string, password: string): Promise<User> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const authError = { message: formatAuthError(error.message), code: error.code }
        setError(authError)
        throw new Error(authError.message)
      }

      if (!data.user) {
        const authError = { message: 'Sign in failed' }
        setError(authError)
        throw new Error(authError.message)
      }

      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Sign Up (Email/Password)
  // ---------------------------------------------------------------------------

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        const authError = { message: formatAuthError(error.message), code: error.code }
        setError(authError)
        throw new Error(authError.message)
      }

      // Check if email confirmation is required
      const needsConfirmation = data.user ? !data.user.confirmed_at : false

      if (!needsConfirmation && data.user) {
        setUser(data.user)
      }

      return {
        user: data.user,
        needsConfirmation,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Sign Out (basic - just calls supabase)
  // ---------------------------------------------------------------------------

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        const authError = { message: formatAuthError(error.message), code: error.code }
        setError(authError)
        throw new Error(authError.message)
      }

      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Logout (bulletproof - clears all state + signs out)
  // Caller should handle redirect with router.replace('/')
  // ---------------------------------------------------------------------------

  const logout = useCallback(async (): Promise<void> => {
    // Clear local state FIRST so UI feels instant
    // Use getState() to access store without hooks
    useUserStore.getState().clear()
    useConversationStore.getState().clear()

    // Clear local user state
    setUser(null)
    setError(null)

    // Sign out from Supabase (clears cookies)
    // Even if this fails, we've already cleared local state
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignore errors - local state is already cleared
      // User will be redirected to landing page anyway
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Update Password
  // ---------------------------------------------------------------------------

  const updatePassword = useCallback(async (newPassword: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        const authError = { message: formatAuthError(error.message), code: error.code }
        setError(authError)
        throw new Error(authError.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Resend Verification Email
  // ---------------------------------------------------------------------------

  const resendVerificationEmail = useCallback(async (): Promise<void> => {
    if (!user?.email) {
      throw new Error('No email address found')
    }

    setError(null)

    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (resendError) {
        const authError = { message: formatAuthError(resendError.message), code: resendError.code }
        setError(authError)
        throw new Error(authError.message)
      }
    } catch (err) {
      // Only set error if it wasn't already set by the block above
      if (err instanceof Error) {
        setError((prev) => prev ?? { message: err.message })
      }
      throw err
    }
  }, [user?.email])

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  // User is verified if email_confirmed_at is set
  const isEmailVerified = Boolean(user?.email_confirmed_at)

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    user,
    loading,
    error,
    isEmailVerified,
    clearError,
    signIn,
    signUp,
    signOut,
    logout,
    updatePassword,
    resendVerificationEmail,
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format Supabase auth errors into user-friendly messages
 */
function formatAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'incorrect email or password',
    'Email not confirmed': 'please check your email to confirm your account',
    'User already registered': 'an account with this email already exists',
    'Password should be at least 6 characters': 'password must be at least 6 characters',
    'Auth session missing!': 'please log in to continue',
    'New password should be different from the old password': 'new password must be different from your current password',
  }

  return errorMap[message] || message.toLowerCase()
}

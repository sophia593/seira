"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { parseAuthCallbackError } from "@/lib/auth-callback-error"

// =============================================================================
// Error Message Mapping
// =============================================================================

function getAuthErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    // Supabase error messages
    'Invalid login credentials': 'incorrect email or password',
    'Email not confirmed': 'please verify your email first. check your inbox.',
    'Invalid email or password': 'incorrect email or password',
    'User not found': 'no account found with this email',
    'Email rate limit exceeded': 'too many attempts. please wait a few minutes.',
    'For security purposes, you can only request this once every 60 seconds': 'please wait before trying again',
    // Network errors
    'Failed to fetch': 'connection failed. check your internet and try again.',
    'Network request failed': 'connection failed. check your internet and try again.',
    'fetch failed': 'connection failed. check your internet and try again.',
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // Default fallback
  return 'something went wrong. please try again.'
}

// =============================================================================
// Login Form Component
// =============================================================================

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  const supabase = createClient()

  // Show message from redirect (e.g., after signup)
  const message = searchParams.get("message")
  const redirectTo = searchParams.get("redirect")

  // Parse callback error params (e.g., ?error=expired from /callback)
  const callbackError = parseAuthCallbackError(searchParams)
  const [callbackDismissed, setCallbackDismissed] = useState(false)

  function validateForm() {
    const newErrors = { email: "", password: "" }
    let isValid = true

    if (!formData.email.trim()) {
      newErrors.email = "email is required"
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "please enter a valid email"
      isValid = false
    }

    if (!formData.password) {
      newErrors.password = "password is required"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setFormError(getAuthErrorMessage(error.message))
        return
      }

      // Redirect to specified URL or default to dashboard
      router.push(redirectTo || "/dashboard")
      router.refresh()
    } catch {
      setFormError('something went wrong. please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    setFormError('')

    try {
      // Store redirect URL for post-OAuth redirect
      if (redirectTo) {
        localStorage.setItem('seira_auth_redirect', redirectTo)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      })

      if (error) {
        setFormError("couldn't connect to google. please try again.")
        setIsGoogleLoading(false)
      }
    } catch {
      setFormError('something went wrong. please try again.')
      setIsGoogleLoading(false)
    }
  }

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
    if (formError) {
      setFormError('')
    }
  }

  const inputBase = "w-full h-10 px-3 rounded-md bg-white border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      {/* Logo */}
      <div className="mb-8 animate-in fade-in duration-500">
        <Logo />
      </div>

      <div className="w-full max-w-sm animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            sign in to your workspace
          </p>
        </div>

        {/* Message from redirect (e.g., after signup) */}
        {message === "check-email" && (
          <div className="mb-4 p-3 rounded-md bg-blue-50 text-sm text-center">
            <p className="text-blue-600">
              check your email to verify your account, then log in
            </p>
          </div>
        )}

        {/* Callback error banner (e.g., expired verification link) */}
        {callbackError && !callbackDismissed && (
          <div className="mb-4 p-3 rounded-md bg-red-50 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-600">{callbackError.title}</p>
                  <p className="text-sm text-red-500 mt-0.5">{callbackError.message}</p>
                  {callbackError.action === 'resend-verification' && (
                    <Link
                      href="/signup"
                      className="inline-block text-sm font-medium text-red-600 hover:underline mt-2"
                    >
                      resend verification email
                    </Link>
                  )}
                  {callbackError.action === 'request-reset' && (
                    <Link
                      href="/forgot-password"
                      className="inline-block text-sm font-medium text-red-600 hover:underline mt-2"
                    >
                      request a new reset link
                    </Link>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCallbackDismissed(true)}
                className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          className={cn(
            "w-full flex items-center justify-center gap-3 h-10 rounded-md",
            "border border-gray-200 bg-white hover:bg-gray-50",
            "text-sm font-medium text-gray-700",
            "transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>continue with google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-4 text-gray-400">or</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              disabled={isLoading}
              className={cn(
                inputBase,
                errors.email && "border-red-300 focus:border-red-400"
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className={cn(
                  inputBase,
                  "pr-10",
                  errors.password && "border-red-300 focus:border-red-400"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Form Error */}
          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className={cn(
              "w-full h-10 rounded-md",
              "bg-gray-900 text-white",
              "text-sm font-medium",
              "hover:bg-gray-800",
              "focus:outline-none focus:ring-0",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              "log in"
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="mt-8 text-center text-sm text-gray-500">
          don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-gray-900 hover:underline"
          >
            sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

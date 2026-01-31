"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, AlertCircle, Mail, RefreshCw, CheckCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const RESEND_COOLDOWN_SECONDS = 60

// =============================================================================
// Error Message Mapping
// =============================================================================

function getAuthErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    // Supabase error messages
    'User already registered': 'this email is already registered. try logging in.',
    'already registered': 'this email is already registered. try logging in.',
    'Password should be at least': 'password must be at least 8 characters',
    'Invalid email': 'please enter a valid email address',
    'Email rate limit exceeded': 'too many attempts. please wait a few minutes.',
    'Signups not allowed': 'signups are temporarily disabled. please try again later.',
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
// Signup Form Component
// =============================================================================

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  // Success state
  const [isSuccess, setIsSuccess] = useState(false)
  const [signedUpEmail, setSignedUpEmail] = useState('')

  // Resend state
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({
    firstName: "",
    email: "",
    password: "",
  })

  const supabase = createClient()

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  function validateForm() {
    const newErrors = { firstName: "", email: "", password: "" }
    let isValid = true

    if (!formData.firstName.trim()) {
      newErrors.firstName = "first name is required"
      isValid = false
    }

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
    } else if (formData.password.length < 8) {
      newErrors.password = "password must be at least 8 characters"
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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.firstName,
          },
        },
      })

      if (error) {
        setFormError(getAuthErrorMessage(error.message))
        return
      }

      // Show success screen instead of redirecting
      setSignedUpEmail(formData.email)
      setIsSuccess(true)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch {
      setFormError('something went wrong. please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendEmail() {
    if (isResending || cooldown > 0) return

    setIsResending(true)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signedUpEmail,
      })

      if (error) {
        if (error.message.includes('rate limit')) {
          setFormError('please wait a moment before requesting another email')
        } else {
          setFormError(getAuthErrorMessage(error.message))
        }
        return
      }

      setResendSuccess(true)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      // Reset success indicator after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000)
    } catch {
      setFormError('connection failed. please try again.')
    } finally {
      setIsResending(false)
    }
  }

  function handleTryAgain() {
    setIsSuccess(false)
    setSignedUpEmail('')
    setFormData({ firstName: '', email: '', password: '' })
    setErrors({ firstName: '', email: '', password: '' })
    setFormError('')
    setCooldown(0)
  }

  async function handleGoogleSignup() {
    setIsGoogleLoading(true)
    setFormError('')

    try {
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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
    if (formError) {
      setFormError('')
    }
  }

  // =========================================================================
  // Success Screen
  // =========================================================================
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        {/* Logo */}
        <div className="mb-8 animate-in fade-in duration-500">
          <Logo />
        </div>

        {/* Card */}
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <div className="rounded-3xl border bg-card p-6 sm:p-10 shadow-lg text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-300">
              <Mail className="h-8 w-8 text-primary" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold lowercase mb-2">
              check your email
            </h1>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-2">
              we sent a verification link to
            </p>
            <p className="font-medium text-foreground mb-6 break-all">
              {signedUpEmail}
            </p>

            {/* Error Message */}
            {formError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 mb-4 text-left animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            {/* Resend Button */}
            <button
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className={cn(
                "inline-flex items-center justify-center gap-2 w-full h-11 rounded-2xl",
                "text-sm font-medium transition-all duration-150",
                resendSuccess
                  ? "bg-green-500/10 text-green-600 dark:text-green-500"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  sending...
                </>
              ) : resendSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  sent!
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  resend in {cooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  resend email
                </>
              )}
            </button>

            {/* Help text */}
            <p className="text-xs text-muted-foreground mt-4">
              didn't get it? check your spam folder
            </p>

            {/* Try different email */}
            <button
              onClick={handleTryAgain}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              wrong email? try again
            </button>

            {/* Divider */}
            <div className="border-t my-6" />

            {/* Login Link */}
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center justify-center",
                "h-11 px-6 rounded-2xl w-full",
                "border bg-background hover:bg-accent",
                "text-sm font-medium",
                "transition-colors"
              )}
            >
              go to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // Signup Form
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo */}
      <div className="mb-8 animate-in fade-in duration-500">
        <Logo />
      </div>

      {/* Card */}
      <div className="w-full max-w-md animate-in fade-in duration-500">
        <div className="rounded-3xl border bg-card p-6 sm:p-10 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold lowercase mb-2">
              create an account
            </h1>
            <p className="text-muted-foreground text-sm">
              start planning your next adventure
            </p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading || isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-3 h-12 rounded-2xl",
              "border bg-background hover:bg-accent",
              "text-sm font-medium",
              "transition-colors duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-zinc-950 px-4 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="text-sm font-medium text-foreground"
              >
                first name
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="jane"
                autoComplete="given-name"
                disabled={isLoading}
                className={cn(
                  "w-full h-12 px-5 rounded-2xl",
                  "bg-background border",
                  "text-sm placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus-visible:ring-primary/40 focus:border-primary",
                  "transition-all duration-150",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  errors.firstName && "border-destructive focus:ring-destructive/20"
                )}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
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
                  "w-full h-12 px-5 rounded-2xl",
                  "bg-background border",
                  "text-sm placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus-visible:ring-primary/40 focus:border-primary",
                  "transition-all duration-150",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  errors.email && "border-destructive focus:ring-destructive/20"
                )}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={cn(
                    "w-full h-12 px-5 pr-12 rounded-2xl",
                    "bg-background border",
                    "text-sm placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-2 focus-visible:ring-primary/40 focus:border-primary",
                    "transition-all duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    errors.password && "border-destructive focus:ring-destructive/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-10 h-10 flex items-center justify-center rounded-lg"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password}</p>
              ) : (
                <p className="text-xs text-muted-foreground">minimum 8 characters</p>
              )}
            </div>

            {/* Form Error */}
            {formError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className={cn(
                "w-full h-12 rounded-2xl",
                "bg-primary text-primary-foreground",
                "text-sm font-medium",
                "hover:bg-primary/90",
                "focus:outline-none focus:ring-2 focus-visible:ring-primary/40 focus:ring-offset-2",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "sign up"
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            by signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground transition-colors">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">
              privacy policy
            </Link>
          </p>
        </div>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            log in
          </Link>
        </p>
      </div>
    </div>
  )
}

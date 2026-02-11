"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Loader2, KeyRound, AlertCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

type PageState = "loading" | "ready" | "invalid" | "success"
type PasswordStrength = "weak" | "medium" | "strong"

const MIN_PASSWORD_LENGTH = 8

// =============================================================================
// Password Strength Calculator
// =============================================================================

function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return "weak"
  }

  let score = 0

  // Length bonus
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Determine strength
  if (score >= 5) return "strong"
  if (score >= 3) return "medium"
  return "weak"
}

const STRENGTH_CONFIG = {
  weak: {
    label: "weak",
    color: "bg-red-500",
    width: "w-1/3",
  },
  medium: {
    label: "medium",
    color: "bg-yellow-500",
    width: "w-2/3",
  },
  strong: {
    label: "strong",
    color: "bg-green-500",
    width: "w-full",
  },
}

// =============================================================================
// Main Component
// =============================================================================

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>("loading")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  // Calculate password strength
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  )
  const strengthConfig = STRENGTH_CONFIG[passwordStrength]

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // User clicked the reset link and has a valid session
          setPageState("ready")
          if (session?.user?.email) {
            setUserEmail(session.user.email)
          }
        } else if (event === "SIGNED_IN") {
          // Recovery flow may fire SIGNED_IN instead of PASSWORD_RECOVERY
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setPageState((current) => current === "loading" ? "ready" : current)
            if (user.email) {
              setUserEmail(user.email)
            }
          }
        }
      }
    )

    // Check if user already has a session (callback redirect case)
    // Use getUser() which validates server-side — more reliable than
    // getSession() when cookies just arrived from a redirect
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setPageState("ready")
        if (user.email) {
          setUserEmail(user.email)
        }
        return
      }

      // No session yet — give onAuthStateChange time to process.
      // Generous timeout handles slow networks without flashing
      // the form before the error state.
      setTimeout(() => {
        setPageState((current) => current === "loading" ? "invalid" : current)
      }, 5000)
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  // Password validation
  function validatePassword(): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `password must be at least ${MIN_PASSWORD_LENGTH} characters`
    }
    if (password !== confirmPassword) {
      return "passwords don't match"
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationError = validatePassword()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        // Handle specific error messages
        if (error.message.includes("same as")) {
          setError("new password must be different from your current password")
        } else if (error.message.includes("weak")) {
          setError("password is too weak, try adding numbers or symbols")
        } else {
          setError(error.message.toLowerCase())
        }
        return
      }

      // Success
      setPageState("success")
      toast.success("password updated successfully")

      // Sign out and redirect to login
      await supabase.auth.signOut()

      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch {
      setError("something went wrong, please try again")
    } finally {
      setIsSubmitting(false)
    }
  }

  // =========================================================================
  // Render: Loading State
  // =========================================================================
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="mb-8 animate-in fade-in duration-500">
          <Logo />
        </div>
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              verifying your reset link...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // Render: Invalid/Expired Link State
  // =========================================================================
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="mb-8 animate-in fade-in duration-500">
          <Logo />
        </div>
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
            {/* Error Icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>

            <h1 className="text-2xl font-semibold mb-1">
              Link expired
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              this password reset link has expired or is invalid.
              <br />
              please request a new one.
            </p>

            <Link
              href="/forgot-password"
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "h-10 px-6 rounded-lg w-full",
                "bg-foreground text-background",
                "text-sm font-medium",
                "hover:bg-foreground/90 transition-colors"
              )}
            >
              request new link
            </Link>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              remember your password?{" "}
              <Link href="/login" className="text-foreground hover:underline">
                log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // Render: Success State
  // =========================================================================
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="mb-8 animate-in fade-in duration-500">
          <Logo />
        </div>
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
            {/* Success Icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-muted flex items-center justify-center animate-in zoom-in duration-300">
              <KeyRound className="h-7 w-7 text-foreground" />
            </div>

            <h1 className="text-2xl font-semibold mb-1">
              Password updated
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              your password has been reset successfully.
              <br />
              redirecting you to login...
            </p>

            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // Render: Form State (Ready)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo */}
      <div className="mb-8 animate-in fade-in duration-500">
        <Logo />
      </div>

      {/* Card */}
      <div className="w-full max-w-md animate-in fade-in duration-500">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            back to login
          </Link>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-1">
              Create new password
            </h1>
            {userEmail ? (
              <p className="text-muted-foreground text-sm">
                you're resetting the password for{" "}
                <span className="text-foreground font-medium">{userEmail}</span>
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                enter your new password below
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                new password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError("")
                  }}
                  placeholder="at least 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  disabled={isSubmitting}
                  className={cn(
                    "w-full h-10 px-3 pr-10 rounded-lg",
                    "bg-background border border-border",
                    "text-sm placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    "transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error && "border-destructive focus:ring-destructive/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Bar */}
              {password.length > 0 && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300 ease-out",
                        strengthConfig.color,
                        strengthConfig.width
                      )}
                    />
                  </div>
                  <p className={cn(
                    "text-xs transition-colors",
                    passwordStrength === "weak" && "text-red-500",
                    passwordStrength === "medium" && "text-yellow-600 dark:text-yellow-500",
                    passwordStrength === "strong" && "text-green-600 dark:text-green-500"
                  )}>
                    {strengthConfig.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-foreground"
              >
                confirm password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError("")
                  }}
                  placeholder="re-enter your password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full h-10 px-3 pr-10 rounded-lg",
                    "bg-background border border-border",
                    "text-sm placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    "transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error && error.includes("match") && "border-destructive focus:ring-destructive/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword.length > 0 && password.length > 0 && (
                <p className={cn(
                  "text-xs animate-in fade-in duration-200",
                  password === confirmPassword
                    ? "text-green-600 dark:text-green-500"
                    : "text-muted-foreground"
                )}>
                  {password === confirmPassword ? "passwords match" : "passwords don't match yet"}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className={cn(
                "w-full h-10 rounded-lg",
                "bg-foreground text-background",
                "text-sm font-medium",
                "hover:bg-foreground/90",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "update password"
              )}
            </button>
          </form>

          {/* Password Requirements */}
          <div className="mt-5 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">
              password must be at least {MIN_PASSWORD_LENGTH} characters
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

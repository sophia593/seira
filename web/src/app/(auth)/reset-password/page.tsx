"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Loader2, KeyRound, AlertCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

type PageState = "loading" | "ready" | "invalid" | "success"

const MIN_PASSWORD_LENGTH = 8

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>("loading")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // User clicked the reset link and has a valid session
          setPageState("ready")
        } else if (event === "SIGNED_IN" && pageState === "loading") {
          // Check if this is a password recovery session
          // (user may have refreshed the page after clicking link)
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setPageState("ready")
          }
        }
      }
    )

    // Check if user already has a session (page refresh case)
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setPageState("ready")
      } else {
        // Give some time for the auth state to be processed from URL
        setTimeout(() => {
          setPageState((current) => current === "loading" ? "invalid" : current)
        }, 2000)
      }
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, pageState])

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
          <div className="rounded-3xl border bg-card p-10 shadow-lg text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
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
          <div className="rounded-3xl border bg-card p-10 shadow-lg text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <h1 className="text-2xl font-semibold lowercase mb-2">
              link expired
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
                "h-11 px-6 rounded-2xl w-full",
                "bg-primary text-primary-foreground",
                "text-sm font-medium",
                "hover:bg-primary/90 transition-colors"
              )}
            >
              request new link
            </Link>

            <p className="mt-6 text-center text-xs text-muted-foreground">
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
          <div className="rounded-3xl border bg-card p-10 shadow-lg text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-300">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>

            <h1 className="text-2xl font-semibold lowercase mb-2">
              password updated
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
        <div className="rounded-3xl border bg-card p-10 shadow-lg">
          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            back to login
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold lowercase mb-2">
              create new password
            </h1>
            <p className="text-muted-foreground text-sm">
              enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
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
                    "w-full h-12 px-5 pr-12 rounded-2xl",
                    "bg-background border",
                    "text-sm placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    "transition-all duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error && "border-destructive focus:ring-destructive/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
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
                    "w-full h-12 px-5 pr-12 rounded-2xl",
                    "bg-background border",
                    "text-sm placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    "transition-all duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error && error.includes("match") && "border-destructive focus:ring-destructive/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className={cn(
                "w-full h-12 rounded-2xl",
                "bg-primary text-primary-foreground",
                "text-sm font-medium",
                "hover:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                "transition-all duration-150",
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
          <div className="mt-6 p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground">
              password must be at least {MIN_PASSWORD_LENGTH} characters
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Mail, RefreshCw, AlertCircle, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { parseAuthCallbackError } from "@/lib/auth-callback-error"

const RESEND_COOLDOWN_SECONDS = 60

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)

  // Parse callback error params (e.g., ?error=expired from /callback)
  const callbackError = parseAuthCallbackError(searchParams)
  const [callbackDismissed, setCallbackDismissed] = useState(false)

  const supabase = createClient()

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  // Email validation
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      setError("email is required")
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("please enter a valid email")
      return
    }

    if (cooldown > 0) {
      toast.error(`please wait ${cooldown} seconds before trying again`)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Use env variable with fallback to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${siteUrl}/reset-password`,
      })

      if (error) {
        if (error.message.includes("rate limit")) {
          toast.error("too many requests, please try again later")
          setCooldown(RESEND_COOLDOWN_SECONDS)
        } else {
          toast.error(error.message)
        }
        return
      }

      setIsSuccess(true)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch {
      toast.error("something went wrong, please try again")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0) return

    setIsLoading(true)

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${siteUrl}/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("reset link sent again")
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch {
      toast.error("couldn't resend, please try again")
    } finally {
      setIsLoading(false)
    }
  }

  function handleTryDifferentEmail() {
    setIsSuccess(false)
    setEmail("")
    setError("")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo */}
      <div className="mb-8 animate-in fade-in duration-500">
        <Logo />
      </div>

      {/* Card */}
      <div className="w-full max-w-md animate-in fade-in duration-500">
        <div className="rounded-3xl border bg-card p-10 shadow-lg">
          {isSuccess ? (
            // =========== Success State ===========
            <div className="text-center">
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
                we sent a password reset link to
              </p>
              <p className="font-medium text-foreground mb-6 break-all">
                {email}
              </p>

              {/* Instructions */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground mb-3">
                  next steps:
                </p>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>open the email from seira</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>click the reset password link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>create your new password</span>
                  </li>
                </ol>
              </div>

              {/* Didn't receive */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  didn't receive it? check your spam folder
                </p>

                {/* Resend Button */}
                <button
                  onClick={handleResend}
                  disabled={isLoading || cooldown > 0}
                  className={cn(
                    "inline-flex items-center gap-2 text-sm",
                    cooldown > 0
                      ? "text-muted-foreground cursor-not-allowed"
                      : "text-primary hover:underline"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {cooldown > 0 ? `resend in ${cooldown}s` : "resend email"}
                </button>

                {/* Try different email */}
                <div>
                  <button
                    onClick={handleTryDifferentEmail}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    try a different email
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t my-6" />

              {/* Back to login */}
              <Link
                href="/login"
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "h-11 px-6 rounded-2xl w-full",
                  "bg-primary text-primary-foreground",
                  "text-sm font-medium",
                  "hover:bg-primary/90 transition-colors"
                )}
              >
                back to login
              </Link>
            </div>
          ) : (
            // =========== Form State ===========
            <>
              {/* Back Link */}
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                back to login
              </Link>

              {/* Callback error banner (e.g., expired reset link) */}
              {callbackError && !callbackDismissed && (
                <div className="mb-6 p-4 rounded-xl bg-destructive/10 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-destructive">{callbackError.title}</p>
                        <p className="text-sm text-destructive/80 mt-0.5">{callbackError.message}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCallbackDismissed(true)}
                      className="text-destructive/60 hover:text-destructive transition-colors shrink-0"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold lowercase mb-2">
                  {callbackError && !callbackDismissed ? 'request a new link' : 'forgot password?'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {callbackError && !callbackDismissed
                    ? 'enter your email and we\'ll send a fresh reset link'
                    : 'no worries — enter your email and we\'ll send you a reset link'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError("")
                    }}
                    placeholder="jane@example.com"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    className={cn(
                      "w-full h-12 px-5 rounded-2xl",
                      "bg-background border",
                      "text-sm placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      "transition-all duration-150",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      error && "border-destructive focus:ring-destructive/20"
                    )}
                  />
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || cooldown > 0}
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
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : cooldown > 0 ? (
                    `wait ${cooldown}s`
                  ) : (
                    "send reset link"
                  )}
                </button>
              </form>

              {/* Help text */}
              <p className="mt-6 text-center text-xs text-muted-foreground">
                remember your password?{" "}
                <Link
                  href="/login"
                  className="text-foreground hover:underline"
                >
                  log in
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Signup Link */}
        {!isSuccess && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground hover:underline"
            >
              sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}

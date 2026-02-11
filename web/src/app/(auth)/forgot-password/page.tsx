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

  const inputBase = "w-full h-10 px-3 rounded-md bg-white border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:border-copper focus:ring-2 focus:ring-copper/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <>
      {/* Logo */}
      <div className="mb-8 animate-in fade-in duration-500">
        <Logo color="brand" />
      </div>

      <div className="w-full max-w-sm bg-white rounded-xl px-8 py-10 shadow-2xl animate-in fade-in duration-500">
        {isSuccess ? (
          // =========== Success State ===========
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-copper/10 flex items-center justify-center animate-in zoom-in duration-300">
              <Mail className="h-7 w-7 text-copper" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold text-gray-900">
              Check your email
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-sm mt-1 mb-1">
              we sent a password reset link to
            </p>
            <p className="font-medium text-gray-900 mb-6 break-all text-sm">
              {email}
            </p>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-md p-4 mb-5 text-left">
              <p className="text-sm text-gray-500 mb-3">
                next steps:
              </p>
              <ol className="text-sm text-gray-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">1</span>
                  <span>open the email from seira</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">2</span>
                  <span>click the reset password link</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">3</span>
                  <span>create your new password</span>
                </li>
              </ol>
            </div>

            {/* Didn't receive */}
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                didn't receive it? check your spam folder
              </p>

              {/* Resend Button */}
              <button
                onClick={handleResend}
                disabled={isLoading || cooldown > 0}
                className={cn(
                  "inline-flex items-center gap-2 text-sm",
                  cooldown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-900 hover:underline"
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
                  className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                >
                  try a different email
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-5" />

            {/* Back to login */}
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "h-10 px-6 rounded-md w-full",
                "bg-kurobeni text-white",
                "text-sm font-medium",
                "hover:bg-blackberry transition-colors"
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
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              back to login
            </Link>

            {/* Callback error banner (e.g., expired reset link) */}
            {callbackError && !callbackDismissed && (
              <div className="mb-4 p-3 rounded-md bg-red-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-600">{callbackError.title}</p>
                      <p className="text-sm text-red-500 mt-0.5">{callbackError.message}</p>
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

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">
                {callbackError && !callbackDismissed ? 'Request a new link' : 'Forgot password?'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {callbackError && !callbackDismissed
                  ? 'enter your email and we\'ll send a fresh reset link'
                  : 'no worries — enter your email and we\'ll send you a reset link'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-gray-600"
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
                    inputBase,
                    error && "border-red-300 focus:border-red-400"
                  )}
                />
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || cooldown > 0}
                className={cn(
                  "w-full h-10 rounded-md",
                  "bg-kurobeni text-white",
                  "text-sm font-medium",
                  "hover:bg-blackberry",
                  "focus:outline-none focus:ring-0",
                  "transition-colors",
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
            <p className="mt-5 text-center text-xs text-gray-400">
              remember your password?{" "}
              <Link
                href="/login"
                className="text-gray-900 hover:underline"
              >
                log in
              </Link>
            </p>
          </>
        )}
      </div>

      {/* Signup Link — below card */}
      {!isSuccess && (
        <p className="mt-6 text-center text-sm text-white/60">
          don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-white hover:underline"
          >
            sign up
          </Link>
        </p>
      )}
    </>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <Loader2 className="h-6 w-6 animate-spin text-white/40" />
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}

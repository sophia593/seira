"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      setError("email is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("please enter a valid email")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setIsSuccess(true)
    } catch {
      toast.error("something went wrong, please try again")
    } finally {
      setIsLoading(false)
    }
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
            // Success State
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold lowercase mb-2">
                check your email
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                we sent a password reset link to<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                didn't receive the email? check your spam folder or{" "}
                <button
                  onClick={() => setIsSuccess(false)}
                  className="underline hover:text-foreground transition-colors"
                >
                  try again
                </button>
              </p>
              <Link
                href="/login"
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "h-12 px-6 rounded-2xl",
                  "bg-primary text-primary-foreground",
                  "text-sm font-medium",
                  "hover:bg-primary/90 transition-colors"
                )}
              >
                back to login
              </Link>
            </div>
          ) : (
            // Form State
            <>
              {/* Back Link */}
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                back to login
              </Link>

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold lowercase mb-2">
                  forgot password?
                </h1>
                <p className="text-muted-foreground text-sm">
                  enter your email and we'll send you a reset link
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
                  disabled={isLoading}
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
                  ) : (
                    "send reset link"
                  )}
                </button>
              </form>
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

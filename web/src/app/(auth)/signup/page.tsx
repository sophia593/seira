"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MessageSquare, Plane, Calendar, Sparkles, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/sonner"

// =============================================================================
// Feature Item
// =============================================================================

function FeatureItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span>{text}</span>
    </div>
  )
}

// =============================================================================
// Google Icon
// =============================================================================

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
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
  )
}

// =============================================================================
// Check Email State
// =============================================================================

function CheckEmailState({ email }: { email: string }) {
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  async function handleResend() {
    if (cooldown > 0 || isResending) return

    setIsResending(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("verification email sent")
        setCooldown(60) // 60 second cooldown
      }
    } catch {
      toast.error("couldn't send email")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-sm text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>

          <h1 className="text-2xl font-semibold mb-2 lowercase">check your email</h1>
          <p className="text-muted-foreground mb-4">
            we sent a confirmation link to{" "}
            <strong className="text-foreground">{email}</strong>
            <br />
            click the link to activate your account.
          </p>

          <p className="text-sm text-muted-foreground mb-6">
            didn't receive it? check your spam folder or resend below.
          </p>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  sending...
                </>
              ) : cooldown > 0 ? (
                `resend in ${cooldown}s`
              ) : (
                "resend verification email"
              )}
            </Button>

            <Link
              href="/login"
              className="block text-sm text-muted-foreground hover:text-primary"
            >
              back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleGoogleSignUp = async () => {
    setGoogleError(null)
    setGoogleLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    })

    if (error) {
      setGoogleError(error.message)
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is required
    if (data.user && !data.session) {
      setCheckEmail(true)
      setLoading(false)
      return
    }

    // If we have a session, save the name to the users table
    if (data.session && name.trim()) {
      try {
        const api = getApi()
        await api.updateMe({ name: name.trim() })
      } catch {
        // Don't block signup if name save fails
      }
    }

    router.push("/chat")
    router.refresh()
  }

  if (checkEmail) {
    return <CheckEmailState email={email} />
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 bg-muted/30">
        <div className="max-w-md">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-2xl font-semibold lowercase">seira</span>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-semibold tracking-tight mb-4 lowercase">
            your ai travel companion
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            plan trips to concerts, games, and events with intelligent assistance that handles the details.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <FeatureItem
              icon={Sparkles}
              text="ai-powered trip planning"
            />
            <FeatureItem
              icon={Calendar}
              text="find events and book travel"
            />
            <FeatureItem
              icon={Plane}
              text="flights, hotels, and tickets in one place"
            />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-xl font-semibold lowercase">seira</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold lowercase">create an account</h1>
              <p className="text-sm text-muted-foreground mt-1">
                start planning your next adventure
              </p>
            </div>

            {/* Google Sign Up */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full h-11"
            >
              <GoogleIcon className="w-5 h-5 mr-2" />
              {googleLoading ? "redirecting..." : "continue with google"}
            </Button>

            {googleError && (
              <p className="mt-2 text-sm text-destructive text-center">{googleError}</p>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">first name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="your first name"
                  className="h-11"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  minimum 6 characters
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11"
              >
                {loading ? "creating account..." : "sign up"}
              </Button>
            </form>

            {/* Terms */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              by signing up, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                privacy policy
              </Link>
            </p>
          </div>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"
import { useAuth } from "@/hooks/use-auth"

export function LandingHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-6xl mx-auto w-full">
      <Logo className="text-lg sm:text-xl" linkToHome={false} />
      <div className="flex items-center gap-2 sm:gap-3">
        {loading ? (
          // Loading state - show placeholder
          <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
        ) : user ? (
          // Logged in - show "go to chat" button
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 text-nav px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            go to chat
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          // Not logged in - show login/signup
          <>
            <Link
              href="/login"
              className="text-nav px-3 sm:px-4 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
            >
              log in
            </Link>
            <Link
              href="/signup"
              className="text-nav px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              sign up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

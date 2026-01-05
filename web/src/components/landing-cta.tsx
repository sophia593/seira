"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function LandingCTA() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-12 w-48 bg-muted rounded-lg animate-pulse mx-auto" />
    )
  }

  if (user) {
    return (
      <Link
        href="/chat"
        className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:gap-3 lowercase group"
      >
        go to chat
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    )
  }

  return (
    <Link
      href="/signup"
      className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:gap-3 lowercase group"
    >
      get started free
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

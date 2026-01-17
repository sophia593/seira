"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export function LandingCTA() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-12 w-48 bg-muted rounded-full animate-pulse mx-auto" />
    )
  }

  if (user) {
    return (
      <Button asChild variant="fancy" size="lg" className="rounded-full px-8">
        <Link href="/chat">
          <span>try seira</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    )
  }

  return (
    <Button asChild variant="fancy" size="lg" className="rounded-full px-8">
      <Link href="/signup">
        <span>try seira</span>
        <ArrowRight className="h-4 w-4 ml-2" />
      </Link>
    </Button>
  )
}

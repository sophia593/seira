'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function LandingHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-6xl mx-auto w-full">
      <Logo className="text-lg sm:text-xl" linkToHome={false} />
      <div className="flex items-center gap-2 sm:gap-3">
        {loading ? (
          // Loading state - show placeholder
          <div className="h-9 w-24 bg-muted rounded-xl animate-pulse" />
        ) : user ? (
          // Logged in - show "go to chat" button
          <Button asChild>
            <Link href="/chat">
              go to chat
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          // Not logged in - show login/signup
          <>
            <Button asChild variant="ghost">
              <Link href="/login">log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">sign up</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  )
}

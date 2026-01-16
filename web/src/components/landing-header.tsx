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
      <nav className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/pricing"
          className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-all active:scale-[0.97] hidden sm:block"
        >
          pricing
        </Link>
        <Link
          href="/about"
          className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-all active:scale-[0.97] hidden sm:block"
        >
          about
        </Link>
        {loading ? (
          // Loading state - show placeholder
          <div className="h-9 w-20 bg-muted rounded-lg animate-pulse" />
        ) : user ? (
          // Logged in - show "start planning" button
          <Button asChild className="active:scale-[0.97] transition-transform">
            <Link href="/chat">
              start planning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          // Not logged in - show subtle login link
          <Button asChild variant="ghost" className="active:scale-[0.97] transition-transform">
            <Link href="/login">log in</Link>
          </Button>
        )}
      </nav>
    </header>
  )
}

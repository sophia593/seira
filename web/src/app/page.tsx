'use client'

import { useEffect, useRef } from 'react'
import { Sparkles } from "lucide-react"
import { LandingHeader } from "@/components/landing-header"
import { LandingCTA } from "@/components/landing-cta"
import { DemoPreview } from "@/components/demo-preview"
import { HowItWorks } from "@/components/how-it-works"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"

// =============================================================================
// Fade-In Section Component
// =============================================================================

interface FadeInSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number // delay in ms
}

function FadeInSection({ children, className, delay = 0 }: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add delay if specified (keep short)
            setTimeout(() => {
              entry.target.classList.add('opacity-100', 'translate-y-0')
              entry.target.classList.remove('opacity-90', 'translate-y-3')
            }, Math.min(delay, 150)) // Cap delay at 150ms for fast scroll

            // Stop observing once animated (play only once)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.05, // Trigger early (5% visible)
        rootMargin: '50px 0px 0px 0px', // Trigger before element enters viewport
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [delay])

  // Start with content nearly visible - animation is just polish
  // If animation fails, content is still readable at 90% opacity
  return (
    <div
      ref={ref}
      className={cn(
        'opacity-90 translate-y-3 transition-all duration-300 ease-out',
        className
      )}
    >
      {children}
    </div>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col overflow-x-hidden">
      {/* Header — no animation (always visible) */}
      <LandingHeader />

      {/* Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20">
        <div className="text-center mb-12 sm:mb-20">
          {/* Badge */}
          <FadeInSection delay={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6 lowercase">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ai-powered trip planning
            </div>
          </FadeInSection>

          {/* Headline */}
          <FadeInSection delay={100}>
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6 lowercase leading-tight">
              plan trips to live events
              <br />
              <span className="text-muted-foreground">in minutes</span>
            </h1>
          </FadeInSection>

          {/* Subtext */}
          <FadeInSection delay={200}>
            <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
              Tell seira about a concert, game, or show you want to attend.
              We&apos;ll find flights, hotels, and tickets — all in one conversation.
            </p>
          </FadeInSection>

          {/* CTA */}
          <FadeInSection delay={300}>
            <LandingCTA />
          </FadeInSection>
        </div>

        {/* Demo Preview */}
        <FadeInSection className="mb-16 sm:mb-24" delay={400}>
          <DemoPreview />
        </FadeInSection>

        {/* How it works */}
        <FadeInSection delay={100}>
          <HowItWorks />
        </FadeInSection>
      </main>

      {/* Footer */}
      <FadeInSection>
        <Footer />
      </FadeInSection>
    </div>
  )
}

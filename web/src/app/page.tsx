import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { HeroSection } from '@/components/marketing/hero-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { StepsSection } from '@/components/marketing/steps-section'
import { FeatureGridSection } from '@/components/marketing/feature-grid-section'
import { AudienceSection } from '@/components/marketing/audience-section'
import { SocialProofSection } from '@/components/marketing/social-proof-section'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'seira — commercial ops for live entertainment',
  description:
    'Track sponsor deliverables, collect proof of performance, and send polished recap reports. The fulfillment platform for sponsorship teams.',
  openGraph: {
    title: 'seira — commercial ops for live entertainment',
    description:
      'Track sponsor deliverables, collect proof of performance, and send polished recap reports.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen">
      <MarketingNav />
      <HeroSection />
      <FeaturesSection />
      <StepsSection />
      <FeatureGridSection />
      <AudienceSection />
      <SocialProofSection />
      <MarketingFooter />
    </main>
  )
}

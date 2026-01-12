import { Sparkles } from "lucide-react"
import { LandingHeader } from "@/components/landing-header"
import { LandingCTA } from "@/components/landing-cta"
import { DemoPreview } from "@/components/demo-preview"
import { HowItWorks } from "@/components/how-it-works"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col overflow-x-hidden">
      {/* Header */}
      <LandingHeader />

      {/* Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20">
        <div className="text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6 lowercase">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ai-powered trip planning
          </div>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6 lowercase leading-tight">
            plan trips to live events
            <br />
            <span className="text-muted-foreground">in minutes</span>
          </h1>

          <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
            Tell seira about a concert, game, or show you want to attend.
            We&apos;ll find flights, hotels, and tickets — all in one conversation.
          </p>

          <LandingCTA />
        </div>

        {/* Demo Preview */}
        <div className="mb-16 sm:mb-24">
          <DemoPreview />
        </div>

        {/* How it works */}
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}

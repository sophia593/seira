import Link from "next/link"
import { MessageSquare, Home, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span className="text-2xl font-semibold">seira</span>
        </div>

        {/* 404 indicator */}
        <div className="text-6xl sm:text-8xl font-bold text-muted-foreground/20 mb-4">
          404
        </div>

        {/* Message */}
        <h1 className="text-xl sm:text-2xl font-semibold mb-2 lowercase">
          oops, this page doesn&apos;t exist
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8">
          the page you&apos;re looking for has wandered off. let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="lowercase gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              go home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="lowercase gap-2">
            <Link href="/chat">
              start planning a trip
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground mt-8">
          need help?{" "}
          <a href="mailto:hello@seira.app" className="text-primary hover:underline">
            contact us
          </a>
        </p>
      </div>
    </div>
  )
}

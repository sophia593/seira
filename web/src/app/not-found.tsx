import Link from "next/link"
import { Home, ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-8 animate-in fade-in duration-500">
        <Logo />
      </div>

      <div className="text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <Link href="/contact" className="text-primary hover:underline">
            contact us
          </Link>
        </p>
      </div>
    </div>
  )
}

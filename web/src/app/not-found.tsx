import Link from "next/link"
import { Home, ArrowRight, CreditCard, Info, Mail } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

// =============================================================================
// Quick Links Data
// =============================================================================

const quickLinks = [
  { label: "pricing", href: "/pricing", icon: CreditCard },
  { label: "about", href: "/about", icon: Info },
  { label: "contact", href: "/contact", icon: Mail },
]

// =============================================================================
// Main Page
// =============================================================================

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

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Button asChild size="lg" className="lowercase gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              go home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="lowercase gap-2">
            <Link href="/search">
              start planning a trip
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <span>or try:</span>
          {quickLinks.map((link, index) => (
            <span key={link.href} className="flex items-center">
              <Link
                href={link.href}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted hover:text-foreground transition-colors lowercase"
              >
                <link.icon className="w-3 h-3" />
                {link.label}
              </Link>
              {index < quickLinks.length - 1 && (
                <span className="text-muted-foreground/50">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

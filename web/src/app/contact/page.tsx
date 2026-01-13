import { Metadata } from "next"
import { Logo } from "@/components/logo"
import {
  Mail,
  Instagram,
  HelpCircle,
  CreditCard,
  MessageCircle,
  Shield,
  ArrowRight,
  Handshake,
  Newspaper,
  Clock,
  MapPin
} from "lucide-react"
import Link from "next/link"

// =============================================================================
// Metadata
// =============================================================================

export const metadata: Metadata = {
  title: "contact | seira",
  description: "Get in touch with the Seira team for support, partnerships, or press inquiries.",
}

// =============================================================================
// Contact Methods Data
// =============================================================================

const contactMethods = [
  {
    icon: Mail,
    title: "support",
    description: "help, bugs, account issues",
    email: "support@seira.global",
    responseTime: "within 24 hours",
  },
  {
    icon: Handshake,
    title: "partnerships",
    description: "business inquiries, integrations",
    email: "partnerships@seira.global",
    responseTime: "within 48 hours",
  },
  {
    icon: Newspaper,
    title: "press",
    description: "media inquiries, interviews",
    email: "press@seira.global",
    responseTime: "within 48 hours",
  },
]

// =============================================================================
// Quick Links Data
// =============================================================================

const quickLinks = [
  {
    icon: HelpCircle,
    title: "faq",
    description: "common questions",
    href: "/pricing#faq",
  },
  {
    icon: CreditCard,
    title: "pricing",
    description: "plans & features",
    href: "/pricing",
  },
  {
    icon: MessageCircle,
    title: "start chatting",
    description: "plan a trip",
    href: "/login",
  },
  {
    icon: Shield,
    title: "privacy",
    description: "data & security",
    href: "/privacy",
  },
]

// =============================================================================
// Main Page
// =============================================================================

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-4xl mx-auto w-full">
        <Link href="/">
          <Logo className="text-lg sm:text-xl" />
        </Link>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          log in
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl font-semibold mb-2 lowercase">
            contact us
          </h1>
          <p className="text-muted-foreground">
            reach out to the right team for the fastest response.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="space-y-3 mb-8">
          {contactMethods.map((method) => (
            <a
              key={method.email}
              href={`mailto:${method.email}`}
              className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <method.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors lowercase">
                    {method.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {method.responseTime}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {method.email}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {method.description}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </a>
          ))}
        </div>

        {/* Social */}
        <div className="mb-10">
          <a
            href="https://instagram.com/seira.global"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground group-hover:text-primary transition-colors lowercase">
                instagram
              </div>
              <div className="text-sm text-muted-foreground">
                @seira.global
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </a>
        </div>

        {/* Business Hours */}
        <div className="rounded-2xl bg-muted/30 border p-5 mb-12">
          <h2 className="text-sm font-semibold mb-3 lowercase flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            business hours
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">monday – friday</span>
              <span className="font-medium">6:30 am – 6:30 pm pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">saturday – sunday</span>
              <span className="text-muted-foreground">closed</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>based in california, united states</span>
          </div>
        </div>

        {/* Before You Reach Out */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold mb-4 lowercase text-center text-muted-foreground">
            before you reach out
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="p-4 rounded-xl bg-card border hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <link.icon className="w-4 h-4 text-primary mb-2" />
                <div className="font-medium text-sm group-hover:text-primary transition-colors lowercase">
                  {link.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {link.description}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Legal Entity */}
        <div className="text-center text-xs text-muted-foreground mb-8">
          <p>Seira LLC</p>
        </div>

        {/* Back link */}
        <div className="pt-8 border-t border-border">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← back to home
          </Link>
        </div>
      </main>
    </div>
  )
}

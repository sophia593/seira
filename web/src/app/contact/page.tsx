import { Logo } from "@/components/logo"
import { Mail, Instagram, HelpCircle, CreditCard, MessageCircle, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"

// =============================================================================
// Quick Links Data
// =============================================================================

const quickLinks = [
  {
    icon: HelpCircle,
    title: "faq",
    description: "common questions answered",
    href: "/pricing#faq",
  },
  {
    icon: CreditCard,
    title: "pricing",
    description: "see our plans",
    href: "/pricing",
  },
  {
    icon: MessageCircle,
    title: "start chatting",
    description: "plan your next trip",
    href: "/login",
  },
  {
    icon: Shield,
    title: "privacy",
    description: "how we protect your data",
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
          <h1 className="text-2xl sm:text-4xl font-semibold mb-2 lowercase">contact us</h1>
          <p className="text-muted-foreground">
            have questions about seira? we'd love to hear from you.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="space-y-4 mb-12">
          <a
            href="mailto:support@seira.global"
            className="flex items-center gap-4 p-5 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground group-hover:text-primary transition-colors lowercase">
                email
              </div>
              <div className="text-sm text-muted-foreground">support@seira.global</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </a>

          <a
            href="https://instagram.com/seira.global"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground group-hover:text-primary transition-colors lowercase">
                instagram
              </div>
              <div className="text-sm text-muted-foreground">@seira.global</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </a>
        </div>

        {/* Response time */}
        <p className="text-sm text-muted-foreground text-center mb-12">
          we typically respond within 24 hours.
        </p>

        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold mb-4 lowercase text-center">
            quick links
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="p-4 rounded-xl bg-card border hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <link.icon className="w-5 h-5 text-primary mb-2" />
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

"use client"

import { useState } from "react"
import Link from "next/link"
import { Instagram, Mail, MapPin, ArrowRight, Loader2, Check, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

interface FooterLink {
  label: string
  href: string
  external?: boolean
  comingSoon?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

// =============================================================================
// Footer Links Data
// =============================================================================

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "product",
    links: [
      { label: "search", href: "/search" },
      { label: "pricing", href: "/pricing" },
      { label: "how it works", href: "/#how-it-works" },
    ],
  },
  {
    title: "company",
    links: [
      { label: "about", href: "/about" },
      { label: "contact", href: "/contact" },
      { label: "careers", href: "/careers", comingSoon: true },
    ],
  },
  {
    title: "legal",
    links: [
      { label: "privacy", href: "/privacy" },
      { label: "terms", href: "/terms" },
    ],
  },
]

// =============================================================================
// Social Links Data
// =============================================================================

const SOCIAL_LINKS = [
  {
    label: "Email",
    href: "mailto:support@seira.global",
    icon: Mail,
    ariaLabel: "Email support@seira.global",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/seira.global",
    icon: Instagram,
    ariaLabel: "Instagram @seira.global",
    external: true,
  },
]

// =============================================================================
// Brand Info
// =============================================================================

const BRAND = {
  tagline: "plan trips to live events, effortlessly",
  location: "california, usa",
  copyright: `© ${new Date().getFullYear()} seira`,
  entity: "Seira LLC",
}

// =============================================================================
// Newsletter Component
// =============================================================================

interface NewsletterState {
  status: "idle" | "loading" | "success" | "error"
  message: string
}

function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<NewsletterState>({
    status: "idle",
    message: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      setState({ status: "error", message: "please enter a valid email" })
      return
    }

    setState({ status: "loading", message: "" })

    // Simulate API call - replace with actual newsletter signup
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setState({ status: "success", message: "you're on the list!" })
      setEmail("")

      // Reset after 3 seconds
      setTimeout(() => {
        setState({ status: "idle", message: "" })
      }, 3000)
    } catch {
      setState({ status: "error", message: "something went wrong" })
    }
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-2 lowercase">stay updated</h3>
      <p className="text-xs text-muted-foreground mb-3">
        get travel tips and new features in your inbox.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={state.status === "loading" || state.status === "success"}
            className={cn(
              "w-full h-9 px-3 text-sm rounded-lg border bg-background",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              state.status === "error" && "border-destructive focus:ring-destructive/20"
            )}
          />
        </div>

        <button
          type="submit"
          disabled={state.status === "loading" || state.status === "success"}
          className={cn(
            "h-9 px-3 rounded-lg text-sm font-medium",
            "transition-all duration-200 active:scale-[0.97]",
            "disabled:cursor-not-allowed",
            state.status === "success"
              ? "bg-green-500 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {state.status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : state.status === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Status Message */}
      {state.message && (
        <p
          className={cn(
            "text-xs mt-2 transition-opacity duration-200",
            state.status === "error" ? "text-destructive" : "text-green-600 dark:text-green-400"
          )}
        >
          {state.message}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// Footer Link Component
// =============================================================================

interface FooterLinkItemProps {
  link: FooterLink
}

function FooterLinkItem({ link }: FooterLinkItemProps) {
  if (link.comingSoon) {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground/50 cursor-not-allowed">
        {link.label}
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          soon
        </span>
      </span>
    )
  }

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {link.label}
      </a>
    )
  }

  return (
    <Link
      href={link.href}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {link.label}
    </Link>
  )
}

// =============================================================================
// Footer Section Component
// =============================================================================

interface FooterSectionColumnProps {
  section: FooterSection
}

function FooterSectionColumn({ section }: FooterSectionColumnProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 lowercase">{section.title}</h3>
      <ul className="space-y-2 text-sm">
        {section.links.map((link) => (
          <li key={link.href}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// =============================================================================
// Social Links Component
// =============================================================================

function SocialLinks({ size = "default" }: { size?: "default" | "small" }) {
  const iconSize = size === "small" ? "w-4 h-4" : "w-4 h-4"
  const buttonSize = size === "small" ? "p-1.5" : "p-2"

  return (
    <div className="flex items-center gap-1">
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target={social.external ? "_blank" : undefined}
          rel={social.external ? "noopener noreferrer" : undefined}
          className={cn(
            buttonSize,
            "rounded-lg text-muted-foreground",
            "hover:text-foreground hover:bg-accent",
            "transition-all active:scale-[0.95]"
          )}
          aria-label={social.ariaLabel}
        >
          <social.icon className={iconSize} />
        </a>
      ))}
    </div>
  )
}

// =============================================================================
// Location Badge Component
// =============================================================================

function LocationBadge() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="w-3 h-3" />
      <span>{BRAND.location}</span>
    </div>
  )
}

// =============================================================================
// Main Footer Component
// =============================================================================

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-10">
          {/* Brand Column - Takes more space on larger screens */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <div className="mb-4">
              <Logo linkToHome={true} />
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {BRAND.tagline}
            </p>

            {/* Newsletter - Desktop */}
            <div className="hidden sm:block max-w-xs">
              <NewsletterSignup />
            </div>
          </div>

          {/* Link Columns */}
          {FOOTER_SECTIONS.map((section) => (
            <FooterSectionColumn key={section.title} section={section} />
          ))}
        </div>

        {/* Newsletter - Mobile */}
        <div className="sm:hidden mb-8 pb-8 border-b">
          <NewsletterSignup />
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          {/* Left Side - Copyright & Location */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <span>{BRAND.copyright}</span>
            <span className="hidden sm:inline">·</span>
            <LocationBadge />
          </div>

          {/* Right Side - Social Links */}
          <SocialLinks />
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// Minimal Footer (single line for auth pages, etc.)
// =============================================================================

export function FooterMinimal() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <span>{BRAND.copyright}</span>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-all active:scale-[0.97]"
            >
              privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-all active:scale-[0.97]"
            >
              terms
            </Link>
            <Link
              href="/contact"
              className="hover:text-foreground transition-all active:scale-[0.97]"
            >
              contact
            </Link>
          </div>

          {/* Social */}
          <SocialLinks size="small" />
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// Compact Footer (for app pages with less vertical space)
// =============================================================================

export function FooterCompact() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          {/* Left - Branding */}
          <div className="flex items-center gap-3">
            <Logo linkToHome={true} className="text-sm" />
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{BRAND.tagline}</span>
          </div>

          {/* Right - Essential Links */}
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              terms
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              contact
            </Link>
            <SocialLinks size="small" />
          </div>
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// Landing Page Footer (with extra CTA section)
// =============================================================================

export function FooterLanding() {
  return (
    <footer className="border-t bg-background">
      {/* CTA Section */}
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 lowercase">
              ready to plan your next adventure?
            </h2>
            <p className="text-muted-foreground mb-6">
              tell seira about an event you want to attend. we'll handle the rest.
            </p>
            <Link
              href="/signup"
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "px-6 py-3 rounded-lg",
                "bg-primary text-primary-foreground",
                "text-sm font-medium lowercase",
                "hover:bg-primary/90 transition-all",
                "active:scale-[0.98]"
              )}
            >
              get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-10">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <div className="mb-4">
              <Logo linkToHome={true} />
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {BRAND.tagline}
            </p>

            {/* Newsletter - Desktop */}
            <div className="hidden sm:block max-w-xs">
              <NewsletterSignup />
            </div>
          </div>

          {/* Link Columns */}
          {FOOTER_SECTIONS.map((section) => (
            <FooterSectionColumn key={section.title} section={section} />
          ))}
        </div>

        {/* Newsletter - Mobile */}
        <div className="sm:hidden mb-8 pb-8 border-b">
          <NewsletterSignup />
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          {/* Left Side */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <span>{BRAND.copyright}</span>
            <span className="hidden sm:inline">·</span>
            <LocationBadge />
          </div>

          {/* Right Side */}
          <SocialLinks />
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// Static Page Footer (for privacy, terms, etc.)
// =============================================================================

export function FooterStatic() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            home
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            about
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            pricing
          </Link>
          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            contact
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            privacy
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            terms
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo linkToHome={true} className="text-sm" />
            <span className="text-xs text-muted-foreground">{BRAND.copyright}</span>
          </div>

          <div className="flex items-center gap-3">
            <LocationBadge />
            <span className="text-muted-foreground">·</span>
            <SocialLinks size="small" />
          </div>
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// App Footer (for authenticated app pages - very minimal)
// =============================================================================

export function FooterApp() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{BRAND.copyright}</span>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              terms
            </Link>
            <a
              href="mailto:support@seira.global"
              className="hover:text-foreground transition-colors"
            >
              help
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// Footer with Back Link (for standalone pages)
// =============================================================================

interface FooterWithBackProps {
  backHref?: string
  backLabel?: string
}

export function FooterWithBack({
  backHref = "/",
  backLabel = "back to home",
}: FooterWithBackProps) {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>←</span>
            {backLabel}
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t mb-6" />

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{BRAND.copyright}</span>
            <LocationBadge />
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              terms
            </Link>
            <SocialLinks size="small" />
          </div>
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// Export all footer variants
// =============================================================================

export const FooterVariants = {
  Default: Footer,
  Minimal: FooterMinimal,
  Compact: FooterCompact,
  Landing: FooterLanding,
  Static: FooterStatic,
  App: FooterApp,
  WithBack: FooterWithBack,
} as const

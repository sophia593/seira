"use client"

import Link from "next/link"
import { Instagram, Mail } from "lucide-react"

// =============================================================================
// Constants
// =============================================================================

const BRAND = {
  copyright: `© ${new Date().getFullYear()} seira`,
}

const SOCIAL_LINKS = [
  { label: "Email", href: "mailto:support@seira.global", icon: Mail },
  { label: "Instagram", href: "https://instagram.com/seira.global", icon: Instagram, external: true },
]

// =============================================================================
// Social Links Component
// =============================================================================

function SocialLinks() {
  return (
    <div className="flex items-center gap-1">
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target={social.external ? "_blank" : undefined}
          rel={social.external ? "noopener noreferrer" : undefined}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          aria-label={social.label}
        >
          <social.icon className="w-4 h-4" />
        </a>
      ))}
    </div>
  )
}

// =============================================================================
// Minimal Footer (for auth pages, static pages)
// =============================================================================

export function FooterMinimal() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4 sm:gap-6">
            <span>{BRAND.copyright}</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              terms
            </Link>
          </div>
          <SocialLinks />
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
            <a href="mailto:support@seira.global" className="hover:text-foreground transition-colors">
              help
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// Default export (use FooterMinimal as default)
// =============================================================================

export const Footer = FooterMinimal

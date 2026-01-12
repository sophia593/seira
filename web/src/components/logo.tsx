import Link from "next/link"
import { cn } from "@/lib/utils"

type LogoVariant = "full" | "icon"

interface LogoProps {
  className?: string
  linkToHome?: boolean
  variant?: LogoVariant
}

// Globe SVG icon (Option A: Simple Globe)
function GlobeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Center vertical ellipse (meridian) */}
      <ellipse cx="12" cy="12" rx="4" ry="10" />
      {/* Horizontal line (equator) */}
      <path d="M2 12h20" />
    </svg>
  )
}

// Icon-only logo (for mobile headers, compact spaces)
export function LogoIcon({
  className,
  size = "default",
}: {
  className?: string
  size?: "sm" | "default" | "lg"
}) {
  const sizes = {
    sm: 20,
    default: 24,
    lg: 28,
  }

  return (
    <div className={className}>
      <GlobeIcon size={sizes[size]} />
    </div>
  )
}

// Full logo with text
export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <GlobeIcon size={24} />
      <span className="font-semibold text-lg lowercase">seira</span>
    </div>
  )
}

// Combined logo (icon + text) - alias for LogoFull
export function LogoCombined({
  className,
}: {
  className?: string
  iconSize?: "sm" | "default" | "lg"
  gap?: "sm" | "default"
}) {
  return <LogoFull className={className} />
}

// Main Logo component with variant support
export function Logo({
  className,
  linkToHome = true,
  variant = "full",
}: LogoProps) {
  const logoElement =
    variant === "icon" ? (
      <LogoIcon className={className} />
    ) : (
      <LogoFull className={className} />
    )

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-80 transition-opacity">
        {logoElement}
      </Link>
    )
  }

  return logoElement
}

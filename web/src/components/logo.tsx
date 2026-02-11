import Link from "next/link"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

type LogoVariant = "full" | "icon" | "badge"
type LogoColor = "default" | "muted" | "white" | "brand"
type LogoSize = "sm" | "default" | "lg"

interface LogoProps {
  className?: string
  linkToHome?: boolean
  variant?: LogoVariant
  color?: LogoColor
  animated?: boolean // Enable hover rotation
}

// =============================================================================
// Globe SVG Icon
// =============================================================================

interface GlobeIconProps {
  size?: number
  className?: string
  animated?: boolean
}

function GlobeIcon({ size = 24, className, animated = false }: GlobeIconProps) {
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
      className={cn(
        animated && "transition-transform duration-700 ease-out group-hover:rotate-[360deg]",
        className
      )}
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

// =============================================================================
// Color Variants
// =============================================================================

const colorVariants: Record<LogoColor, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  white: "text-white",
  brand: "",
}

// =============================================================================
// Size Config
// =============================================================================

const sizeConfig = {
  sm: {
    icon: 18,
    text: "text-sm",
    gap: "gap-1.5",
    badge: "px-2.5 py-1",
  },
  default: {
    icon: 24,
    text: "text-lg",
    gap: "gap-2",
    badge: "px-3 py-1.5",
  },
  lg: {
    icon: 28,
    text: "text-xl",
    gap: "gap-2.5",
    badge: "px-4 py-2",
  },
}

// =============================================================================
// LogoIcon — Icon Only
// =============================================================================

export function LogoIcon({
  className,
  size = "default",
  color = "default",
  animated = false,
}: {
  className?: string
  size?: LogoSize
  color?: LogoColor
  animated?: boolean
}) {
  return (
    <div className={cn("group", colorVariants[color], className)}>
      <GlobeIcon size={sizeConfig[size].icon} animated={animated} />
    </div>
  )
}

// =============================================================================
// LogoFull — Icon + Text
// =============================================================================

export function LogoFull({
  className,
  size = "default",
  color = "default",
  animated = false,
}: {
  className?: string
  size?: LogoSize
  color?: LogoColor
  animated?: boolean
}) {
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        "group flex items-center",
        config.gap,
        colorVariants[color],
        className
      )}
    >
      <GlobeIcon size={config.icon} animated={animated} className={color === "brand" ? "text-copper" : undefined} />
      <span className={cn("font-semibold lowercase", config.text, color === "brand" && "text-white")}>seira</span>
    </div>
  )
}

// =============================================================================
// LogoBadge — Logo in a Pill Container
// =============================================================================

export function LogoBadge({
  className,
  size = "default",
  color = "default",
  animated = false,
  variant = "outline",
}: {
  className?: string
  size?: LogoSize
  color?: LogoColor
  animated?: boolean
  variant?: "outline" | "filled" | "ghost"
}) {
  const config = sizeConfig[size]

  const badgeVariants = {
    outline: "border bg-background/50 backdrop-blur-sm",
    filled: "bg-primary text-primary-foreground",
    ghost: "bg-muted/50",
  }

  return (
    <div
      className={cn(
        "group inline-flex items-center rounded-full",
        config.gap,
        config.badge,
        badgeVariants[variant],
        variant !== "filled" && colorVariants[color],
        className
      )}
    >
      <GlobeIcon size={config.icon} animated={animated} />
      <span className={cn("font-semibold lowercase", config.text)}>seira</span>
    </div>
  )
}

// =============================================================================
// LogoCombined — Alias for LogoFull (backward compatibility)
// =============================================================================

export function LogoCombined({
  className,
  size = "default",
  color = "default",
  animated = false,
}: {
  className?: string
  iconSize?: LogoSize
  size?: LogoSize
  gap?: "sm" | "default"
  color?: LogoColor
  animated?: boolean
}) {
  return <LogoFull className={className} size={size} color={color} animated={animated} />
}

// =============================================================================
// Main Logo Component
// =============================================================================

export function Logo({
  className,
  linkToHome = true,
  variant = "full",
  color = "default",
  animated = true, // Hover rotation enabled by default
}: LogoProps) {
  // Render the appropriate logo variant
  const logoElement = (() => {
    switch (variant) {
      case "icon":
        return <LogoIcon className={className} color={color} animated={animated} />
      case "badge":
        return <LogoBadge className={className} color={color} animated={animated} />
      case "full":
      default:
        return <LogoFull className={className} color={color} animated={animated} />
    }
  })()

  // Wrap in link if needed
  if (linkToHome) {
    return (
      <Link
        href="/"
        className="group inline-flex hover:opacity-90 transition-opacity"
      >
        {logoElement}
      </Link>
    )
  }

  return <span className="group inline-flex">{logoElement}</span>
}

// =============================================================================
// Exports for Direct Use
// =============================================================================

export { GlobeIcon }

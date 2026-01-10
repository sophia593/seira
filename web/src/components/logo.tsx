import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type LogoVariant = "full" | "icon"

interface LogoProps {
  className?: string
  linkToHome?: boolean
  variant?: LogoVariant
}

// Icon-only logo (for mobile headers, compact spaces)
export function LogoIcon({
  className,
  size = "default",
}: {
  className?: string
  size?: "sm" | "default" | "lg"
}) {
  const sizeClasses = {
    sm: "h-7 w-7",
    default: "h-9 w-9",
    lg: "h-10 w-10",
  }

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-primary text-primary-foreground",
        sizeClasses[size],
        className
      )}
    >
      <MessageSquare className={iconSizes[size]} />
    </div>
  )
}

// Full logo with text
export function LogoFull({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-xl font-semibold tracking-tight lowercase",
        className
      )}
    >
      seira
    </span>
  )
}

// Combined logo (icon + text)
export function LogoCombined({
  className,
  iconSize = "default",
  gap = "default",
}: {
  className?: string
  iconSize?: "sm" | "default" | "lg"
  gap?: "sm" | "default"
}) {
  const gapClasses = {
    sm: "gap-2",
    default: "gap-3",
  }

  return (
    <div className={cn("flex items-center", gapClasses[gap], className)}>
      <LogoIcon size={iconSize} />
      <LogoFull />
    </div>
  )
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

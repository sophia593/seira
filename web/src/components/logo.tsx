import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  linkToHome?: boolean
}

export function Logo({ className, linkToHome = true }: LogoProps) {
  const logoElement = (
    <span
      className={cn(
        "text-xl font-semibold tracking-tight",
        className
      )}
    >
      seira
    </span>
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

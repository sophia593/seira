import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

// =============================================================================
// Constants
// =============================================================================

const AVATAR_COLORS = [
  "#6366F1", "#3B82F6", "#10B981", "#F59E0B",
  "#EC4899", "#8B5CF6", "#14B8A6", "#F97316",
]

const SIZE_CONFIG = {
  sm: { diameter: 24, className: "size-6", fontSize: 10 },
  md: { diameter: 32, className: "size-8", fontSize: 13 },
  lg: { diameter: 48, className: "size-12", fontSize: 18 },
} as const

// =============================================================================
// Helpers
// =============================================================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function hashName(name: string): string {
  let sum = 0
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i)
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

// =============================================================================
// Avatar
// =============================================================================

interface AvatarProps {
  src?: string | null
  name: string
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

function Avatar({
  src,
  name,
  size = "md",
  color,
  className,
}: AvatarProps) {
  const config = SIZE_CONFIG[size]
  const bgColor = color || hashName(name)

  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        config.className,
        className
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="aspect-square size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex size-full items-center justify-center rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        <span
          className="font-semibold text-white leading-none select-none"
          style={{ fontSize: config.fontSize }}
        >
          {getInitials(name)}
        </span>
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

// =============================================================================
// AvatarGroup
// =============================================================================

interface AvatarGroupProps {
  people: { src?: string; name: string; color?: string }[]
  size?: "sm" | "md" | "lg"
  max?: number
  className?: string
}

function AvatarGroup({
  people,
  size = "md",
  max = 4,
  className,
}: AvatarGroupProps) {
  const showOverflow = people.length > max
  const visible = showOverflow ? people.slice(0, max - 1) : people
  const remaining = people.length - visible.length
  const overflowPeople = showOverflow ? people.slice(max - 1) : []

  const config = SIZE_CONFIG[size]

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((person, i) => (
        <Avatar
          key={i}
          src={person.src}
          name={person.name}
          size={size}
          color={person.color}
          className={cn(
            "ring-2 ring-white",
            i > 0 && "-ml-2"
          )}
        />
      ))}
      {showOverflow && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "flex items-center justify-center rounded-full shrink-0",
                "bg-[#71717A] text-white font-semibold select-none cursor-default",
                "ring-2 ring-white -ml-2",
                config.className
              )}
              style={{ fontSize: config.fontSize }}
            >
              +{remaining}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex flex-col gap-0.5">
              {overflowPeople.map((person, i) => (
                <span key={i}>{person.name}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export { Avatar, AvatarGroup, getInitials }
export type { AvatarProps, AvatarGroupProps }

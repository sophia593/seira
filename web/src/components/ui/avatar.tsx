import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "size-6 text-xs",
        default: "size-8 text-sm",
        lg: "size-10 text-base",
        xl: "size-12 text-lg",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface AvatarProps
  extends React.ComponentProps<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

function Avatar({ className, size, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(avatarVariants({ size, className }))}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted text-muted-foreground flex size-full items-center justify-center font-medium",
        className
      )}
      {...props}
    />
  )
}

// Helper: Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Pre-styled assistant avatar
function AvatarAssistant({
  size,
  className,
}: VariantProps<typeof avatarVariants> & { className?: string }) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className="bg-primary text-primary-foreground">
        S
      </AvatarFallback>
    </Avatar>
  )
}

// Pre-styled user avatar with automatic fallback
interface AvatarUserProps extends VariantProps<typeof avatarVariants> {
  src?: string | null
  name?: string | null
  className?: string
}

function AvatarUser({ src, name, size, className }: AvatarUserProps) {
  return (
    <Avatar size={size} className={className}>
      {src && <AvatarImage src={src} alt={name ?? "User"} />}
      <AvatarFallback>
        {name ? getInitials(name) : "U"}
      </AvatarFallback>
    </Avatar>
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarAssistant,
  AvatarUser,
  getInitials,
}
export type { AvatarProps, AvatarUserProps }

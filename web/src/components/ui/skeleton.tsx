import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

function SkeletonText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn("h-4 w-full", className)}
      {...props}
    />
  )
}

interface SkeletonAvatarProps extends React.ComponentProps<"div"> {
  size?: "sm" | "default" | "lg" | "xl"
}

function SkeletonAvatar({ size = "default", className, ...props }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "size-6",
    default: "size-8",
    lg: "size-10",
    xl: "size-12",
  }

  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
      {...props}
    />
  )
}

function SkeletonButton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn("h-9 w-20 rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton }

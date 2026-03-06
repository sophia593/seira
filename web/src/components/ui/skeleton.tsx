import { cn } from "@/lib/utils"

// =============================================================================
// Skeleton
// =============================================================================

interface SkeletonProps extends React.ComponentProps<"div"> {
  width?: string
  height?: string
  circle?: boolean
  variant?: "light" | "dark"
}

function Skeleton({
  width,
  height,
  circle = false,
  variant = "light",
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        variant === "light" ? "bg-[#E4E4E7]" : "bg-[#1A1D27]",
        circle ? "rounded-full" : "rounded-[4px]",
        className
      )}
      style={{
        width: width ?? (className ? undefined : "100%"),
        height: height ?? (className ? undefined : "16px"),
        animation: "skeletonPulse 1.8s ease-in-out infinite",
        ...style,
      }}
      {...props}
    />
  )
}

// =============================================================================
// SkeletonText
// =============================================================================

interface SkeletonTextProps {
  lines?: number
  variant?: "light" | "dark"
  className?: string
}

function SkeletonText({
  lines = 3,
  variant = "light",
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height="16px"
          variant={variant}
        />
      ))}
    </div>
  )
}

// =============================================================================
// SkeletonCard
// =============================================================================

interface SkeletonCardProps {
  variant?: "light" | "dark"
  className?: string
}

function SkeletonCard({ variant = "light", className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-[4px] border border-[#E4E4E7] p-4 space-y-3",
        className
      )}
    >
      <Skeleton width="100%" height="120px" variant={variant} />
      <Skeleton width="60%" height="16px" variant={variant} />
      <Skeleton width="40%" height="13px" variant={variant} />
      <Skeleton width="80%" height="13px" variant={variant} />
    </div>
  )
}

// =============================================================================
// SkeletonTableRow
// =============================================================================

interface SkeletonTableRowProps {
  variant?: "light" | "dark"
  className?: string
}

function SkeletonTableRow({
  variant = "light",
  className,
}: SkeletonTableRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 h-12 px-3",
        className
      )}
    >
      <Skeleton width="24px" height="24px" circle variant={variant} />
      <Skeleton width="120px" height="13px" variant={variant} />
      <Skeleton width="100px" height="13px" variant={variant} />
      <Skeleton width="60px" height="13px" variant={variant} />
      <Skeleton width="80px" height="13px" variant={variant} />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTableRow }
export type { SkeletonProps, SkeletonTextProps, SkeletonCardProps, SkeletonTableRowProps }

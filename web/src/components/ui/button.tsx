import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// =============================================================================
// Variants
// =============================================================================

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[4px] font-medium cursor-pointer",
    "transition-[background-color,color] duration-150 ease-in-out",
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
    "outline-none shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-[#C4363A] text-white hover:bg-[#D44448]",
        secondary:
          "bg-white text-[#18181B] border border-[#E4E4E7] hover:bg-[#F4F4F5]",
        ghost:
          "bg-transparent text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]",
        danger: "bg-[#E5484D] text-white hover:bg-[#D13438]",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-4 text-[14px]",
        lg: "h-10 px-5 text-[14px]",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

// =============================================================================
// Spinner
// =============================================================================

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-4 border-2 border-current border-t-transparent rounded-full animate-spin",
        className
      )}
    />
  )
}

// =============================================================================
// Icon size map
// =============================================================================

const ICON_SIZES: Record<string, number> = {
  sm: 16,
  md: 18,
  lg: 18,
}

// =============================================================================
// Button
// =============================================================================

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ElementType
  rightIcon?: React.ElementType
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild && !isLoading ? Slot : "button"
    const iconSize = ICON_SIZES[size ?? "md"]
    const hasChildren = React.Children.count(children) > 0
    const isIconOnly = !hasChildren && (LeftIcon || RightIcon)

    return (
      <Comp
        ref={ref}
        data-slot="button"
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants({ variant, size, fullWidth, className }),
          isIconOnly && "aspect-square px-0",
          isLoading && "relative"
        )}
        {...props}
      >
        {isLoading ? (
          <>
            {/* Invisible content to maintain width */}
            <span className="invisible flex items-center gap-2">
              {LeftIcon && <LeftIcon style={{ width: iconSize, height: iconSize }} />}
              {children}
              {RightIcon && <RightIcon style={{ width: iconSize, height: iconSize }} />}
            </span>
            {/* Spinner overlay */}
            <span className="absolute inset-0 flex items-center justify-center gap-2">
              <Spinner />
              {loadingText && <span>{loadingText}</span>}
            </span>
          </>
        ) : (
          <>
            {LeftIcon && (
              <LeftIcon
                style={{ width: iconSize, height: iconSize }}
                className="shrink-0"
              />
            )}
            {children}
            {RightIcon && (
              <RightIcon
                style={{ width: iconSize, height: iconSize }}
                className="shrink-0"
              />
            )}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }

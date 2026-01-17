import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl text-sm font-medium lowercase",
    // Apple-ish: calm transitions (avoid transition-all)
    "transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none",
    // Clean focus
    "focus-visible:ring-[3px] focus-visible:ring-ring/30",
    "focus-visible:border focus-visible:border-ring/40",
    "aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary CTA: subtle "premium" depth, not bouncy
        default: cn(
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
          // slight depth only on hover (option 1C, subtle)
          "hover:shadow-sm",
          // tiny press effect (not scale, feels less toy-ish)
          "active:translate-y-px"
        ),

        // Quiet secondary button (option 1B)
        soft: cn(
          "bg-muted text-foreground",
          "hover:bg-muted/80",
          "active:translate-y-px"
        ),

        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",

        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:translate-y-px",

        // Ghost stays calm; no scale, no shadow
        ghost: "hover:bg-accent hover:text-foreground dark:hover:bg-accent/50",

        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-11", // 44px touch target
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  // Don't allow asChild when loading (we need to control the content)
  const Comp = asChild && !isLoading ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={isLoading || undefined}
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }

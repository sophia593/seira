import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm transition-all duration-200 outline-none",
        // Colors
        "border-gray-300",
        "placeholder:text-muted-foreground",
        "selection:bg-primary selection:text-primary-foreground",
        // Focus
        "focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10",
        // Error (aria-invalid)
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Autofill - prevents Chrome's blue/yellow background from breaking design
        "autofill:shadow-[inset_0_0_0_1000px_hsl(var(--background))] dark:autofill:shadow-[inset_0_0_0_1000px_hsl(var(--input)/0.3)]",
        "autofill:[-webkit-text-fill-color:hsl(var(--foreground))]",
        className
      )}
      {...props}
    />
  )
}

export { Input }

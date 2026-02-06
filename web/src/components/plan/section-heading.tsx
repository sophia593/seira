import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  title: string
  meta?: string // e.g. date, night count — shown in mono
  className?: string
}

export function SectionHeading({ title, meta, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-baseline gap-3 mb-8", className)}>
      <h2 className="text-xl sm:text-2xl font-semibold lowercase tracking-tight">
        {title}
      </h2>
      {meta && (
        <span className="text-data text-xs text-muted-foreground/50">
          {meta}
        </span>
      )}
    </div>
  )
}

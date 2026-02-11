export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-56 bg-muted rounded animate-pulse mt-2" />
      </div>

      {/* Stats row */}
      <div className="flex items-start divide-x divide-border mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 px-4 first:pl-0 last:pr-0 space-y-2">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-14 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Upcoming Events */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-44 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                </div>
                <div className="w-20 h-1.5 bg-muted rounded-full animate-pulse" />
                <div className="w-8 h-3 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Attention */}
        <div className="lg:col-span-2">
          <div className="mb-3">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-56 bg-muted rounded animate-pulse mt-2" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 p-4 shadow-sm space-y-2"
          >
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-4 w-44 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="h-3 w-36 bg-muted rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-muted rounded-full animate-pulse" />
                  <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Overdue + Needs Proof */}
        <div className="space-y-8">
          {/* Overdue */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/50 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Proof */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <div className="h-5 w-36 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/50 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                    <div className="h-5 w-14 bg-muted rounded-full animate-pulse" />
                  </div>
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EventsLoading() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-4 py-3 ${
              i < 4 ? 'border-b border-border' : ''
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
            </div>
            <div className="hidden sm:block h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="hidden sm:block h-3 w-28 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EventsLoading() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-4 w-36 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

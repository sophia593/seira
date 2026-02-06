import { sampleEvents } from "@/lib/sample-data"

export default function EventsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <h1 className="text-4xl lg:text-5xl font-semibold lowercase tracking-tight text-center mb-4 leading-tight">
        find your next event
      </h1>
      <p className="text-base text-muted-foreground/70 text-center max-w-lg leading-relaxed">
        search across sports, music, theater, festivals, and film
      </p>

      {/* Sample events grid to verify data + font treatment */}
      <div className="mt-16 w-full max-w-3xl grid gap-4">
        {sampleEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between rounded-2xl border-0 bg-card/50 hover:bg-card transition-colors duration-200 px-6 py-5 group cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-base font-semibold lowercase tracking-tight truncate mb-1 group-hover:text-foreground/90 transition-colors">
                {event.name}
              </p>
              <p className="text-sm text-muted-foreground/60">
                {event.venue.city}, {event.venue.state}
              </p>
            </div>
            <div className="text-right shrink-0 ml-6">
              <p className="text-data text-sm font-medium">{event.date}</p>
              <p className="text-data text-xs text-muted-foreground/60 mt-0.5">
                {event.startTime}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

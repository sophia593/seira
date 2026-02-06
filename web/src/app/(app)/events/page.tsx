import { sampleEvents } from "@/lib/sample-data"

export default function EventsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-page-title text-center mb-3">find your next event</h1>
      <p className="text-muted-body text-center max-w-md">
        search across sports, music, theater, festivals, and film
      </p>

      {/* Sample events grid to verify data + font treatment */}
      <div className="mt-10 w-full max-w-2xl grid gap-3">
        {sampleEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-card-title truncate">{event.name}</p>
              <p className="text-muted-body">
                {event.venue.city}, {event.venue.state}
              </p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-data text-sm">{event.date}</p>
              <p className="text-data text-xs text-muted-foreground">
                {event.startTime}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

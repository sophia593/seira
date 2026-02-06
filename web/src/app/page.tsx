import { sampleEvents } from "@/lib/sample-data"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-page-title text-center mb-3">
        discover events worth traveling for
      </h1>
      <p className="text-muted-body text-center max-w-md">
        pick a live event, enter your city, and get a complete trip plan
      </p>

      {/* Sample event count to verify data loads */}
      <p className="mt-8 text-label">
        <span className="text-data">{sampleEvents.length}</span> events loaded
      </p>
    </div>
  )
}

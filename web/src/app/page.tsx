import { sampleEvents } from "@/lib/sample-data"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-5xl lg:text-6xl font-semibold lowercase tracking-tight text-center mb-5 leading-tight max-w-3xl">
        discover events worth traveling for
      </h1>
      <p className="text-lg text-muted-foreground/70 text-center max-w-xl leading-relaxed">
        pick a live event, enter your city, and get a complete trip plan
      </p>

      {/* Sample event count to verify data loads */}
      <p className="mt-12 text-label">
        <span className="text-data">{sampleEvents.length}</span> events loaded
      </p>
    </div>
  )
}

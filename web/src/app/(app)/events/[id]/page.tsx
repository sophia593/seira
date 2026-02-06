export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <h1 className="text-4xl lg:text-5xl font-semibold lowercase tracking-tight text-center mb-4 leading-tight">
        plan your trip
      </h1>
      <p className="text-base text-muted-foreground/70 text-center max-w-lg leading-relaxed">
        choose flights, hotels, and ground transport for this event
      </p>
      <p className="mt-10 text-label">
        event <span className="text-data">{id}</span>
      </p>
    </div>
  )
}

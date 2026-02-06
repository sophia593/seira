export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">
        plan your trip
      </h1>
      <p className="text-muted-foreground text-base">
        event <span className="font-mono data-value">{id}</span> — choose your origin and build your plan
      </p>
    </div>
  )
}

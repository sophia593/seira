export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">
        your complete plan
      </h1>
      <p className="text-muted-foreground text-base">
        plan <span className="font-mono data-value">{id}</span> — flights, hotels, transport, and timing
      </p>
    </div>
  )
}

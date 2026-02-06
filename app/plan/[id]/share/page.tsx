export default async function SharePlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">
        shared trip plan
      </h1>
      <p className="text-muted-foreground text-base">
        viewing shared plan <span className="font-mono data-value">{id}</span>
      </p>
    </div>
  )
}

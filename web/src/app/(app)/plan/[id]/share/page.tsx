export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-page-title text-center mb-3">shared trip plan</h1>
      <p className="text-muted-body text-center max-w-md">
        view a shared trip plan with flights, hotels, and cost breakdown
      </p>
      <p className="mt-6 text-label">
        plan <span className="text-data">{id}</span>
      </p>
    </div>
  )
}

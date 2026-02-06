import { samplePlan } from "@/lib/sample-data"

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const plan = samplePlan

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-page-title text-center mb-3">your complete plan</h1>
      <p className="text-muted-body text-center max-w-md">
        flights, hotels, transport, cost estimate, and constraint analysis
      </p>

      {/* Sample data preview */}
      <div className="mt-10 w-full max-w-lg space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-label mb-1">event</p>
          <p className="text-card-title">{plan.event.name}</p>
          <p className="text-data text-sm mt-1">
            {plan.event.date} &middot; {plan.event.startTime} {plan.event.timezone}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-label mb-1">origin</p>
          <p className="text-card-title">
            {plan.origin.city}, {plan.origin.state}
          </p>
          <p className="text-data text-sm mt-1">{plan.origin.airportCode}</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-label mb-1">cost estimate</p>
          <p className="text-data text-lg">
            ${plan.costEstimate.min}&ndash;${plan.costEstimate.max}
          </p>
          <div className="mt-2 space-y-1">
            {plan.costEstimate.breakdown.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.category}</span>
                <span className="text-data">
                  ${item.min}&ndash;${item.max}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-label mb-2">outbound flights</p>
          <div className="space-y-2">
            {plan.flights.outbound.map((flight) => (
              <div
                key={flight.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="text-data">{flight.flightNumber}</span>
                  <span className="text-muted-foreground ml-2">
                    {flight.airline}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      flight.timingTag.severity === "comfortable"
                        ? "badge-safe"
                        : flight.timingTag.severity === "tight"
                          ? "badge-risky"
                          : "badge-impossible"
                    }`}
                  >
                    {flight.timingTag.label}
                  </span>
                  <span className="text-data">${flight.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-label mb-2">constraint flags</p>
          <div className="space-y-2">
            {plan.constraintFlags.map((flag) => (
              <div
                key={flag.id}
                className={`text-xs font-medium px-3 py-2 rounded-lg ${
                  flag.severity === "danger"
                    ? "badge-impossible"
                    : flag.severity === "warning"
                      ? "badge-risky"
                      : "badge-safe"
                }`}
              >
                {flag.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-label">
        plan <span className="text-data">{id}</span>
      </p>
    </div>
  )
}

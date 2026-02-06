import { samplePlan } from "@/lib/sample-data"
import { FeasibilityBadge } from "@/components/ui/feasibility-badge"

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const plan = samplePlan

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <h1 className="text-4xl lg:text-5xl font-semibold lowercase tracking-tight text-center mb-4 leading-tight">
        your complete plan
      </h1>
      <p className="text-base text-muted-foreground/70 text-center max-w-lg leading-relaxed">
        flights, hotels, transport, cost estimate, and constraint analysis
      </p>

      {/* Sample data preview */}
      <div className="mt-16 w-full max-w-2xl space-y-6">
        <div className="rounded-2xl border-0 bg-card/50 p-6">
          <p className="text-label mb-3">event</p>
          <p className="text-lg font-semibold lowercase tracking-tight mb-2">
            {plan.event.name}
          </p>
          <p className="text-data text-sm mt-2 text-muted-foreground/70">
            {plan.event.date} &middot; {plan.event.startTime} {plan.event.timezone}
          </p>
        </div>

        <div className="rounded-2xl border-0 bg-card/50 p-6">
          <p className="text-label mb-3">origin</p>
          <p className="text-lg font-semibold lowercase tracking-tight mb-2">
            {plan.origin.city}, {plan.origin.state}
          </p>
          <p className="text-data text-sm mt-2 text-muted-foreground/70">
            {plan.origin.airportCode}
          </p>
        </div>

        <div className="rounded-2xl border-0 bg-card/50 p-6">
          <p className="text-label mb-3">cost estimate</p>
          <p className="text-data text-2xl font-medium mb-6">
            ${plan.costEstimate.min}&ndash;${plan.costEstimate.max}
          </p>
          <div className="mt-4 space-y-3">
            {plan.costEstimate.breakdown.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground/60 lowercase">
                  {item.category}
                </span>
                <span className="text-data font-medium">
                  ${item.min}&ndash;${item.max}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-0 bg-card/50 p-6">
          <p className="text-label mb-4">outbound flights</p>
          <div className="space-y-4">
            {plan.flights.outbound.map((flight) => (
              <div
                key={flight.id}
                className="flex items-center justify-between text-sm py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-data font-medium">
                    {flight.flightNumber}
                  </span>
                  <span className="text-muted-foreground/50 text-xs lowercase">
                    {flight.airline}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <FeasibilityBadge
                    label={flight.timingTag.label}
                    severity={
                      flight.timingTag.severity === "comfortable"
                        ? "comfortable"
                        : flight.timingTag.severity === "tight"
                          ? "tight"
                          : "risky"
                    }
                  />
                  <span className="text-data font-medium">${flight.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-0 bg-card/50 p-6">
          <p className="text-label mb-4">constraint flags</p>
          <div className="space-y-3">
            {plan.constraintFlags.map((flag) => (
              <div
                key={flag.id}
                className={`text-xs font-medium px-4 py-3 rounded-xl ${
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

      <p className="mt-10 text-label">
        plan <span className="text-data">{id}</span>
      </p>
    </div>
  )
}

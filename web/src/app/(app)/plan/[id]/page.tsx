import { Suspense } from "react"
import { samplePlan } from "@/lib/sample-data"
import { PlanView } from "@/components/plan/plan-view"
import { PlanSkeleton } from "@/components/plan/plan-skeleton"

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // In production this would fetch from the API using the plan id.
  // For now we use the sample plan data.
  const plan = samplePlan

  return (
    <Suspense fallback={<PlanSkeleton />}>
      <PlanView plan={plan} />
    </Suspense>
  )
}

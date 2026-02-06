import { Skeleton } from "@/components/ui/skeleton"

export function PlanSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      {/* Event anchor skeleton */}
      <div className="mb-16">
        <Skeleton className="h-5 w-16 rounded-full mb-6" />
        <Skeleton className="h-12 sm:h-16 w-3/4 rounded-xl mb-4" />
        <Skeleton className="h-12 sm:h-16 w-1/2 rounded-xl mb-8" />
        <div className="flex flex-wrap gap-6 mb-8">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-5 w-44 rounded" />
        </div>
        <Skeleton className="h-9 w-56 rounded-full" />
      </div>

      {/* Danger banner skeleton */}
      <Skeleton className="h-14 w-full rounded-2xl mb-12" />

      {/* Getting there section */}
      <div className="mb-16">
        <Skeleton className="h-4 w-40 rounded mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Getting home section */}
      <div className="mb-16">
        <Skeleton className="h-4 w-36 rounded mb-8" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Hotels section */}
      <div className="mb-16">
        <Skeleton className="h-4 w-48 rounded mb-8" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Transport section */}
      <div className="mb-16">
        <Skeleton className="h-4 w-32 rounded mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Cost section */}
      <div>
        <Skeleton className="h-4 w-40 rounded mb-8" />
        <Skeleton className="h-14 w-64 rounded-xl mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

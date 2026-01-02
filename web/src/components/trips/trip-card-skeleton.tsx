import { Skeleton, SkeletonText } from "@/components/ui/skeleton"

function TripCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <SkeletonText className="w-2/3 h-5" />
        <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
      </div>
      <SkeletonText className="w-1/2 h-4" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <SkeletonText className="w-32 h-3" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <SkeletonText className="w-24 h-3" />
        </div>
      </div>
      <div className="pt-3 border-t border-border/50">
        <SkeletonText className="w-20 h-4" />
      </div>
    </div>
  )
}

interface TripListSkeletonProps {
  count?: number
}

function TripListSkeleton({ count = 4 }: TripListSkeletonProps) {
  return (
    <div className="space-y-8">
      {/* Upcoming section */}
      <div>
        <Skeleton className="h-5 w-20 mb-4 rounded" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: Math.min(count, 2) }).map((_, i) => (
            <TripCardSkeleton key={`upcoming-${i}`} />
          ))}
        </div>
      </div>

      {/* Past section (if count > 2) */}
      {count > 2 && (
        <div>
          <Skeleton className="h-5 w-12 mb-4 rounded" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: count - 2 }).map((_, i) => (
              <TripCardSkeleton key={`past-${i}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { TripCardSkeleton, TripListSkeleton }

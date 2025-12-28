import { Skeleton, SkeletonText } from "@/components/ui/skeleton"

function TripCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <SkeletonText className="w-2/3 h-5" />
      <SkeletonText className="w-1/2 h-4" />
      <div className="flex items-center justify-between pt-2">
        <SkeletonText className="w-24 h-3" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

interface TripListSkeletonProps {
  count?: number
}

function TripListSkeleton({ count = 3 }: TripListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  )
}

export { TripCardSkeleton, TripListSkeleton }

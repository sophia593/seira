import { Skeleton, SkeletonAvatar, SkeletonText } from "@/components/ui/skeleton"

function MessageSkeleton() {
  return (
    <div className="flex gap-3">
      <SkeletonAvatar size="sm" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-3/4" />
        <SkeletonText className="w-1/2" />
      </div>
    </div>
  )
}

interface MessageListSkeletonProps {
  count?: number
}

function MessageListSkeleton({ count = 3 }: MessageListSkeletonProps) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  )
}

export { MessageSkeleton, MessageListSkeleton }

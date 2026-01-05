import { Skeleton, SkeletonText, SkeletonAvatar } from "@/components/ui/skeleton"

function UserMessageSkeleton() {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-2">
        <SkeletonText className="w-48 h-4 ml-auto" />
        <SkeletonText className="w-32 h-4 ml-auto" />
      </div>
    </div>
  )
}

function AssistantMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <SkeletonAvatar size="sm" className="shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-3/4 h-4" />
        <SkeletonText className="w-full h-4" />
        <SkeletonText className="w-2/3 h-4" />
      </div>
    </div>
  )
}

interface MessageListSkeletonProps {
  count?: number
}

export function MessageListSkeleton({ count = 3 }: MessageListSkeletonProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {i % 2 === 0 ? <UserMessageSkeleton /> : <AssistantMessageSkeleton />}
        </div>
      ))}
    </div>
  )
}

export { UserMessageSkeleton, AssistantMessageSkeleton }

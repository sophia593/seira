import { SkeletonText } from "@/components/ui/skeleton"

function ConversationItemSkeleton() {
  return (
    <div className="p-3 space-y-2">
      <SkeletonText className="w-3/4 h-4" />
      <SkeletonText className="w-1/2 h-3" />
    </div>
  )
}

interface ConversationListSkeletonProps {
  count?: number
}

function ConversationListSkeleton({ count = 5 }: ConversationListSkeletonProps) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <ConversationItemSkeleton key={i} />
      ))}
    </div>
  )
}

export { ConversationItemSkeleton, ConversationListSkeleton }

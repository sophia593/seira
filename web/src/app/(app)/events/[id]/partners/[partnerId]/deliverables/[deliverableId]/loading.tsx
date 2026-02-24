export default function DeliverableDetailLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Back link */}
      <div className={`h-4 w-28 ${s} mb-4`} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className={`h-7 w-52 ${s}`} />
            <div className="flex items-center gap-2">
              <div className={`h-5 w-20 rounded-full ${s}`} />
              <div className={`h-5 w-24 rounded-full ${s}`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-16 ${s}`} />
            <div className={`h-8 w-18 ${s}`} />
          </div>
        </div>
        {/* Metadata strip */}
        <div className="flex items-center gap-4 mt-4">
          <div className={`h-3 w-24 ${s}`} />
          <div className={`h-3 w-28 ${s}`} />
          <div className={`h-3 w-20 ${s}`} />
        </div>
      </div>

      {/* Status History */}
      <div className="mb-8">
        <div className={`h-4 w-28 ${s} mb-3`} />
        <div className="pl-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${s}`} />
              <div className={`h-3 w-32 ${s}`} />
              <div className="flex-1" />
              <div className={`h-3 w-20 ${s}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Proof gallery */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className={`h-4 w-20 ${s}`} />
          <div className={`h-8 w-28 ${s}`} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
              <div className={`aspect-video w-full ${s}`} />
              <div className="px-2 py-1.5 space-y-1">
                <div className={`h-3 w-24 ${s}`} />
                <div className={`h-3 w-16 ${s}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div>
        <div className={`h-4 w-20 ${s} mb-3`} />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <div className={`h-2 w-2 rounded-full ${s}`} />
              <div className={`h-3 flex-1 max-w-[240px] ${s}`} />
              <div className={`h-3 w-14 ${s}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

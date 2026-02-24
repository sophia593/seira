export default function EventDetailLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 mb-6">
        <div className={`h-3 w-12 ${s}`} />
        <div className={`h-3 w-2 ${s}`} />
        <div className={`h-3 w-32 ${s}`} />
      </div>

      {/* Header + progress */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className={`h-7 w-56 ${s}`} />
            <div className="flex items-center gap-2">
              <div className={`h-5 w-20 rounded-full ${s}`} />
              <div className={`h-5 w-16 rounded-full ${s}`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-20 ${s}`} />
            <div className={`h-8 w-8 ${s}`} />
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className={`flex-1 h-2 rounded-full ${s}`} />
          <div className={`h-3 w-10 ${s}`} />
        </div>
      </div>

      {/* Partner cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`h-5 w-36 ${s}`} />
                <div className={`h-4 w-16 rounded-full ${s}`} />
              </div>
              <div className={`h-4 w-12 ${s}`} />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className={`h-10 flex-1 rounded-md ${s}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

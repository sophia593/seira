export default function AnalyticsLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className={`h-7 w-24 ${s}`} />
        <div className={`h-4 w-48 ${s} mt-2`} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
            <div className={`h-3 w-20 ${s}`} />
            <div className={`h-7 w-12 ${s}`} />
            <div className={`h-3 w-16 ${s}`} />
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By category */}
        <div className="border border-gray-100 rounded-xl p-4">
          <div className={`h-5 w-44 ${s} mb-4`} />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-3 w-20 ${s}`} />
                <div className={`flex-1 h-2 rounded-full ${s}`} />
                <div className={`h-3 w-8 ${s}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Top partners */}
        <div className="border border-gray-100 rounded-xl p-4">
          <div className={`h-5 w-28 ${s} mb-4`} />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-4 w-32 ${s}`} />
                <div className="flex-1" />
                <div className={`h-3 w-12 ${s}`} />
                <div className={`h-3 w-10 ${s}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div>
        <div className={`h-5 w-32 ${s} mb-3`} />
        <div className="divide-y divide-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className={`h-2 w-2 rounded-full ${s}`} />
              <div className={`h-3 flex-1 max-w-[280px] ${s}`} />
              <div className={`h-3 w-16 ${s}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

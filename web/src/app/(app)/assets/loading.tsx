export default function AssetsLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className={`h-7 w-20 ${s}`} />
          <div className={`h-3 w-44 ${s} mt-2`} />
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-8 w-28 ${s}`} />
          <div className={`h-8 w-24 ${s}`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-1.5">
            <div className={`h-3 w-20 ${s}`} />
            <div className={`h-6 w-10 ${s}`} />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className={`h-9 w-full max-w-sm ${s} mb-4`} />

      {/* Asset list */}
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className={`h-8 w-8 rounded-lg ${s}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-4 w-36 ${s}`} />
              <div className={`h-3 w-24 ${s}`} />
            </div>
            <div className={`h-5 w-16 rounded-full ${s}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SeasonDetailLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 mb-6">
        <div className={`h-3 w-16 ${s}`} />
        <div className={`h-3 w-2 ${s}`} />
        <div className={`h-3 w-28 ${s}`} />
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className={`h-7 w-48 ${s}`} />
        <div className={`h-4 w-36 ${s} mt-2`} />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
            <div className={`h-3 w-16 ${s}`} />
            <div className={`h-6 w-10 ${s}`} />
          </div>
        ))}
      </div>

      {/* Partner rollup */}
      <div className="mb-8">
        <div className={`h-5 w-32 ${s} mb-3`} />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
              <div className={`h-4 w-36 ${s}`} />
              <div className="flex items-center gap-3">
                <div className={`h-3 w-16 ${s}`} />
                <div className={`w-24 h-1.5 rounded-full ${s}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div>
        <div className={`h-5 w-20 ${s} mb-3`} />
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className={`h-2 w-2 rounded-full ${s}`} />
              <div className={`h-4 flex-1 max-w-[200px] ${s}`} />
              <div className={`h-3 w-20 ${s}`} />
              <div className={`h-3 w-12 ${s}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

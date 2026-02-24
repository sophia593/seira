export default function TalentLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className={`h-7 w-20 ${s}`} />
        <div className={`h-8 w-24 ${s}`} />
      </div>

      {/* Search / filter bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`h-9 flex-1 max-w-sm ${s}`} />
        <div className={`h-9 w-28 ${s}`} />
      </div>

      {/* Talent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-full ${s}`} />
              <div className="space-y-1.5 flex-1">
                <div className={`h-4 w-28 ${s}`} />
                <div className={`h-3 w-20 ${s}`} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-16 ${s}`} />
              <div className={`h-3 w-20 ${s}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

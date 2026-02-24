export default function PartnersLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-24 ${s}`} />
          <div className={`h-5 w-8 rounded-full ${s}`} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className={`h-9 flex-1 max-w-sm ${s}`} />
        <div className={`h-9 w-32 ${s}`} />
        <div className={`h-9 w-28 ${s}`} />
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-3">
        <div className={`h-3 w-24 ${s}`} />
        <div className={`h-7 w-20 ${s}`} />
      </div>

      {/* Partner rows */}
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className={`h-4 w-4 rounded ${s}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-4 w-36 ${s}`} />
              <div className={`h-3 w-48 ${s}`} />
            </div>
            <div className={`hidden md:block h-3 w-16 ${s}`} />
            <div className={`hidden md:block h-3 w-20 ${s}`} />
            <div className={`hidden lg:flex items-center gap-2`}>
              <div className={`w-24 h-1.5 rounded-full ${s}`} />
              <div className={`h-3 w-8 ${s}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

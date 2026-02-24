export default function TalentDetailLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 mb-6">
        <div className={`h-3 w-12 ${s}`} />
        <div className={`h-3 w-2 ${s}`} />
        <div className={`h-3 w-28 ${s}`} />
      </div>

      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`h-16 w-16 rounded-full ${s}`} />
        <div className="space-y-2">
          <div className={`h-6 w-40 ${s}`} />
          <div className={`h-4 w-28 ${s}`} />
          <div className={`h-3 w-36 ${s}`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
            <div className={`h-3 w-20 ${s}`} />
            <div className={`h-6 w-8 ${s}`} />
          </div>
        ))}
      </div>

      {/* Commitments */}
      <div>
        <div className={`h-5 w-28 ${s} mb-3`} />
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className={`h-4 w-4 rounded ${s}`} />
              <div className="flex-1 space-y-1.5">
                <div className={`h-4 w-44 ${s}`} />
                <div className={`h-3 w-32 ${s}`} />
              </div>
              <div className={`h-5 w-16 rounded-full ${s}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

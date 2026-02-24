export default function PartnerDetailLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 mb-6">
        <div className={`h-3 w-14 ${s}`} />
        <div className={`h-3 w-2 ${s}`} />
        <div className={`h-3 w-24 ${s}`} />
        <div className={`h-3 w-2 ${s}`} />
        <div className={`h-3 w-32 ${s}`} />
      </div>

      {/* Partner header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className={`h-7 w-44 ${s}`} />
          <div className="flex items-center gap-2">
            <div className={`h-4 w-28 ${s}`} />
            <div className={`h-4 w-20 ${s}`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-8 w-20 ${s}`} />
          <div className={`h-8 w-8 ${s}`} />
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-6 w-20 rounded-full ${s}`} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-8">
        <div className={`flex-1 h-2 rounded-full ${s}`} />
        <div className={`h-3 w-10 ${s}`} />
      </div>

      {/* Deliverable list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`h-5 w-28 ${s}`} />
          <div className={`h-8 w-16 ${s}`} />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className={`h-2 w-2 rounded-full ${s}`} />
              <div className="flex-1 space-y-1.5">
                <div className={`h-4 w-48 ${s}`} />
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-16 ${s}`} />
                  <div className={`h-3 w-20 ${s}`} />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-10 w-10 rounded-md ${s}`} />
                <div className={`h-10 w-10 rounded-md ${s}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

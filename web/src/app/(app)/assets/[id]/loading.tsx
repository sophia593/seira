export default function AssetDetailLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 mb-6">
        <div className={`h-3 w-14 ${s}`} />
        <div className={`h-3 w-2 ${s}`} />
        <div className={`h-3 w-28 ${s}`} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${s}`} />
          <div className="space-y-1.5">
            <div className={`h-6 w-40 ${s}`} />
            <div className={`h-3 w-24 ${s}`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-8 w-16 ${s}`} />
          <div className={`h-8 w-18 ${s}`} />
        </div>
      </div>

      {/* Capacity section */}
      <div className="border border-gray-100 rounded-xl p-4 mb-6">
        <div className={`h-4 w-20 ${s} mb-3`} />
        <div className={`h-5 w-24 rounded-full ${s} mb-3`} />
        <div className={`h-3 w-full max-w-md ${s}`} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="border border-gray-100 rounded-lg p-3 space-y-1.5">
          <div className={`h-3 w-16 ${s}`} />
          <div className={`h-4 w-28 ${s}`} />
        </div>
        <div className="border border-gray-100 rounded-lg p-3 space-y-1.5">
          <div className={`h-3 w-20 ${s}`} />
          <div className={`h-4 w-28 ${s}`} />
        </div>
      </div>

      {/* Notes */}
      <div className="border border-gray-100 rounded-xl p-4">
        <div className={`h-4 w-12 ${s} mb-3`} />
        <div className={`h-3 w-full ${s} mb-1.5`} />
        <div className={`h-3 w-3/4 ${s}`} />
      </div>
    </div>
  )
}

export default function SeasonsLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className={`h-7 w-28 ${s}`} />
        <div className={`h-8 w-28 ${s}`} />
      </div>

      {/* Season cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`h-5 w-40 ${s}`} />
              <div className={`h-4 w-16 rounded-full ${s}`} />
            </div>
            <div className={`h-3 w-56 ${s} mb-3`} />
            <div className="flex items-center gap-4">
              <div className={`h-3 w-20 ${s}`} />
              <div className={`h-3 w-24 ${s}`} />
              <div className={`h-3 w-16 ${s}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

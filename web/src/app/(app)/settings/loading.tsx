export default function SettingsLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className={`h-7 w-24 ${s}`} />
      </div>

      {/* Workspace section */}
      <div className="border-b border-gray-100 pb-6 mb-6">
        <div className={`h-5 w-28 ${s} mb-1`} />
        <div className={`h-3 w-48 ${s} mb-4`} />
        <div className={`h-9 w-full max-w-sm ${s}`} />
      </div>

      {/* Approvals section */}
      <div className="border-b border-gray-100 pb-6 mb-6">
        <div className={`h-5 w-44 ${s} mb-1`} />
        <div className={`h-3 w-64 ${s} mb-4`} />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`h-4 w-4 rounded ${s}`} />
              <div className={`h-4 w-24 ${s}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Profile section */}
      <div className="border-b border-gray-100 pb-6 mb-6">
        <div className={`h-5 w-16 ${s} mb-4`} />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-12 ${s}`} />
            <div className={`h-4 w-40 ${s}`} />
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-12 ${s}`} />
            <div className={`h-4 w-48 ${s}`} />
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-12 ${s}`} />
            <div className={`h-4 w-20 ${s}`} />
          </div>
        </div>
      </div>

      {/* Account section */}
      <div>
        <div className={`h-5 w-20 ${s} mb-4`} />
        <div className={`h-9 w-24 ${s}`} />
      </div>
    </div>
  )
}

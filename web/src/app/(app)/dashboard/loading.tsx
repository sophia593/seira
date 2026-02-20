export default function DashboardLoading() {
  const s = 'bg-gray-100 rounded animate-pulse'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className={`h-7 w-40 ${s}`} />
        <div className={`h-4 w-52 ${s} mt-2`} />
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[140, 130, 130, 120, 120].map((w, i) => (
          <div key={i} className={`h-8 ${s}`} style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:flex lg:items-start lg:gap-0 lg:divide-x lg:divide-border mb-8">
        {[
          { lw: 'w-20', vw: 'w-10', sw: 'w-16' },
          { lw: 'w-28', vw: 'w-14', sw: 'w-24' },
          { lw: 'w-16', vw: 'w-8', sw: 'w-20' },
          { lw: 'w-22', vw: 'w-12', sw: 'w-18' },
        ].map((widths, i) => (
          <div
            key={i}
            className="min-w-0 p-2 lg:p-0 lg:flex-1 lg:px-4 lg:first:pl-0 lg:last:pr-0 space-y-2"
          >
            <div className={`h-3 ${widths.lw} ${s}`} />
            <div className={`h-8 ${widths.vw} ${s}`} />
            <div className={`h-3 ${widths.sw} ${s}`} />
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Upcoming Events */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div className={`h-4 w-32 ${s}`} />
            <div className={`h-3 w-14 ${s}`} />
          </div>
          <div className="divide-y divide-border">
            {[48, 40, 52, 36, 44].map((w, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${s}`} />
                    <div className={`h-4 ${s}`} style={{ width: `${w * 3}px` }} />
                  </div>
                  <div className={`h-3 ${s} ml-4`} style={{ width: `${w * 2.2}px` }} />
                </div>
                <div className={`w-20 h-1.5 rounded-full ${s}`} />
                <div className={`w-8 h-3 ${s}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Attention */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <div className={`h-4 w-20 ${s}`} />
            <div className={`h-5 w-7 rounded-full ${s}`} />
          </div>
          {/* Section label */}
          <div className={`h-2.5 w-14 ${s} mb-2`} />
          <div className="divide-y divide-border">
            {[38, 32, 28].map((w, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5">
                <div className={`mt-1.5 h-2 w-2 rounded-full ${s} shrink-0`} />
                <div className="flex-1 space-y-1.5">
                  <div className={`h-4 ${s}`} style={{ width: `${w * 3}px` }} />
                  <div className={`h-3 ${s}`} style={{ width: `${w * 2}px` }} />
                  <div className={`h-2.5 ${s} w-12`} />
                </div>
              </div>
            ))}
          </div>
          {/* Second section label */}
          <div className={`h-2.5 w-20 ${s} mt-3 mb-2`} />
          <div className="divide-y divide-border">
            {[34, 30].map((w, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5">
                <div className={`mt-1.5 h-2 w-2 rounded-full ${s} shrink-0`} />
                <div className="flex-1 space-y-1.5">
                  <div className={`h-4 ${s}`} style={{ width: `${w * 3}px` }} />
                  <div className={`h-3 ${s}`} style={{ width: `${w * 2}px` }} />
                  <div className={`h-2.5 ${s} w-12`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="border-t border-gray-100 pt-6 mt-6 flex items-center gap-4">
        <div className={`h-4 w-24 ${s}`} />
        <div className={`h-4 w-24 ${s}`} />
        <div className={`h-4 w-28 ${s}`} />
      </div>
    </div>
  )
}

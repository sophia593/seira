function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function MiniBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-gray-400 w-16 text-right shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-medium text-gray-500 w-8 shrink-0">{pct}%</span>
    </div>
  )
}

export function ProductPreview() {
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const pct = 87
  const offset = circumference * (1 - pct / 100)

  return (
    <div className="relative mx-auto max-w-sm lg:max-w-md">
      {/* Card */}
      <div className="rounded-2xl bg-white shadow-2xl shadow-black/20 overflow-hidden">
        {/* Mini hero bar */}
        <div className="bg-gradient-to-r from-kurobeni to-blackberry px-6 py-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Acme Sports Group
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">
            Season Opener 2025
          </p>
          <p className="text-xs text-copper mt-0.5">
            Prepared for Metro Insurance Co.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Ring + stats */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="w-20 h-20 shrink-0">
              <svg viewBox="0 0 180 180" className="w-full h-full">
                <circle cx="90" cy="90" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle
                  cx="90" cy="90" r={radius} fill="none"
                  stroke="var(--color-copper)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 90 90)"
                />
                <text
                  x="90" y="95" textAnchor="middle"
                  style={{ fontSize: '42px', fontWeight: 700, fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}
                  className="fill-kurobeni"
                >
                  {pct}%
                </text>
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-1">
              <MiniStat label="Promised" value="24" />
              <MiniStat label="Fulfilled" value="21" />
              <MiniStat label="Proof" value="18" />
            </div>
          </div>

          {/* Category bars */}
          <div className="space-y-2">
            <MiniBar label="In-Venue" pct={92} color="bg-purple-400" />
            <MiniBar label="Digital" pct={85} color="bg-blue-400" />
            <MiniBar label="Hospitality" pct={78} color="bg-amber-400" />
            <MiniBar label="Signage" pct={100} color="bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -inset-4 bg-copper/10 rounded-3xl blur-2xl -z-10" />
    </div>
  )
}

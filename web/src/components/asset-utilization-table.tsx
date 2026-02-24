'use client'

import Link from 'next/link'
import { Package, Infinity as InfinityIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InfoTip } from '@/components/ui/info-tip'
import type { AssetUtilization, SeasonAssetUtilization } from '@/lib/types/database'

function getBarColor(pct: number | null): string {
  if (pct == null) return 'bg-gray-300'
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  if (pct >= 50) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function getBadge(pct: number | null, used: number, capacity: number | null) {
  if (capacity == null) return null
  if (used > capacity) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-semibold">
        Over-allocated
      </span>
    )
  }
  if (used >= capacity) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">
        At capacity
      </span>
    )
  }
  return null
}

interface AssetUtilizationTableProps {
  utilization: (AssetUtilization | SeasonAssetUtilization)[]
  showEventsColumn?: boolean
}

export function AssetUtilizationTable({ utilization, showEventsColumn }: AssetUtilizationTableProps) {
  if (utilization.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Asset</th>
            <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              <span className="inline-flex items-center gap-1">Capacity <InfoTip text="Max allocations for this asset" side="bottom" /></span>
            </th>
            <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Used</th>
            <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold min-w-[120px]">
              <span className="inline-flex items-center gap-1">Utilization <InfoTip text="Percentage of capacity allocated to partners" side="bottom" /></span>
            </th>
            {showEventsColumn && (
              <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Events</th>
            )}
            <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Partners</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {utilization.map((row) => {
            const isSeasonRow = 'events_used_in' in row
            const barPct = row.utilization_pct != null ? Math.min(row.utilization_pct, 100) : null
            const badge = getBadge(row.utilization_pct, row.used, row.capacity)

            return (
              <tr key={row.asset_id} className="hover:bg-gray-50/50 transition-colors">
                {/* Asset name */}
                <td className="px-4 py-3">
                  <Link
                    href={`/assets/${row.asset_id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                  >
                    <Package className="w-4 h-4 text-gray-400" />
                    {row.asset_name}
                  </Link>
                </td>

                {/* Capacity */}
                <td className="px-3 py-3 text-center">
                  {row.capacity != null ? (
                    <span className="text-sm text-gray-700">{row.capacity}</span>
                  ) : (
                    <InfinityIcon className="w-4 h-4 text-gray-400 mx-auto" />
                  )}
                </td>

                {/* Used */}
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-semibold text-gray-900">{row.used}</span>
                </td>

                {/* Utilization bar */}
                <td className="px-3 py-3">
                  {row.capacity != null ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', getBarColor(row.utilization_pct))}
                            style={{ width: `${barPct ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right shrink-0">
                          {row.utilization_pct ?? 0}%
                        </span>
                      </div>
                      {badge}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No limit</span>
                  )}
                </td>

                {/* Events column (season view) */}
                {showEventsColumn && isSeasonRow && (
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm text-gray-700">
                      {(row as SeasonAssetUtilization).events_used_in}/{(row as SeasonAssetUtilization).total_events}
                    </span>
                  </td>
                )}
                {showEventsColumn && !isSeasonRow && <td />}

                {/* Partners */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.partners.slice(0, 5).map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[11px]"
                      >
                        {p.name}
                        {p.count > 1 && (
                          <span className="ml-0.5 text-gray-400">x{p.count}</span>
                        )}
                      </span>
                    ))}
                    {row.partners.length > 5 && (
                      <span className="text-[11px] text-gray-400 self-center">
                        +{row.partners.length - 5} more
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Package, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InfoTip } from '@/components/ui/info-tip'
import type { AssetUtilizationSummary } from '@/lib/types/database'

function barColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500'
  if (pct >= 50) return 'bg-amber-500'
  return 'bg-emerald-500'
}

interface AssetUtilizationWidgetProps {
  summary: AssetUtilizationSummary
}

export function AssetUtilizationWidget({ summary }: AssetUtilizationWidgetProps) {
  if (summary.total_assets === 0) return null

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold">Asset Utilization</h2>
        <Link
          href="/assets"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          View all &rarr;
        </Link>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="border border-gray-200 rounded-lg px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Total</p>
          <p className="text-lg font-semibold mt-0.5">{summary.total_assets}</p>
        </div>
        <div className="border border-gray-200 rounded-lg px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Avg Util</p>
          <p className="text-lg font-semibold mt-0.5">{summary.avg_utilization_pct}%</p>
        </div>
        <div className="border border-gray-200 rounded-lg px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">At Capacity</p>
          <p className={cn('text-lg font-semibold mt-0.5', summary.at_capacity_count > 0 && 'text-red-500')}>
            {summary.at_capacity_count}
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Underutilized</p>
          <p className={cn('text-lg font-semibold mt-0.5', summary.underutilized_count > 0 && 'text-amber-600')}>
            {summary.underutilized_count}
          </p>
        </div>
      </div>

      {/* Underutilized assets = revenue opportunity */}
      {summary.underutilized_assets.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-[10px] uppercase tracking-widest text-amber-600 font-medium">
              Revenue Opportunity
            </p>
            <InfoTip text="Available inventory that could be sold to additional sponsors" />
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            These assets have available capacity that could be sold to additional partners.
          </p>
          <div className="space-y-2">
            {summary.underutilized_assets.map((asset) => (
              <div key={asset.name} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{asset.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', barColor(asset.utilization_pct))}
                      style={{ width: `${Math.min(asset.utilization_pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{asset.utilization_pct}%</span>
                </div>
                <span className="text-xs text-amber-600 shrink-0">
                  {asset.available} avail
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

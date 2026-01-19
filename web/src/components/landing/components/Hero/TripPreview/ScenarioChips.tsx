'use client';

import { cn } from '@/lib/utils';
import type { TripScenario } from '../../../data';

// =============================================================================
// ScenarioChips - Clickable chips to select different trip scenarios
// =============================================================================

interface ScenarioChipsProps {
  scenarios: TripScenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function ScenarioChips({
  scenarios,
  activeId,
  onSelect,
}: ScenarioChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {scenarios.map((scenario) => {
        const isActive = scenario.id === activeId;

        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            className={cn(
              'flex flex-col items-start',
              'px-3 py-2 rounded-lg',
              'text-left transition-all duration-200',
              'border',
              isActive
                ? 'bg-white/[0.06] border-white/[0.12] text-[#f5f3f0]'
                : 'bg-white/[0.02] border-white/[0.06] text-[#a8a5a0] hover:bg-white/[0.04] hover:text-[#f5f3f0]'
            )}
          >
            <span className="text-sm font-medium">{scenario.chipLabel}</span>
            <span className="text-[10px] text-white/40 mt-0.5">
              {scenario.queryLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TripCard } from './TripCard';
import { ScenarioChips } from './ScenarioChips';
import {
  scenarios,
  getScenarioById,
  getDefaultScenario,
  type TripScenario,
} from '../../../data';

// =============================================================================
// TripPreview - Interactive demo showing different trip scenarios
// =============================================================================
// Users click scenario chips to see different trip previews.
// The card shows event, flight, hotel details with accent-colored border.
// =============================================================================

export function TripPreview() {
  const [activeScenario, setActiveScenario] = useState<TripScenario>(
    getDefaultScenario()
  );

  const handleScenarioChange = (scenarioId: string) => {
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      setActiveScenario(scenario);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Scenario Selector Chips */}
      <ScenarioChips
        scenarios={scenarios}
        activeId={activeScenario.id}
        onSelect={handleScenarioChange}
      />

      {/* Trip Card Display */}
      <TripCard scenario={activeScenario} />
    </div>
  );
}

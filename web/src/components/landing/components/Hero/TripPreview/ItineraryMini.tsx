'use client';

import { cn } from '@/lib/utils';
import type { ItineraryDay } from '../../../data';

// =============================================================================
// ItineraryMini - Compact itinerary preview with timeline dots
// =============================================================================

interface ItineraryMiniProps {
  itinerary: ItineraryDay[];
}

export function ItineraryMini({ itinerary }: ItineraryMiniProps) {
  // Show first 3 days max for compact display
  const visibleDays = itinerary.slice(0, 3);
  const hasMore = itinerary.length > 3;

  return (
    <div className="flex flex-col gap-2">
      {visibleDays.map((day, index) => (
        <div key={day.day} className="flex items-start gap-3">
          {/* Timeline dot and line */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                'bg-[#cfa872]'
              )}
            />
            {index < visibleDays.length - 1 && (
              <div className="w-px h-full min-h-[20px] bg-white/10 mt-1" />
            )}
          </div>

          {/* Day content */}
          <div className="flex-1 pb-2">
            <span className="text-xs font-medium text-[#f5f3f0]">
              {day.day}
            </span>
            <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
              {day.items.slice(0, 2).join(' · ')}
              {day.items.length > 2 && ' …'}
            </p>
          </div>
        </div>
      ))}

      {hasMore && (
        <p className="text-xs text-white/40 ml-5">
          +{itinerary.length - 3} more {itinerary.length - 3 === 1 ? 'day' : 'days'}
        </p>
      )}
    </div>
  );
}

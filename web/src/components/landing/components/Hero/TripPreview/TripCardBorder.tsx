'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// =============================================================================
// TripCardBorder - Accent-colored border wrapper for trip cards
// =============================================================================
// Uses the event's brand color for a subtle left border accent.
// =============================================================================

interface TripCardBorderProps {
  accentColor: string;
  children: ReactNode;
  className?: string;
}

export function TripCardBorder({
  accentColor,
  children,
  className,
}: TripCardBorderProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        'bg-[#0a0a0a] border border-white/[0.06]',
        className
      )}
    >
      {/* Accent border on left side */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* Subtle glow effect from accent color */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 opacity-10 pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${accentColor}, transparent)`,
        }}
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}

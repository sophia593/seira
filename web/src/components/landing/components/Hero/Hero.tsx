'use client';

import { cn } from '@/lib/utils';
import { HeroCopy } from './HeroCopy';
import { TripPreview } from './TripPreview/TripPreview';

// =============================================================================
// Hero Section
// =============================================================================
// Layout: 50/50 grid on desktop, stacked on mobile
// Order: TripPreview first on mobile (visual hook), HeroCopy first on desktop
// Background: Pure black with subtle radial highlight for depth
// =============================================================================

/**
 * Proof chips shown below the hero copy.
 * These establish trust without being pushy - subtle, factual statements.
 * Kept inline here to avoid over-componentizing simple UI.
 */
const proofChips = [
  'Transparent estimates',
  'You approve before booking',
  'Calendar-ready plan',
] as const;

export function Hero() {
  return (
    <section
      className={cn(
        'relative min-h-[calc(100vh-2.5rem)] flex flex-col',
        'bg-black overflow-hidden'
      )}
    >
      {/* ------------------------------------------------------------------- */}
      {/* Subtle Background Effect                                            */}
      {/* Very faint radial highlight to add depth without looking gradient-y */}
      {/* ------------------------------------------------------------------- */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[800px] h-[600px]',
            'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]',
            'opacity-60'
          )}
        />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Main Container                                                       */}
      {/* ------------------------------------------------------------------- */}
      <div
        className={cn(
          'relative z-10 flex-1 flex flex-col',
          'max-w-6xl mx-auto w-full',
          'px-6 sm:px-8 lg:px-10',
          'py-12 sm:py-16 lg:py-20'
        )}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Eyebrow Row                                                       */}
        {/* Brand positioning + launch date, subtle and informational         */}
        {/* ----------------------------------------------------------------- */}
        <div
          className={cn(
            'flex items-center justify-between',
            'pb-8 mb-8',
            'border-b border-white/[0.06]'
          )}
        >
          {/* Left: Brand positioning */}
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="text-[#cfa872]">◆</span>
            <span>AI travel for live events</span>
          </div>

          {/* Right: Launch date (subtle, not redundant with TopBar) */}
          <div className="text-xs text-white/40 hidden sm:block">
            Launching Jan 30
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Hero Grid                                                         */}
        {/* 50/50 split on desktop, stacked on mobile                         */}
        {/* TripPreview appears first on mobile for visual engagement         */}
        {/* ----------------------------------------------------------------- */}
        <div
          className={cn(
            'flex-1 grid items-center gap-12 lg:gap-16',
            'grid-cols-1 lg:grid-cols-2'
          )}
        >
          {/* Copy Column - order-2 on mobile (below preview), order-1 on desktop */}
          <div className="order-2 lg:order-1 flex flex-col lg:max-w-[520px]">
            <HeroCopy />

            {/* ------------------------------------------------------------- */}
            {/* Proof Chips                                                   */}
            {/* Trust signals placed below copy, not inside TripPreview       */}
            {/* Subtle styling: not buttons, just informational pills         */}
            {/* ------------------------------------------------------------- */}
            <div
              className={cn(
                'flex flex-wrap gap-2 mt-8',
                'pt-6 border-t border-white/[0.04]'
              )}
            >
              {proofChips.map((chip) => (
                <span
                  key={chip}
                  className={cn(
                    'inline-flex items-center',
                    'px-3 py-1.5 rounded-full',
                    'text-xs text-white/60',
                    'bg-white/[0.03] border border-white/[0.06]',
                    'transition-colors duration-200',
                    'hover:bg-white/[0.05] hover:text-white/70'
                  )}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Preview Column - order-1 on mobile (visual hook), order-2 on desktop */}
          <div className="order-1 lg:order-2">
            <TripPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

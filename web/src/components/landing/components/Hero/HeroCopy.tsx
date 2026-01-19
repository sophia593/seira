'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

// =============================================================================
// HeroCopy - Main headline and CTA for the landing page
// =============================================================================

export function HeroCopy() {
  return (
    <div className="flex flex-col">
      {/* Headline */}
      <h1
        className={cn(
          'text-4xl sm:text-5xl lg:text-6xl',
          'font-semibold tracking-tight',
          'text-[#f5f3f0]',
          'leading-[1.1]'
        )}
      >
        Plan your next
        <br />
        <span className="text-[#cfa872]">event trip</span>
      </h1>

      {/* Subheadline */}
      <p
        className={cn(
          'mt-6 text-lg sm:text-xl',
          'text-[#a8a5a0]',
          'max-w-md',
          'leading-relaxed'
        )}
      >
        Tell us the event. We find tickets, flights, and hotels—then hand you a
        complete plan to review and book.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        {/* Primary CTA */}
        <Link
          href="/chat"
          className={cn(
            'inline-flex items-center justify-center gap-2',
            'px-6 py-3 rounded-xl',
            'bg-[#cfa872] hover:bg-[#b8956a]',
            'text-black font-medium text-sm',
            'transition-colors duration-200'
          )}
        >
          Start planning
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Secondary CTA */}
        <button
          onClick={() => {
            const el = document.getElementById('how-it-works');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={cn(
            'inline-flex items-center justify-center',
            'px-6 py-3 rounded-xl',
            'bg-white/[0.04] hover:bg-white/[0.08]',
            'text-[#a8a5a0] hover:text-[#f5f3f0]',
            'border border-white/[0.08]',
            'font-medium text-sm',
            'transition-colors duration-200'
          )}
        >
          See how it works
        </button>
      </div>
    </div>
  );
}

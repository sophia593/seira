'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'seira-topbar-dismissed';

export function TopBar() {
  const [dismissed, setDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setDismissed(wasDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const scrollToCTA = () => {
    const el = document.getElementById('final-cta');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-10 bg-black/95 backdrop-blur-sm border-b border-white/[0.06] hidden md:block">
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-center relative">
        {/* Content */}
        <button
          onClick={scrollToCTA}
          className="flex items-center gap-2 text-xs text-[#a8a5a0] hover:text-[#f5f3f0] transition-colors"
        >
          <span>Launching Jan 30 · Early access waitlist open</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute right-6 p-1 text-[#6b6864] hover:text-[#a8a5a0] transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useSyncExternalStore } from 'react';
import { exitDemo, isDemo } from '@/lib/demo';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export default function DemoBanner() {
  const demo = useSyncExternalStore(subscribe, isDemo, () => false);
  if (!demo) return null;

  return (
    <div className="bg-amber/15 border-b border-amber/30 px-4 py-2 text-sm text-paper flex items-center justify-center gap-3 flex-wrap">
      <span>
        <strong className="text-amber">Demo</strong> &middot; invented players, full admin access,
        resets when idle
      </span>
      <button
        type="button"
        onClick={exitDemo}
        className="text-xs underline text-muted hover:text-paper"
      >
        Exit demo
      </button>
    </div>
  );
}

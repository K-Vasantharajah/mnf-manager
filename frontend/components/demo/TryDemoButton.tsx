'use client';

import { useState } from 'react';
import { demoAvailable, enterDemo } from '@/lib/demo';

export default function TryDemoButton() {
  const [state, setState] = useState<'idle' | 'waking' | 'error'>('idle');

  if (!demoAvailable()) return null;

  async function start() {
    setState('waking');
    try {
      await enterDemo();
    } catch {
      setState('error');
    }
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={start}
        disabled={state === 'waking'}
        className="w-full border border-line text-paper hover:border-pitch/50 px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
      >
        {state === 'waking' ? 'Waking up the demo\u2026' : 'Try the demo'}
      </button>
      <p className="text-xs text-muted mt-2">
        {state === 'waking'
          ? 'The demo sleeps when nobody is using it, so the first visit can take up to 30 seconds.'
          : 'Invented players and matches, with full admin access. It resets itself.'}
      </p>
      {state === 'error' && (
        <p className="text-xs text-signal mt-2">The demo didn&apos;t respond. Please try again.</p>
      )}
    </div>
  );
}

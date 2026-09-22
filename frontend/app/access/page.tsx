'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { setAccessToken } from '@/lib/access';

export default function AccessPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post('/api/v1/access', { code });
      setAccessToken(data.token);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        'Something went wrong. Try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/icon.png" alt="" width={28} height={28} className="opacity-90" />
          <span className="font-display text-2xl text-paper">MNF</span>
          <span className="text-sm text-muted">Manager</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-line rounded-xl p-6 space-y-4"
        >
          <div>
            <h1 className="text-paper">Enter the MNF access code</h1>
            <p className="text-xs text-muted mt-1">It&apos;s pinned in the group chat.</p>
          </div>

          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="access code"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm text-paper placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-pitch/40 focus:border-pitch transition-colors"
          />

          {error && <p className="text-xs text-signal">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="w-full bg-pitch text-ink rounded-lg py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            {submitting ? 'Checking\u2026' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

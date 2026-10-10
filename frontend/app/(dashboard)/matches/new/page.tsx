'use client';

import api from '@/lib/api';
import MatchForm from '@/components/match-form/MatchForm';

export default function NewMatchPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8 pb-6 border-b border-line">
        <h1 className="font-display text-3xl text-paper">Record a match</h1>
        <p className="text-sm text-muted mt-2">Enter the result from Monday night</p>
      </div>

      <MatchForm
        submitLabel="Save match"
        failureMessage="Failed to save match. Please try again."
        send={(payload) => api.post('/api/v1/matches', payload)}
      />
    </div>
  );
}

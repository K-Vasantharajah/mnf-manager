'use client';

import { useState } from 'react';
import MatchDetailModal from './MatchDetailModal';
import { useMatches } from '@/lib/hooks';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

export default function MatchesPage() {
  const { data: matches, isLoading, isError } = useMatches();
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const { isAdmin } = useAuth();

  if (isLoading) return <LoadingState message="Loading matches..." />;

  if (isError) return <ErrorState message="Failed to load matches. Is the backend running?" />;

  const filteredMatches =
    matches?.filter((m) => (seasonFilter === 'all' ? true : m.seasonYear === seasonFilter)) || [];

  return (
    <div>
      {selectedMatchId && (
        <MatchDetailModal matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />
      )}
      <div className="flex items-end justify-between mb-10 pb-6 border-b border-line">
        <div>
          <h1 className="font-display text-4xl text-paper">Match history</h1>
          <p className="text-sm text-muted mt-2">
            {filteredMatches.length} {seasonFilter === 'all' ? 'total' : 'matches recorded'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface border border-line rounded-lg p-1">
            <button
              onClick={() => setSeasonFilter(2026)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                seasonFilter === 2026 ? 'bg-surface-2 text-paper' : 'text-muted hover:text-paper'
              }`}
            >
              2026
            </button>
            <button
              onClick={() => setSeasonFilter(2025)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                seasonFilter === 2025 ? 'bg-surface-2 text-paper' : 'text-muted hover:text-paper'
              }`}
            >
              2025
            </button>
            <button
              onClick={() => setSeasonFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                seasonFilter === 'all' ? 'bg-surface-2 text-paper' : 'text-muted hover:text-paper'
              }`}
            >
              All
            </button>
          </div>
          {isAdmin && (
            <Link
              href="/matches/new"
              className="bg-pitch hover:opacity-90 text-ink px-4 py-2 rounded-lg text-sm transition-opacity"
            >
              + Record match
            </Link>
          )}
        </div>
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center py-16 text-muted">No matches recorded for this season</div>
      )}

      <div className="space-y-4">
        {filteredMatches.map((match) => {
          const isDraw = match.isDraw;
          const winnerName = match.winner?.name;
          const captainAName = match.captainA?.name ?? 'Unknown';
          const captainBName = match.captainB?.name ?? 'Unknown';

          return (
            <div
              key={match.id}
              className="bg-surface border border-line rounded-xl p-5 cursor-pointer hover:border-muted/50 transition-colors"
              onClick={() => setSelectedMatchId(match.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted">
                  {match.gameWeek ? (
                    <span className="font-mono text-muted">
                      {match.gameWeek} &middot; Season {match.seasonYear}
                    </span>
                  ) : (
                    <>
                      Season {match.seasonYear}
                      {match.matchDate && (
                        <span className="block mt-0.5">
                          {new Date(match.matchDate).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 text-right">
                  <div
                    className={`text-lg ${winnerName === captainAName ? 'text-pitch' : 'text-muted'}`}
                  >
                    {captainAName}
                  </div>
                  <div className="text-xs text-muted">captain</div>
                </div>

                <div className="flex items-center gap-3 px-6">
                  <span
                    className={`text-3xl font-mono ${
                      match.scoreA > match.scoreB
                        ? 'text-pitch'
                        : isDraw
                          ? 'text-amber'
                          : 'text-muted'
                    }`}
                  >
                    {match.scoreA}
                  </span>
                  <span className="text-muted font-light">&ndash;</span>
                  <span
                    className={`text-3xl font-mono ${
                      match.scoreB > match.scoreA
                        ? 'text-pitch'
                        : isDraw
                          ? 'text-amber'
                          : 'text-muted'
                    }`}
                  >
                    {match.scoreB}
                  </span>
                </div>

                <div className="flex-1">
                  <div
                    className={`text-lg ${winnerName === captainBName ? 'text-pitch' : 'text-muted'}`}
                  >
                    {captainBName}
                  </div>
                  <div className="text-xs text-muted">captain</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    isDraw ? 'bg-amber/10 text-amber' : 'bg-pitch/10 text-pitch'
                  }`}
                >
                  {isDraw ? 'Draw' : `${winnerName} wins`}
                </span>
                {match.seasonYear === new Date().getFullYear() && isAdmin && (
                  <Link
                    href={`/matches/${match.id}/edit`}
                    className="text-xs text-pitch hover:opacity-80 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Edit match
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

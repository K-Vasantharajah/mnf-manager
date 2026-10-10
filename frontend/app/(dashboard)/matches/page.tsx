'use client';

import { useState } from 'react';
import MatchDetailModal from './MatchDetailModal';
import { useMatches } from '@/lib/hooks';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import SegmentedControl from '@/components/ui/SegmentedControl';

import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import { OUTCOME_COLOUR, OUTCOME_BADGE, outcome } from '@/lib/outcome';
import { seasonOptions, useSeasons } from '@/lib/useSeasons';

export default function MatchesPage() {
  const { data: matches, isLoading, isError } = useMatches();
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const { isAdmin } = useAuth();
  const seasons = useSeasons();

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
          <SegmentedControl
            options={seasonOptions(seasons)}
            value={seasonFilter}
            onChange={setSeasonFilter}
          />
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
          const captainAName = match.captainA?.name ?? 'Unknown';
          const captainBName = match.captainB?.name ?? 'Unknown';

          // Every result style comes from these two, so names, scores and the
          // badge can never disagree
          const sideA = outcome(match.scoreA, match.scoreB);
          const sideB = outcome(match.scoreB, match.scoreA);
          const isDraw = sideA === 'draw';
          const winnerName = sideA === 'win' ? captainAName : captainBName;

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
                    className={`text-lg ${OUTCOME_COLOUR[sideA]} ${sideA === 'win' ? 'font-semibold' : ''}`}
                  >
                    {captainAName}
                  </div>
                  <div className="text-xs text-muted">captain</div>
                </div>

                <div className="flex items-center gap-3 px-6">
                  <span className={`text-3xl font-mono ${OUTCOME_COLOUR[sideA]}`}>
                    {match.scoreA}
                  </span>
                  <span className="text-muted font-light">&ndash;</span>
                  <span className={`text-3xl font-mono ${OUTCOME_COLOUR[sideB]}`}>
                    {match.scoreB}
                  </span>
                </div>

                <div className="flex-1">
                  <div
                    className={`text-lg ${OUTCOME_COLOUR[sideB]} ${sideB === 'win' ? 'font-semibold' : ''}`}
                  >
                    {captainBName}
                  </div>
                  <div className="text-xs text-muted">captain</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                <span
                  className={`text-xs px-3 py-1 rounded-full ${OUTCOME_BADGE[isDraw ? 'draw' : 'win']}`}
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

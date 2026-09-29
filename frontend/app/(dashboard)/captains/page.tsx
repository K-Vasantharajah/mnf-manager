'use client';

import { useState } from 'react';
import { useCaptainStats } from '@/lib/hooks';
import { CaptainStats } from '@/lib/types';
import { useRouter } from 'next/navigation';
import MatchDetailModal from '../matches/MatchDetailModal';
import MatchListModal, { MatchListRow } from '@/components/ui/MatchListModal';
import SegmentedControl from '@/components/ui/SegmentedControl';

import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

function captainMatchRows(captain: CaptainStats): MatchListRow[] {
  return captain.matchHistory.map((m) => ({
    matchId: m.matchId,
    label: m.gameWeek || `S${m.seasonYear}`,
    result: m.result,
    rightName: m.opponentName,
    leftScore: m.scoreFor,
    rightScore: m.scoreAgainst,
  }));
}

export default function CaptainsPage() {
  const [seasonYear, setSeasonYear] = useState<number | undefined>(2026);
  const { data: captains, isLoading, isError } = useCaptainStats(seasonYear);
  const [selectedCaptain, setSelectedCaptain] = useState<CaptainStats | null>(null);
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [previousCaptain, setPreviousCaptain] = useState<CaptainStats | null>(null);

  if (isLoading) {
    return <LoadingState message="Loading captain stats..." />;
  }

  if (isError) {
    return <ErrorState message="Failed to load data. Is the backend running?" />;
  }

  return (
    <div>
      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => {
            setSelectedMatchId(null);
            setPreviousCaptain(null);
          }}
          onBack={
            previousCaptain
              ? () => {
                  setSelectedMatchId(null);
                  setSelectedCaptain(previousCaptain);
                  setPreviousCaptain(null);
                }
              : undefined
          }
        />
      )}

      {selectedCaptain && (
        <MatchListModal
          title={`${selectedCaptain.name}'s match history`}
          subtitle={`${selectedCaptain.matchesCaptained} matches as captain`}
          rows={captainMatchRows(selectedCaptain)}
          onClose={() => setSelectedCaptain(null)}
          onMatchClick={(matchId) => {
            setPreviousCaptain(selectedCaptain);
            setSelectedCaptain(null);
            setSelectedMatchId(matchId);
          }}
        />
      )}

      <div className="flex items-end justify-between mb-10 pb-6 border-b border-line">
        <div>
          <h1 className="font-display text-4xl text-paper">Captains</h1>
          <p className="text-sm text-muted mt-2">{captains?.length} captains this season</p>
        </div>
        <SegmentedControl
          options={[
            { label: '2026', value: 2026 },
            { label: '2025', value: 2025 },
            { label: 'All time', value: undefined },
          ]}
          value={seasonYear}
          onChange={setSeasonYear}
        />
      </div>

      {captains?.length === 0 ? (
        <div className="text-center py-16 text-muted">No captain data for this season</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {captains?.map((captain, index) => {
            const ptColor =
              captain.pointsPercentage >= 60
                ? 'text-pitch'
                : captain.pointsPercentage >= 40
                  ? 'text-amber'
                  : 'text-signal';

            const barColor =
              captain.pointsPercentage >= 60
                ? 'bg-pitch'
                : captain.pointsPercentage >= 40
                  ? 'bg-amber'
                  : 'bg-signal';

            return (
              <div
                key={captain.playerId}
                className="bg-surface border border-line rounded-xl overflow-hidden cursor-pointer hover:border-muted/50 transition-colors"
                onClick={() => setSelectedCaptain(captain)}
              >
                {/* Header */}
                <div className="px-6 py-5 flex items-center gap-4 border-b border-line">
                  <div
                    className="w-11 h-11 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper font-display text-sm flex-shrink-0 cursor-pointer hover:border-pitch transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/players/${captain.playerId}`);
                    }}
                  >
                    {captain.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-paper text-base">{captain.name}</h2>
                      {index < 3 && (
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                            index === 0 ? 'bg-amber/15 text-amber' : 'bg-surface-2 text-muted'
                          }`}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-sm mt-0.5">
                      {captain.matchesCaptained} matches as captain
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-2xl ${ptColor}`}>
                      {captain.pointsPercentage}
                    </div>
                    <div className="text-muted text-xs mt-0.5">Points %</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 border-b border-line">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-mono text-xl text-paper">{captain.wins}</div>
                      <div className="text-xs text-muted mt-1">Wins</div>
                    </div>
                    <div>
                      <div className="font-mono text-xl text-paper">{captain.draws}</div>
                      <div className="text-xs text-muted mt-1">Draws</div>
                    </div>
                    <div>
                      <div className="font-mono text-xl text-paper">{captain.losses}</div>
                      <div className="text-xs text-muted mt-1">Losses</div>
                    </div>
                  </div>
                </div>

                {/* Pt% bar */}
                <div className="px-6 py-3 border-b border-line">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-line rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${barColor}`}
                        style={{ width: `${captain.pointsPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-muted">
                      {captain.pointsPercentage}%
                    </span>
                  </div>
                </div>

                {/* Most picked */}
                <div className="px-6 py-4">
                  <div className="text-xs text-muted mb-3">Most picked players</div>
                  <div className="flex flex-wrap gap-2">
                    {captain.mostPickedPlayers.map((player, i) => (
                      <span
                        key={player}
                        className={`text-xs px-3 py-1 rounded-full border ${
                          i === 0
                            ? 'border-amber/40 text-amber bg-amber/10'
                            : 'border-line text-muted'
                        }`}
                      >
                        {player}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-3">Click card to view match history</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

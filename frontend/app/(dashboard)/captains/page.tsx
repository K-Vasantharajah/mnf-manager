'use client';

import { useState } from 'react';
import { useCaptainStats } from '@/lib/hooks';
import { CaptainStats } from '@/lib/types';
import { useRouter } from 'next/navigation';
import MatchDetailModal from '../matches/MatchDetailModal';

import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1 1L13 13M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const resultStyles: Record<string, string> = {
  WIN: 'bg-pitch/10 text-pitch',
  DRAW: 'bg-muted/15 text-muted',
  LOSS: 'bg-signal/10 text-signal',
};

function MatchHistoryModal({
  captain,
  onClose,
  onMatchClick,
}: {
  captain: CaptainStats;
  onClose: () => void;
  onMatchClick: (matchId: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-medium text-paper">{captain.name}&apos;s match history</h2>
            <p className="text-xs text-muted mt-0.5">
              {captain.matchesCaptained} matches as captain
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-paper transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {captain.matchHistory.map((match, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 border-b border-line last:border-0 hover:bg-surface-2 cursor-pointer transition-colors"
              onClick={() => {
                onClose();
                onMatchClick(match.matchId);
              }}
            >
              <span className="text-xs text-muted font-mono min-w-10">
                {match.gameWeek || `S${match.seasonYear}`}
              </span>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded min-w-14 text-center ${
                  resultStyles[match.result] ?? resultStyles.DRAW
                }`}
              >
                {match.result}
              </span>
              <span className="text-sm flex-1 text-paper/80">vs {match.opponentName}</span>
              <span className="text-sm font-mono text-paper">
                {match.scoreFor}&ndash;{match.scoreAgainst}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
        <MatchHistoryModal
          captain={selectedCaptain}
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
        <div className="flex items-center gap-1 bg-surface border border-line rounded-lg p-1">
          <button
            onClick={() => setSeasonYear(2026)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              seasonYear === 2026 ? 'bg-surface-2 text-paper' : 'text-muted hover:text-paper'
            }`}
          >
            2026
          </button>
          <button
            onClick={() => setSeasonYear(2025)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              seasonYear === 2025 ? 'bg-surface-2 text-paper' : 'text-muted hover:text-paper'
            }`}
          >
            2025
          </button>
          <button
            onClick={() => setSeasonYear(undefined)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              seasonYear === undefined ? 'bg-surface-2 text-paper' : 'text-muted hover:text-paper'
            }`}
          >
            All time
          </button>
        </div>
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

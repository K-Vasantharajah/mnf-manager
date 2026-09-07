'use client';

import { useState } from 'react';
import { useCaptainStats } from '@/lib/hooks';
import { CaptainStats } from '@/lib/types';
import { useRouter } from 'next/navigation';
import MatchDetailModal from '../matches/MatchDetailModal';


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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">{captain.name}&apos;s match history</h2>
            <p className="text-xs text-gray-400 mt-0.5">{captain.matchesCaptained} matches as captain</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {captain.matchHistory.map((match, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                onClose();
                onMatchClick(match.matchId);
              }}
            >
              <span className="text-xs text-gray-400 min-w-10">
                {match.gameWeek || `S${match.seasonYear}`}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-10 text-center ${
                match.result === 'WIN' ? 'bg-green-100 text-green-700' :
                match.result === 'DRAW' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-500'
              }`}>
                {match.result}
              </span>
              <span className="text-sm flex-1 text-gray-600">vs {match.opponentName}</span>
              <span className="text-sm font-bold text-gray-900">
                {match.scoreFor} — {match.scoreAgainst}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading captain stats...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Failed to load data. Is the backend running?</div>
      </div>
    );
  }

  return (
    <div>
      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    
      {selectedCaptain && (
        <MatchHistoryModal
          captain={selectedCaptain}
          onClose={() => setSelectedCaptain(null)}
          onMatchClick={(matchId) => {
            setSelectedCaptain(null);
            setSelectedMatchId(matchId);
          }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Captains</h1>
          <p className="text-sm text-gray-400 mt-1">
            {captains?.length} captains this season
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSeasonYear(2026)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              seasonYear === 2026
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            2026
          </button>
          <button
            onClick={() => setSeasonYear(2025)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              seasonYear === 2025
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            2025
          </button>
          <button
            onClick={() => setSeasonYear(undefined)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              seasonYear === undefined
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All time
          </button>
        </div>
      </div>

      {captains?.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No captain data for this season
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {captains?.map((captain, index) => {
            const ptColor = captain.pointsPercentage >= 60
              ? 'text-green-600'
              : captain.pointsPercentage >= 40
              ? 'text-amber-500'
              : 'text-red-400';

            const barColor = captain.pointsPercentage >= 60
              ? 'bg-green-500'
              : captain.pointsPercentage >= 40
              ? 'bg-amber-400'
              : 'bg-red-400';

            const medal = index === 0 ? '🥇'
              : index === 1 ? '🥈'
              : index === 2 ? '🥉'
              : null;

            return (
              <div
                key={captain.playerId}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCaptain(captain)}
              >
                {/* Header */}
                <div className="bg-green-900 px-6 py-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-lg font-black flex-shrink-0 cursor-pointer hover:bg-green-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/players/${captain.playerId}`);
                    }}
                  >
                    {captain.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-bold text-lg">{captain.name}</h2>
                      {medal && <span className="text-lg">{medal}</span>}
                    </div>
                    <p className="text-green-300 text-sm">
                      {captain.matchesCaptained} matches as captain
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-black ${ptColor}`}>
                      {captain.pointsPercentage}
                    </div>
                    <div className="text-green-300 text-xs">Pt %</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 border-b border-gray-50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-black text-green-600">{captain.wins}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Wins</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-amber-500">{captain.draws}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Draws</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-red-400">{captain.losses}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Losses</div>
                    </div>
                  </div>
                </div>

                {/* Pt% bar */}
                <div className="px-6 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${barColor}`}
                        style={{ width: `${captain.pointsPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-600">
                      {captain.pointsPercentage}%
                    </span>
                  </div>
                </div>

                {/* Most picked */}
                <div className="px-6 py-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                    Most picked players
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {captain.mostPickedPlayers.map((player, i) => (
                      <span
                        key={player}
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          i === 0
                            ? 'bg-green-100 text-green-800'
                            : i === 1
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {i === 0 && '⭐ '}{player}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Click card to view match history
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
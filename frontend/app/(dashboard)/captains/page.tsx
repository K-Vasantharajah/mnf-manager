'use client';

import { useState } from 'react';
import { useCaptainStats } from '@/lib/hooks';

export default function CaptainsPage() {
  const [seasonYear, setSeasonYear] = useState<number | undefined>(2026);
  const { data: captains, isLoading, isError } = useCaptainStats(seasonYear);

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
            const winRateColor = captain.winRate >= 60
              ? 'text-green-600'
              : captain.winRate >= 40
              ? 'text-amber-500'
              : 'text-red-400';

            const medal = index === 0 ? '🥇'
              : index === 1 ? '🥈'
              : index === 2 ? '🥉'
              : null;

            return (
              <div
                key={captain.playerId}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-green-900 px-6 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
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
                    <div className={`text-3xl font-black ${winRateColor}`}>
                      {captain.winRate}%
                    </div>
                    <div className="text-green-300 text-xs">win rate</div>
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

                {/* Win rate bar */}
                <div className="px-6 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          captain.winRate >= 60 ? 'bg-green-500' :
                          captain.winRate >= 40 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${captain.winRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-600">
                      {captain.winRate}%
                    </span>
                  </div>
                </div>

                {/* Most picked players */}
                <div className="px-6 py-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
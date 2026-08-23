'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/lib/hooks';
import { PlayerLeaderboardEntry } from '@/lib/types';

function getRatingColor(value: number) {
  if (value >= 8) return 'text-green-600';
  if (value >= 6) return 'text-amber-500';
  return 'text-red-400';
}

function getWinRateColor(value: number) {
  if (value >= 70) return 'text-green-600';
  if (value >= 40) return 'text-amber-500';
  return 'text-red-400';
}

function medal(i: number) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `${i + 1}`;
}

function LeaderboardTable({
  title,
  entries,
  getValue,
  formatValue,
  colorFn,
  emptyMessage,
}: {
  title: string;
  entries: PlayerLeaderboardEntry[];
  getValue: (e: PlayerLeaderboardEntry) => number;
  formatValue: (e: PlayerLeaderboardEntry) => string;
  colorFn: (v: number) => string;
  emptyMessage?: string;
}) {
  const sorted = [...entries].sort((a, b) => getValue(b) - getValue(a));

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {sorted.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          {emptyMessage || 'No data yet'}
        </div>
      ) : (
        <div>
          {sorted.slice(0, 10).map((entry, i) => (
            <div
              key={entry.playerId}
              className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-bold text-gray-400 min-w-6 text-center">
                {medal(i)}
              </span>
              <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {entry.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-medium text-gray-900 flex-1">{entry.name}</span>
              <span className="text-xs text-gray-400 mr-2">
                {entry.matchesPlayed}mp
              </span>
              <span className={`font-bold text-sm ${colorFn(getValue(entry))}`}>
                {formatValue(entry)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RatingTable({
  title,
  entries,
  getValue,
}: {
  title: string;
  entries: PlayerLeaderboardEntry[];
  getValue: (e: PlayerLeaderboardEntry) => number;
}) {
  const sorted = [...entries].sort((a, b) => getValue(b) - getValue(a));

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div>
        {sorted.slice(0, 10).map((entry, i) => (
          <div
            key={entry.playerId}
            className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-bold text-gray-400 min-w-6 text-center">
              {medal(i)}
            </span>
            <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {entry.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900 flex-1">{entry.name}</span>
            <span className={`font-bold text-sm ${getRatingColor(getValue(entry))}`}>
              {getValue(entry)}/10
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [seasonYear, setSeasonYear] = useState<number | undefined>(2026);
  const { data: entries, isLoading, isError } = useLeaderboard(seasonYear);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading leaderboard...</div>
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

  const allEntries = entries || [];
  const playedEntries = allEntries.filter(e => e.matchesPlayed > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            {playedEntries.length} players with match data
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <LeaderboardTable
          title="🏆 Win rate"
          entries={playedEntries}
          getValue={(e) => e.winRate}
          formatValue={(e) => `${e.winRate}%`}
          colorFn={getWinRateColor}
          emptyMessage="Record some matches to see win rates"
        />
        <LeaderboardTable
          title="⚽ Goals scored"
          entries={playedEntries}
          getValue={(e) => e.goals}
          formatValue={(e) => `${e.goals} goals`}
          colorFn={(v) => v > 0 ? 'text-green-600' : 'text-gray-400'}
          emptyMessage="No goals recorded yet"
        />
        <LeaderboardTable
          title="🎮 Matches played"
          entries={playedEntries}
          getValue={(e) => e.matchesPlayed}
          formatValue={(e) => `${e.matchesPlayed} played`}
          colorFn={() => 'text-blue-600'}
          emptyMessage="No matches recorded yet"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RatingTable
          title="💪 Ability rating"
          entries={allEntries}
          getValue={(e) => e.ability || 0}
        />
        <RatingTable
          title="✅ Reliability rating"
          entries={allEntries}
          getValue={(e) => e.reliability || 0}
        />
        <RatingTable
          title="🎯 Goal threat rating"
          entries={allEntries}
          getValue={(e) => e.goalThreat || 0}
        />
      </div>
    </div>
  );
}
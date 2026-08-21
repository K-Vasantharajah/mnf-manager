'use client';

import { usePlayers } from '@/lib/hooks';
import { Player } from '@/lib/types';

function getRatingColor(value: number) {
  if (value >= 8) return 'text-green-600';
  if (value >= 6) return 'text-amber-500';
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
  players,
  getValue,
  colorFn,
}: {
  title: string;
  players: Player[];
  getValue: (p: Player) => number;
  colorFn: (v: number) => string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div>
        {players.slice(0, 10).map((player, i) => (
          <div
            key={player.id}
            className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-bold text-gray-400 min-w-6 text-center">
              {medal(i)}
            </span>
            <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900 flex-1">{player.name}</span>
            <span className={`font-bold text-sm ${colorFn(getValue(player))}`}>
              {getValue(player)}/10
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: players, isLoading, isError } = usePlayers();

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

  const byAbility = [...(players || [])].sort(
    (a, b) => (b.rating?.ability || 0) - (a.rating?.ability || 0)
  );

  const byReliability = [...(players || [])].sort(
    (a, b) => (b.rating?.reliability || 0) - (a.rating?.reliability || 0)
  );

  const byGoalThreat = [...(players || [])].sort(
    (a, b) => (b.rating?.goalThreat || 0) - (a.rating?.goalThreat || 0)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-400 mt-1">Player rankings by rating</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LeaderboardTable
          title="⚽ Ability"
          players={byAbility}
          getValue={(p) => p.rating?.ability || 0}
          colorFn={getRatingColor}
        />
        <LeaderboardTable
          title="✅ Reliability"
          players={byReliability}
          getValue={(p) => p.rating?.reliability || 0}
          colorFn={getRatingColor}
        />
        <LeaderboardTable
          title="🎯 Goal threat"
          players={byGoalThreat}
          getValue={(p) => p.rating?.goalThreat || 0}
          colorFn={getRatingColor}
        />
      </div>
    </div>
  );
}
'use client';

import { usePlayers, useMatches } from '@/lib/hooks';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: players, isLoading: playersLoading } = usePlayers();
  const { data: matches, isLoading: matchesLoading } = useMatches();

  const isLoading = playersLoading || matchesLoading;

  const topReliability = players
    ? [...players].sort((a, b) => (b.rating?.reliability || 0) - (a.rating?.reliability || 0))[0]
    : null;

  const topAbility = players
    ? [...players].sort((a, b) => (b.rating?.ability || 0) - (a.rating?.ability || 0))[0]
    : null;

  const topGoalThreat = players
    ? [...players].sort((a, b) => (b.rating?.goalThreat || 0) - (a.rating?.goalThreat || 0))[0]
    : null;

  const recentMatches = matches?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Monday Night Football · Season 2026</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Squad size</div>
          <div className="text-3xl font-black text-gray-900">{players?.length || 0}</div>
          <div className="text-xs text-gray-400 mt-1">active players</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Matches</div>
          <div className="text-3xl font-black text-gray-900">{matches?.length || 0}</div>
          <div className="text-xs text-gray-400 mt-1">recorded this season</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Most reliable</div>
          <div className="text-xl font-black text-green-600">{topReliability?.name || '—'}</div>
          <div className="text-xs text-gray-400 mt-1">
            {topReliability?.rating?.reliability}/10 reliability
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Top ability</div>
          <div className="text-xl font-black text-blue-600">{topAbility?.name || '—'}</div>
          <div className="text-xs text-gray-400 mt-1">
            {topAbility?.rating?.ability}/10 ability
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent matches */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent matches</h2>
            <Link href="/matches" className="text-xs text-green-600 hover:text-green-700 font-medium">
              View all
            </Link>
          </div>
          {recentMatches.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No matches recorded yet
            </div>
          ) : (
            recentMatches.map((match) => (
              <div key={match.id} className="px-5 py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{match.captainA?.name ?? 'Unknown'}</span>
                    <span className="text-lg font-black text-green-600">{match.scoreA}</span>
                    <span className="text-gray-300">—</span>
                    <span className="text-lg font-black text-gray-400">{match.scoreB}</span>
                    <span className="font-medium text-sm text-gray-400">{match.captainB?.name ?? 'Unknown'}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(match.matchDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Top players */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Top rated players</h2>
            <Link href="/leaderboard" className="text-xs text-green-600 hover:text-green-700 font-medium">
              Full leaderboard
            </Link>
          </div>
          {[topAbility, topReliability, topGoalThreat].filter(Boolean).map((player, i) => {
            const labels = ['Highest ability', 'Most reliable', 'Top goal threat'];
            const values = [
              player?.rating?.ability,
              player?.rating?.reliability,
              player?.rating?.goalThreat,
            ];
            const colors = ['text-blue-600', 'text-green-600', 'text-amber-500'];
            return (
              <div key={`top-${i}`} className="px-5 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {player?.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{player?.name}</div>
                  <div className="text-xs text-gray-400">{labels[i]}</div>
                </div>
                <span className={`font-black text-lg ${colors[i]}`}>{values[i]}/10</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
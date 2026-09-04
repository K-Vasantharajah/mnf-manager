'use client';

import { usePlayers, useMatches, useDashboardStats } from '@/lib/hooks';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: players, isLoading: playersLoading } = usePlayers();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();

  const isLoading = playersLoading || matchesLoading || statsLoading;

  const currentYear = new Date().getFullYear();

  const currentSeasonMatches = matches?.filter(m => m.seasonYear === currentYear) || [];

  const topGoalScorer = players
    ? [...players].sort((a, b) => (b.rating?.goalThreat || 0) - (a.rating?.goalThreat || 0))[0]
    : null;

  const recentMatches = matches?.slice(0, 5) || [];

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
        <p className="text-sm text-gray-400 mt-1">
          Monday Night Football · Season {currentYear}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Squad size</div>
          <div className="text-3xl font-black text-gray-900">{players?.length || 0}</div>
          <div className="text-xs text-gray-400 mt-1">registered players</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Season {currentYear}</div>
          <div className="text-3xl font-black text-gray-900">{currentSeasonMatches.length}</div>
          <div className="text-xs text-gray-400 mt-1">matches played</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current captain</div>
          <div className="text-xl font-black text-green-600 truncate">
            {dashboardStats?.currentWinningCaptain || '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">winning captain</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current streak</div>
          <div className="text-3xl font-black text-amber-500">
            {dashboardStats?.currentStreak || 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {dashboardStats?.currentStreakCaptain} unbeaten
          </div>
        </div>
      </div>

      {/* Captain streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            🏆 Season {currentYear} longest unbeaten streak
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-700 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
              {dashboardStats?.longestCurrentSeasonStreakCaptain?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg text-gray-900">
                {dashboardStats?.longestCurrentSeasonStreakCaptain}
              </div>
              <div className="text-sm text-gray-400">as captain</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-green-600">
                {dashboardStats?.longestCurrentSeasonStreak}
              </div>
              <div className="text-xs text-gray-400">matches</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            ⭐ All time longest unbeaten streak
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
              {dashboardStats?.longestAllTimeStreakCaptain?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg text-gray-900">
                {dashboardStats?.longestAllTimeStreakCaptain}
              </div>
              <div className="text-sm text-gray-400">as captain</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-amber-500">
                {dashboardStats?.longestAllTimeStreak}
              </div>
              <div className="text-xs text-gray-400">matches</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent matches */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent matches</h2>
            <Link
              href="/matches"
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              View all
            </Link>
          </div>
          {recentMatches.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No matches recorded yet
            </div>
          ) : (
            recentMatches.map((match) => (
              <div
                key={match.id}
                className="px-5 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-medium text-sm ${
                        match.winner?.name === match.captainA?.name
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {match.captainA?.name ?? 'Unknown'}
                    </span>
                    <span className={`text-lg font-black ${
                      match.isDraw 
                        ? 'text-amber-500' 
                        : match.winner?.name === match.captainA?.name 
                        ? 'text-green-600' 
                        : 'text-gray-300'
                    }`}>
                      {match.scoreA}
                    </span>
                    <span className="text-gray-300">—</span>
                    <span className={`text-lg font-black ${
                      match.isDraw 
                        ? 'text-amber-500' 
                        : match.winner?.name === match.captainB?.name 
                        ? 'text-green-600' 
                        : 'text-gray-300'
                    }`}>
                      {match.scoreB}
                    </span>
                    <span
                      className={`font-medium text-sm ${
                        match.winner?.name === match.captainB?.name
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {match.captainB?.name ?? 'Unknown'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {match.gameWeek
                      ? `${match.gameWeek} · ${match.seasonYear}`
                      : `Season ${match.seasonYear}`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Captain leaderboard */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Top captains · Season {currentYear}
            </h2>
            <Link
              href="/captains"
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="px-5 py-3 text-center text-gray-400 text-sm">
            <Link href="/captains" className="text-green-600 hover:text-green-700">
              View captain stats →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { usePlayers, useMatches, useDashboardStats, useLeaderboard } from '@/lib/hooks';
import Link from 'next/link';

import LoadingState from '@/components/ui/LoadingState';

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();

  const { data: players, isLoading: playersLoading } = usePlayers();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: leaderboard } = useLeaderboard(currentYear);
  const isLoading = playersLoading || matchesLoading || statsLoading;
  const currentSeasonMatches = matches?.filter((m) => m.seasonYear === currentYear) || [];
  const recentMatches = matches?.slice(0, 5) || [];

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-line">
        <h1 className="font-display text-4xl text-paper">Dashboard</h1>
        <p className="text-sm text-muted mt-2">
          Monday Night Football &middot; Season {currentYear}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-line rounded-xl p-4">
          <div className="text-xs text-muted mb-2">Squad size</div>
          <div className="text-3xl font-mono text-paper">{players?.length || 0}</div>
          <div className="text-xs text-muted mt-1.5">registered players</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4">
          <div className="text-xs text-muted mb-2">Season {currentYear}</div>
          <div className="text-3xl font-mono text-paper">{currentSeasonMatches.length}</div>
          <div className="text-xs text-muted mt-1.5">matches played</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4">
          <div className="text-xs text-muted mb-2">Current captain</div>
          <div className="text-lg text-pitch truncate">
            {dashboardStats?.currentWinningCaptain || '—'}
          </div>
          <div className="text-xs text-muted mt-1.5">winning captain</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4">
          <div className="text-xs text-muted mb-2">Current streak</div>
          <div className="text-3xl font-mono text-amber">{dashboardStats?.currentStreak || 0}</div>
          <div className="text-xs text-muted mt-1.5">
            {dashboardStats?.currentStreakCaptain} unbeaten
          </div>
        </div>
      </div>

      {/* Captain streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-line rounded-xl p-5">
          <h2 className="text-sm text-muted mb-4">Season {currentYear} longest unbeaten streak</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper font-display text-base shrink-0">
              {dashboardStats?.longestCurrentSeasonStreakCaptain?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-base text-paper">
                {dashboardStats?.longestCurrentSeasonStreakCaptain}
              </div>
              <div className="text-sm text-muted mt-0.5">as captain</div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl text-pitch">
                {dashboardStats?.longestCurrentSeasonStreak}
              </div>
              <div className="text-xs text-muted mt-0.5">matches</div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-5">
          <h2 className="text-sm text-muted mb-4">All-time longest unbeaten streak</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper font-display text-base shrink-0">
              {dashboardStats?.longestAllTimeStreakCaptain?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-base text-paper">
                {dashboardStats?.longestAllTimeStreakCaptain}
              </div>
              <div className="text-sm text-muted mt-0.5">as captain</div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl text-amber">
                {dashboardStats?.longestAllTimeStreak}
              </div>
              <div className="text-xs text-muted mt-0.5">matches</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent matches */}
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="text-sm text-muted">Recent matches</h2>
            <Link href="/matches" className="text-xs text-pitch hover:opacity-80">
              View all
            </Link>
          </div>
          {recentMatches.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted text-sm">No matches recorded yet</div>
          ) : (
            recentMatches.map((match) => (
              <div key={match.id} className="px-5 py-3 border-b border-line last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm ${
                        match.winner?.name === match.captainA?.name ? 'text-pitch' : 'text-muted'
                      }`}
                    >
                      {match.captainA?.name ?? 'Unknown'}
                    </span>
                    <span
                      className={`text-lg font-mono ${
                        match.isDraw
                          ? 'text-amber'
                          : match.winner?.name === match.captainA?.name
                            ? 'text-pitch'
                            : 'text-muted'
                      }`}
                    >
                      {match.scoreA}
                    </span>
                    <span className="text-muted">&ndash;</span>
                    <span
                      className={`text-lg font-mono ${
                        match.isDraw
                          ? 'text-amber'
                          : match.winner?.name === match.captainB?.name
                            ? 'text-pitch'
                            : 'text-muted'
                      }`}
                    >
                      {match.scoreB}
                    </span>
                    <span
                      className={`text-sm ${
                        match.winner?.name === match.captainB?.name ? 'text-pitch' : 'text-muted'
                      }`}
                    >
                      {match.captainB?.name ?? 'Unknown'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted">
                    {match.gameWeek
                      ? `${match.gameWeek} \u00b7 ${match.seasonYear}`
                      : `Season ${match.seasonYear}`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="text-sm text-muted">Season {currentYear} top performers</h2>
          </div>

          {/* Pt% leader */}
          {(() => {
            const qualified = leaderboard?.filter((e) => e.matchesPlayed >= 14) || [];
            const ptLeader = qualified.sort((a, b) => b.pointsPercentage - a.pointsPercentage)[0];
            return ptLeader ? (
              <div className="px-5 py-3 border-b border-line">
                <div className="text-xs text-muted mb-2">Points % leader</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper text-xs">
                    {ptLeader.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-paper flex-1">{ptLeader.name}</span>
                  <span className="font-mono text-pitch">{ptLeader.pointsPercentage}%</span>
                </div>
              </div>
            ) : null;
          })()}

          {/* Top scorer */}
          {(() => {
            const topScorer = [...(leaderboard || [])].sort((a, b) => b.goals - a.goals)[0];
            return topScorer ? (
              <div className="px-5 py-3 border-b border-line">
                <div className="text-xs text-muted mb-2">Top scorer</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper text-xs">
                    {topScorer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-paper flex-1">{topScorer.name}</span>
                  <span className="font-mono text-[#4A90D9]">{topScorer.goals} goals</span>
                </div>
              </div>
            ) : null;
          })()}

          {/* Most matches */}
          {(() => {
            const mostPlayed = [...(leaderboard || [])].sort(
              (a, b) => b.matchesPlayed - a.matchesPlayed
            )[0];
            return mostPlayed ? (
              <div className="px-5 py-3">
                <div className="text-xs text-muted mb-2">Most played</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper text-xs">
                    {mostPlayed.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-paper flex-1">{mostPlayed.name}</span>
                  <span className="font-mono text-amber">{mostPlayed.matchesPlayed} played</span>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayers, useMatches, useDashboardStats, useLeaderboard } from '@/lib/hooks';
import { Match, Streak } from '@/lib/types';

import LoadingState from '@/components/ui/LoadingState';
import MatchListModal, { MatchListRow } from '@/components/ui/MatchListModal';
import MatchDetailModal from '../matches/MatchDetailModal';

/** Build modal rows for a streak, in the order the matches were played. */
function streakRows(streak: Streak | undefined, matches: Match[] | undefined): MatchListRow[] {
  if (!streak || !matches) return [];
  const byId = new Map(matches.map((m) => [m.id, m]));
  return streak.matchIds
    .map((id) => byId.get(id))
    .filter((m): m is Match => Boolean(m))
    .map((m) => ({
      matchId: m.id,
      label: m.gameWeek || `S${m.seasonYear}`,
      result: m.isDraw ? ('DRAW' as const) : ('WIN' as const),
      leftName: m.captainA?.name ?? 'Unknown',
      rightName: m.captainB?.name ?? 'Unknown',
      leftScore: m.scoreA,
      rightScore: m.scoreB,
    }));
}

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();

  const { data: players, isLoading: playersLoading } = usePlayers();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: leaderboard } = useLeaderboard(currentYear);

  const [openStreak, setOpenStreak] = useState<{ title: string; rows: MatchListRow[] } | null>(
    null
  );
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [previousStreak, setPreviousStreak] = useState<{
    title: string;
    rows: MatchListRow[];
  } | null>(null);

  const isLoading = playersLoading || matchesLoading || statsLoading;
  const currentSeasonMatches = matches?.filter((m) => m.seasonYear === currentYear) || [];
  const recentMatches = matches?.slice(0, 5) || [];

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  function openStreakModal(title: string, streak: Streak | undefined) {
    const rows = streakRows(streak, matches);
    if (rows.length > 0) setOpenStreak({ title, rows });
  }

  const cardClass =
    'bg-surface border border-line rounded-xl p-4 text-left w-full hover:border-muted/50 transition-colors';

  return (
    <div>
      {openStreak && !selectedMatchId && (
        <MatchListModal
          title={openStreak.title}
          subtitle={`${openStreak.rows.length} ${openStreak.rows.length === 1 ? 'match' : 'matches'}`}
          rows={openStreak.rows}
          onClose={() => setOpenStreak(null)}
          onMatchClick={(matchId) => {
            setPreviousStreak(openStreak);
            setOpenStreak(null);
            setSelectedMatchId(matchId);
          }}
        />
      )}

      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => {
            setSelectedMatchId(null);
            setPreviousStreak(null);
          }}
          onBack={
            previousStreak
              ? () => {
                  setSelectedMatchId(null);
                  setOpenStreak(previousStreak);
                  setPreviousStreak(null);
                }
              : undefined
          }
        />
      )}

      <div className="mb-10 pb-6 border-b border-line">
        <h1 className="font-display text-4xl text-paper">Dashboard</h1>
        <p className="text-sm text-muted mt-2">
          Monday Night Football &middot; Season {currentYear}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button onClick={() => router.push('/players')} className={cardClass}>
          <div className="text-xs text-muted mb-2">Squad size</div>
          <div className="text-3xl font-mono text-paper">{players?.length || 0}</div>
          <div className="text-xs text-muted mt-1.5">registered players</div>
        </button>

        <button onClick={() => router.push('/matches')} className={cardClass}>
          <div className="text-xs text-muted mb-2">Season {currentYear}</div>
          <div className="text-3xl font-mono text-paper">{currentSeasonMatches.length}</div>
          <div className="text-xs text-muted mt-1.5">matches played</div>
        </button>

        <button
          onClick={() =>
            openStreakModal(
              `${dashboardStats?.currentStreak.captainName}'s current run`,
              dashboardStats?.currentStreak
            )
          }
          className={cardClass}
        >
          <div className="text-xs text-muted mb-2">Current captain</div>
          <div className="text-lg text-pitch truncate">
            {dashboardStats?.currentWinningCaptain || '—'}
          </div>
          <div className="text-xs text-muted mt-1.5">winning captain</div>
        </button>

        <button
          onClick={() =>
            openStreakModal(
              `${dashboardStats?.currentStreak.captainName}'s current run`,
              dashboardStats?.currentStreak
            )
          }
          className={cardClass}
        >
          <div className="text-xs text-muted mb-2">Current streak</div>
          <div className="text-3xl font-mono text-amber">
            {dashboardStats?.currentStreak.length || 0}
          </div>
          <div className="text-xs text-muted mt-1.5">
            {dashboardStats?.currentStreak.captainName} unbeaten
          </div>
        </button>
      </div>

      {/* Captain streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() =>
            openStreakModal(
              `${dashboardStats?.longestCurrentSeasonStreak.captainName}'s ${currentYear} run`,
              dashboardStats?.longestCurrentSeasonStreak
            )
          }
          className="bg-surface border border-line rounded-xl p-5 text-left w-full hover:border-muted/50 transition-colors"
        >
          <h2 className="text-sm text-muted mb-4">Season {currentYear} longest unbeaten streak</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper font-display text-base shrink-0">
              {dashboardStats?.longestCurrentSeasonStreak.captainName?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-base text-paper">
                {dashboardStats?.longestCurrentSeasonStreak.captainName}
              </div>
              <div className="text-sm text-muted mt-0.5">as captain</div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl text-pitch">
                {dashboardStats?.longestCurrentSeasonStreak.length}
              </div>
              <div className="text-xs text-muted mt-0.5">matches</div>
            </div>
          </div>
        </button>

        <button
          onClick={() =>
            openStreakModal(
              `${dashboardStats?.longestAllTimeStreak.captainName}'s record run`,
              dashboardStats?.longestAllTimeStreak
            )
          }
          className="bg-surface border border-line rounded-xl p-5 text-left w-full hover:border-muted/50 transition-colors"
        >
          <h2 className="text-sm text-muted mb-4">All-time longest unbeaten streak</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper font-display text-base shrink-0">
              {dashboardStats?.longestAllTimeStreak.captainName?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-base text-paper">
                {dashboardStats?.longestAllTimeStreak.captainName}
              </div>
              <div className="text-sm text-muted mt-0.5">as captain</div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl text-amber">
                {dashboardStats?.longestAllTimeStreak.length}
              </div>
              <div className="text-xs text-muted mt-0.5">matches</div>
            </div>
          </div>
        </button>
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
              <div
                key={match.id}
                onClick={() => setSelectedMatchId(match.id)}
                className="px-5 py-3 border-b border-line last:border-0 hover:bg-surface-2 cursor-pointer transition-colors"
              >
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
            const ptLeader = [...qualified].sort(
              (a, b) => b.pointsPercentage - a.pointsPercentage
            )[0];
            return ptLeader ? (
              <div
                onClick={() => router.push(`/players/${ptLeader.playerId}`)}
                className="px-5 py-3 border-b border-line hover:bg-surface-2 cursor-pointer transition-colors"
              >
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
              <div
                onClick={() => router.push(`/players/${topScorer.playerId}`)}
                className="px-5 py-3 border-b border-line hover:bg-surface-2 cursor-pointer transition-colors"
              >
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
              <div
                onClick={() => router.push(`/players/${mostPlayed.playerId}`)}
                className="px-5 py-3 hover:bg-surface-2 cursor-pointer transition-colors"
              >
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

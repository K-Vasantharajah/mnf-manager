'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/lib/hooks';
import { PlayerLeaderboardEntry } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { CloseIcon } from '@/components/ui/icons';

import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

function getRatingColor(value: number) {
  if (value >= 8) return 'text-pitch';
  if (value >= 6) return 'text-amber';
  return 'text-signal';
}

function getPointsPercentageColor(value: number) {
  if (value >= 70) return 'text-pitch';
  if (value >= 40) return 'text-amber';
  return 'text-signal';
}

function getRankDisplay(rank: number, isTied: boolean): string {
  return isTied ? `=${rank}` : `${rank}`;
}

function RankBadge({ rank, isTied }: { rank: number; isTied: boolean }) {
  return (
    <span
      className={`text-sm font-mono min-w-6 text-center ${rank <= 3 ? 'text-amber' : 'text-muted'}`}
    >
      {getRankDisplay(rank, isTied)}
    </span>
  );
}

function LeaderboardTable({
  title,
  subtitle,
  entries,
  getValue,
  formatValue,
  colorFn,
  emptyMessage,
  onViewAll,
  onPlayerClick,
}: {
  title: string;
  subtitle?: string;
  entries: PlayerLeaderboardEntry[];
  getValue: (e: PlayerLeaderboardEntry) => number;
  formatValue: (e: PlayerLeaderboardEntry) => string;
  colorFn: (v: number) => string;
  emptyMessage?: string;
  onViewAll: () => void;
  onPlayerClick: (id: number) => void;
}) {
  const sorted = [...entries].sort((a, b) => getValue(b) - getValue(a));
  const valuesWithCounts = sorted.map((e) => ({ value: getValue(e) }));

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line">
        <h2 className="text-sm text-muted">{title}</h2>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        {entries.length > 10 && (
          <button onClick={onViewAll} className="text-xs text-pitch hover:opacity-80 mt-1">
            View all ({entries.length})
          </button>
        )}
      </div>
      {sorted.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted">
          {emptyMessage || 'No data yet'}
        </div>
      ) : (
        <div>
          {sorted.slice(0, 10).map((entry) => {
            const currentValue = getValue(entry);
            const rank = valuesWithCounts.filter((e) => e.value > currentValue).length + 1;
            const isTied = valuesWithCounts.filter((e) => e.value === currentValue).length > 1;

            return (
              <div
                key={entry.playerId}
                className="flex items-center gap-3 px-5 py-3 border-b border-line last:border-0 hover:bg-surface-2 transition-colors"
              >
                <RankBadge rank={rank} isTied={isTied} />
                <div className="w-7 h-7 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper text-xs shrink-0">
                  {entry.name.slice(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={() => onPlayerClick(entry.playerId)}
                  className="text-paper flex-1 text-left hover:text-pitch transition-colors"
                >
                  {entry.name}
                </button>
                <span className="text-xs font-mono text-muted mr-2">{entry.matchesPlayed}mp</span>
                <span className={`font-mono text-sm ${colorFn(currentValue)}`}>
                  {formatValue(entry)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RatingTable({
  title,
  entries,
  getValue,
  onViewAll,
  onPlayerClick,
}: {
  title: string;
  entries: PlayerLeaderboardEntry[];
  getValue: (e: PlayerLeaderboardEntry) => number;
  onViewAll: () => void;
  onPlayerClick: (id: number) => void;
}) {
  const sorted = [...entries].sort((a, b) => getValue(b) - getValue(a));
  const valuesWithCounts = sorted.map((e) => ({ value: getValue(e) }));

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line">
        <h2 className="text-sm text-muted">{title}</h2>
        {entries.length > 10 && (
          <button onClick={onViewAll} className="text-xs text-pitch hover:opacity-80 mt-1">
            View all ({entries.length})
          </button>
        )}
      </div>
      <div>
        {sorted.slice(0, 10).map((entry) => {
          const currentValue = getValue(entry);
          const rank = valuesWithCounts.filter((e) => e.value > currentValue).length + 1;
          const isTied = valuesWithCounts.filter((e) => e.value === currentValue).length > 1;

          return (
            <div
              key={entry.playerId}
              className="flex items-center gap-3 px-5 py-3 border-b border-line last:border-0 hover:bg-surface-2 transition-colors"
            >
              <RankBadge rank={rank} isTied={isTied} />
              <div className="w-7 h-7 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper text-xs shrink-0">
                {entry.name.slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={() => onPlayerClick(entry.playerId)}
                className="text-paper flex-1 text-left hover:text-pitch transition-colors"
              >
                {entry.name}
              </button>
              <span className={`font-mono text-sm ${getRatingColor(currentValue)}`}>
                {currentValue}/10
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardModal({
  data,
  onClose,
  onPlayerClick,
}: {
  data: {
    title: string;
    entries: PlayerLeaderboardEntry[];
    getValue: (e: PlayerLeaderboardEntry) => number;
    formatValue: (e: PlayerLeaderboardEntry) => string;
    colorFn: (v: number) => string;
  };
  onClose: () => void;
  onPlayerClick: (id: number) => void;
}) {
  const sorted = [...data.entries].sort((a, b) => data.getValue(b) - data.getValue(a));
  const valuesWithCounts = sorted.map((e) => ({ value: data.getValue(e) }));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <h2 className="text-paper">{data.title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-paper transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {sorted.map((entry) => {
            const currentValue = data.getValue(entry);
            const rank = valuesWithCounts.filter((e) => e.value > currentValue).length + 1;
            const isTied = valuesWithCounts.filter((e) => e.value === currentValue).length > 1;

            return (
              <div
                key={entry.playerId}
                className="flex items-center gap-3 px-5 py-3 border-b border-line last:border-0 hover:bg-surface-2 transition-colors"
              >
                <RankBadge rank={rank} isTied={isTied} />
                <div className="w-7 h-7 rounded-full bg-surface-2 border border-line flex items-center justify-center text-paper text-xs shrink-0">
                  {entry.name.slice(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onPlayerClick(entry.playerId);
                  }}
                  className="text-paper flex-1 text-left hover:text-pitch transition-colors text-sm"
                >
                  {entry.name}
                </button>
                <span className="text-xs font-mono text-muted mr-2">{entry.matchesPlayed}mp</span>
                <span className={`font-mono text-sm ${data.colorFn(currentValue)}`}>
                  {data.formatValue(entry)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [seasonYear, setSeasonYear] = useState<number | undefined>(2026);
  const { data: entries, isLoading, isError } = useLeaderboard(seasonYear);

  const [modalData, setModalData] = useState<{
    title: string;
    entries: PlayerLeaderboardEntry[];
    getValue: (e: PlayerLeaderboardEntry) => number;
    formatValue: (e: PlayerLeaderboardEntry) => string;
    colorFn: (v: number) => string;
  } | null>(null);

  const router = useRouter();

  if (isLoading) return <LoadingState message="Loading leaderboard..." />;
  if (isError) return <ErrorState message="Failed to load data. Is the backend running?" />;

  const allEntries = entries || [];
  const playedEntries = allEntries.filter((e) => e.matchesPlayed > 0);
  const qualifiedEntries = playedEntries.filter((e) =>
    seasonYear === undefined ? e.matchesPlayed >= 28 : e.matchesPlayed >= 14
  );
  const handlePlayerClick = (id: number) => {
    router.push(`/players/${id}`);
  };
  const ratedEntries = allEntries.filter((e) => e.attackRating != null);
  const showRatings = ratedEntries.length > 0;

  return (
    <div>
      {/* Modal */}
      {modalData && (
        <LeaderboardModal
          data={modalData}
          onClose={() => setModalData(null)}
          onPlayerClick={handlePlayerClick}
        />
      )}

      <div className="flex items-end justify-between mb-10 pb-6 border-b border-line">
        <div>
          <h1 className="font-display text-4xl text-paper">Leaderboard</h1>
          <p className="text-sm text-muted mt-2">{playedEntries.length} players with match data</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <LeaderboardTable
          title="Points percentage"
          subtitle="Min. 14 matches (season) · 28 matches (all time)"
          entries={qualifiedEntries}
          getValue={(e) => e.pointsPercentage}
          formatValue={(e) => `${e.pointsPercentage}%`}
          colorFn={getPointsPercentageColor}
          emptyMessage="Record more matches to qualify"
          onViewAll={() =>
            setModalData({
              title: 'Points percentage',
              entries: qualifiedEntries,
              getValue: (e) => e.pointsPercentage,
              formatValue: (e) => `${e.pointsPercentage}%`,
              colorFn: getPointsPercentageColor,
            })
          }
          onPlayerClick={handlePlayerClick}
        />
        <LeaderboardTable
          title="Goals scored"
          entries={playedEntries}
          getValue={(e) => e.goals}
          formatValue={(e) => `${e.goals} goals`}
          colorFn={(v) => (v > 0 ? 'text-pitch' : 'text-muted')}
          emptyMessage="No goals recorded yet"
          onViewAll={() =>
            setModalData({
              title: 'Goals scored',
              entries: playedEntries,
              getValue: (e) => e.goals,
              formatValue: (e) => `${e.goals} goals`,
              colorFn: (v) => (v > 0 ? 'text-pitch' : 'text-muted'),
            })
          }
          onPlayerClick={handlePlayerClick}
        />
        <LeaderboardTable
          title="Matches played"
          entries={playedEntries}
          getValue={(e) => e.matchesPlayed}
          formatValue={(e) => `${e.matchesPlayed} played`}
          colorFn={() => 'text-[#4A90D9]'}
          emptyMessage="No matches recorded yet"
          onViewAll={() =>
            setModalData({
              title: 'Matches played',
              entries: playedEntries,
              getValue: (e) => e.matchesPlayed,
              formatValue: (e) => `${e.matchesPlayed} played`,
              colorFn: () => 'text-[#4A90D9]',
            })
          }
          onPlayerClick={handlePlayerClick}
        />
      </div>

      {showRatings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <RatingTable
            title="Attack rating"
            entries={ratedEntries}
            getValue={(e) => e.attackRating ?? 0}
            onViewAll={() =>
              setModalData({
                title: 'Attack rating',
                entries: ratedEntries,
                getValue: (e) => e.attackRating ?? 0,
                formatValue: (e) => `${e.attackRating ?? 0}/10`,
                colorFn: getRatingColor,
              })
            }
            onPlayerClick={handlePlayerClick}
          />
          <RatingTable
            title="Defence rating"
            entries={ratedEntries}
            getValue={(e) => e.defenceRating ?? 0}
            onViewAll={() =>
              setModalData({
                title: 'Defence rating',
                entries: ratedEntries,
                getValue: (e) => e.defenceRating ?? 0,
                formatValue: (e) => `${e.defenceRating ?? 0}/10`,
                colorFn: getRatingColor,
              })
            }
            onPlayerClick={handlePlayerClick}
          />
          <RatingTable
            title="Reliability rating"
            entries={ratedEntries}
            getValue={(e) => e.reliability ?? 0}
            onViewAll={() =>
              setModalData({
                title: 'Reliability rating',
                entries: ratedEntries,
                getValue: (e) => e.reliability ?? 0,
                formatValue: (e) => `${e.reliability ?? 0}/10`,
                colorFn: getRatingColor,
              })
            }
            onPlayerClick={handlePlayerClick}
          />
        </div>
      )}
    </div>
  );
}

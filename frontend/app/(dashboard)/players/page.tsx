'use client';

import { useAllPlayers } from '@/lib/hooks';
import { Player } from '@/lib/types';
import Link from 'next/link';
import { useState } from 'react';

import RatingBar from '@/components/ui/RatingBar';
import DeltaBadge from '@/components/ui/DeltaBadge';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

const POSITION_GROUPS = {
  All: null,
  GK: ['GK'],
  Defence: ['CB', 'LB', 'RB'],
  Midfield: ['CDM', 'CM', 'CAM'],
  Attack: ['LW', 'RW', 'ST'],
};

function PlayerCard({ player, showRatings }: { player: Player; showRatings: boolean }) {
  const initials = player.name.slice(0, 2).toUpperCase();
  return (
    <Link href={`/players/${player.id}`}>
      <div
        className={`bg-surface border border-line rounded-xl p-5 hover:border-muted/50 transition-colors cursor-pointer ${!player.active ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-display shrink-0 border ${
              player.active
                ? 'bg-surface-2 border-line text-paper'
                : 'bg-line border-line text-muted'
            }`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-paper truncate">{player.name}</div>
            {!player.active && <div className="text-xs text-muted">Inactive</div>}
          </div>
          {player.rating?.overallRating && (
            <div className="relative shrink-0">
              <div className="flex flex-col items-center justify-center w-9 h-9 rounded-full border-2 border-pitch text-pitch">
                <span className="text-sm font-mono leading-none">
                  {player.rating.overallRating}
                </span>
              </div>
              {player.rating.overallDelta !== null && player.rating.overallDelta !== 0 && (
                <span
                  className={`absolute -top-1 -right-2 text-xs font-mono ${
                    player.rating.overallDelta > 0 ? 'text-pitch' : 'text-signal'
                  }`}
                >
                  {player.rating.overallDelta > 0
                    ? `+${player.rating.overallDelta}`
                    : player.rating.overallDelta}
                </span>
              )}
            </div>
          )}
          {player.position && player.position !== 'UNKNOWN' && (
            <span className="text-xs bg-pitch/15 text-pitch font-mono px-2 py-0.5 rounded">
              {player.position}
            </span>
          )}
        </div>

        {player.rating?.overallRating ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted w-20">Attack</span>
              <RatingBar value={player.rating.attackRating || 0} color="bg-red-400" />
              <DeltaBadge delta={player.rating.attackDelta} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted w-20">Defence</span>
              <RatingBar value={player.rating.defenceRating || 0} color="bg-blue-500" />
              <DeltaBadge delta={player.rating.defenceDelta} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted w-20">Reliability</span>
              <RatingBar value={player.rating.reliability || 0} color="bg-green-500" />
              <DeltaBadge delta={player.rating.reliabilityDelta} />
            </div>
          </div>
        ) : showRatings ? (
          <div className="text-xs text-muted text-center py-2">
            {player.active ? 'Needs 10+ matches for ML rating' : 'No ratings yet'}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function PlayersPage() {
  const { data: players, isLoading, isError } = useAllPlayers();
  const [positionFilter, setPositionFilter] = useState<string>('All');
  const [showInactive, setShowInactive] = useState(false);

  if (isLoading) return <LoadingState message="Loading squad..." />;

  if (isError) return <ErrorState message="Failed to load players." />;

  const filteredPlayers = (players || []).filter((p) => {
    if (!showInactive && !p.active) return false;
    if (positionFilter === 'All') return true;
    const positions = POSITION_GROUPS[positionFilter as keyof typeof POSITION_GROUPS];
    return positions ? positions.includes(p.position || '') : true;
  });

  const showRatings = players?.some((p) => p.rating !== null) ?? false;

  return (
    <div>
      <div className="mb-4 pb-6 border-b border-line">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-paper">Players</h1>
            <p className="text-sm text-muted mt-2">{filteredPlayers.length} players</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="accent-pitch"
            />
            Show inactive
          </label>
        </div>
        {showRatings && (
          <p className="text-xs text-muted mt-3">
            Ratings are derived from match outcomes using a ridge regression model. They reflect
            your team&apos;s performance when you&apos;re on the pitch, not individual skill in
            isolation. Ratings mature over time as more match data is collected.
          </p>
        )}
      </div>

      {/* Position filter */}
      <div className="flex gap-2 my-6 flex-wrap">
        {Object.keys(POSITION_GROUPS).map((group) => (
          <button
            key={group}
            onClick={() => setPositionFilter(group)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              positionFilter === group
                ? 'bg-pitch text-ink'
                : 'bg-surface border border-line text-muted hover:text-paper hover:border-pitch/50'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} showRatings={showRatings} />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-16 text-muted">No players found for this filter</div>
      )}
    </div>
  );
}

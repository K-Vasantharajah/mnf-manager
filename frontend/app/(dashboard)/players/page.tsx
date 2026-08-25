'use client';

import { usePlayers } from '@/lib/hooks';
import { Player } from '@/lib/types';
import Link from 'next/link';


function RatingBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-16">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-xs font-semibold min-w-4 text-right">{value}</span>
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  const initials = player.name.slice(0, 2).toUpperCase();

  return (
    <Link href={`/players/${player.id}`}>
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{player.name}</div>
            <div className="text-xs text-gray-400">{player.notes}</div>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
              {player.strongFoot} foot
            </span>
          </div>
        </div>

        {player.rating ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20">Ability</span>
              <RatingBar value={player.rating.ability} color="bg-green-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20">Reliability</span>
              <RatingBar
                value={player.rating.reliability}
                color={
                  player.rating.reliability >= 8
                    ? 'bg-green-500'
                    : player.rating.reliability >= 6
                    ? 'bg-amber-400'
                    : 'bg-red-400'
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20">Goal threat</span>
              <RatingBar value={player.rating.goalThreat} color="bg-blue-500" />
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
            No ratings yet
          </div>
        )}
      </div>
    </Link>
  );
}

export default function PlayersPage() {
  const { data: players, isLoading, isError } = usePlayers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading squad...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Failed to load players. Is the backend running?</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Squad</h1>
          <p className="text-sm text-gray-400 mt-1">
            {players?.length} players · 2026 season
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players?.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
'use client';

import { useAllPlayers } from '@/lib/hooks';
import { Player } from '@/lib/types';
import Link from 'next/link';
import { useState } from 'react';

const POSITION_GROUPS = {
  'All': null,
  'GK': ['GK'],
  'Defence': ['CB', 'LB', 'RB'],
  'Midfield': ['CDM', 'CM', 'CAM'],
  'Attack': ['LW', 'RW', 'ST'],
};

function RatingBar({ value, color }: { value: number; color: string }) {
  const colorMap: Record<string, string> = {
    'bg-red-400': '#f87171',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
  };

  const bgColor = colorMap[color] || '#22c55e';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ flexGrow: 1, backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
        <div
          style={{ 
            width: `${value * 10}%`,
            backgroundColor: bgColor,
            height: '6px',
          }}
        />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '16px', textAlign: 'right', color: '#111827' }}>{value}</span>
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  const initials = player.name.slice(0, 2).toUpperCase();

  return (
    <Link href={`/players/${player.id}`}>
      <div className={`bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer ${!player.active ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${player.active ? 'bg-green-700' : 'bg-gray-400'}`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{player.name}</div>
            {!player.active && (
              <div className="text-xs text-gray-400">Inactive</div>
            )}
          </div>
          {player.position && player.position !== 'UNKNOWN' && (
            <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">
              {player.position}
            </span>
          )}
        </div>

        {player.rating?.overallRating ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium w-20">⚔️ Attack</span>
              <RatingBar value={player.rating.attackRating || 0} color="bg-red-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium w-20">🛡️ Defence</span>
              <RatingBar value={player.rating.defenceRating || 0} color="bg-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium w-20">📅 Reliability</span>
              <RatingBar value={player.rating.reliability || 0} color="bg-green-500" />
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
            {player.active ? 'Needs 10+ matches for ML rating' : 'No ratings yet'}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function PlayersPage() {
  const { data: players, isLoading, isError } = useAllPlayers();
  const [positionFilter, setPositionFilter] = useState<string>('All');
  const [showInactive, setShowInactive] = useState(false);

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

  const filteredPlayers = (players || []).filter(p => {
    if (!showInactive && !p.active) return false;
    if (positionFilter === 'All') return true;
    const positions = POSITION_GROUPS[positionFilter as keyof typeof POSITION_GROUPS];
    return positions ? positions.includes(p.position || '') : true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredPlayers.length} players
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-green-600"
          />
          Show inactive
        </label>
      </div>

      {/* Position filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.keys(POSITION_GROUPS).map(group => (
          <button
            key={group}
            onClick={() => setPositionFilter(group)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              positionFilter === group
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No players found for this filter
        </div>
      )}
    </div>
  );
}
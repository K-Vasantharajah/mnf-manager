'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlayerProfile } from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

function RatingBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-sm font-bold min-w-6 text-right">{value}/10</span>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const playerId = Number(params.id);

  const { data: profile, isLoading, isError } = usePlayerProfile(playerId);

  const [editingRatings, setEditingRatings] = useState(false);
  const [ability, setAbility] = useState<number>(0);
  const [reliability, setReliability] = useState<number>(0);
  const [goalThreat, setGoalThreat] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setAbility(profile?.ability || 0);
    setReliability(profile?.reliability || 0);
    setGoalThreat(profile?.goalThreat || 0);
    setEditingRatings(true);
  }

  async function saveRatings() {
    setSaving(true);
    try {
      await api.post(`/api/v1/players/${playerId}/ratings`, {
        ability,
        reliability,
        goalThreat,
        ratedBy: 'Kobi',
      });
      await queryClient.invalidateQueries({ queryKey: ['players', playerId, 'profile'] });
      setEditingRatings(false);
    } catch {
      alert('Failed to save ratings');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading player profile...</div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Failed to load player. Is the backend running?</div>
      </div>
    );
  }

  const winRateColor = profile.careerStats.careerWinRate >= 60
    ? 'text-green-600'
    : profile.careerStats.careerWinRate >= 40
    ? 'text-amber-500'
    : 'text-red-400';

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => router.push('/players')}
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
      >
        ← All players
      </button>

      {/* Player header */}
      <div className="bg-green-900 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-2xl font-black flex-shrink-0">
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{profile.name}</h1>
            <p className="text-green-300 text-sm mt-1">{profile.notes}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-green-800 text-green-200 text-xs px-2 py-1 rounded-lg">
                {profile.strongFoot} foot
              </span>
              <span className={`text-xs px-2 py-1 rounded-lg ${
                profile.active
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {profile.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black ${winRateColor}`}>
              {profile.careerStats.careerWinRate}%
            </div>
            <div className="text-green-300 text-xs">career win rate</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Career stats */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Career stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Matches" value={profile.careerStats.totalMatches} />
            <StatCard
              label="Win rate"
              value={`${profile.careerStats.careerWinRate}%`}
              sub={`${profile.careerStats.totalWins}W ${profile.careerStats.totalDraws}D ${profile.careerStats.totalLosses}L`}
            />
            <StatCard label="Goals" value={profile.careerStats.totalGoals} />
            <StatCard
              label="Goals per game"
              value={profile.careerStats.careerGoalsPerGame}
            />
          </div>
        </div>

        {/* Ratings */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Ratings</h2>
            {!editingRatings ? (
              <button
                onClick={startEditing}
                className="text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 px-3 py-1 rounded-lg"
              >
                Edit ratings
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingRatings(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRatings}
                  disabled={saving}
                  className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {!editingRatings ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Ability</span>
                </div>
                <RatingBar value={profile.ability || 0} color="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Reliability</span>
                </div>
                <RatingBar
                  value={profile.reliability || 0}
                  color={
                    (profile.reliability || 0) >= 8
                      ? 'bg-green-500'
                      : (profile.reliability || 0) >= 6
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Goal threat</span>
                </div>
                <RatingBar value={profile.goalThreat || 0} color="bg-purple-500" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Ability</span>
                    <span className="text-sm font-bold text-gray-900">{ability}/10</span>
                </div>
                <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={ability}
                    onChange={(e) => setAbility(Number(e.target.value))}
                    className="w-full accent-green-600"
                />
                </div>
                <div>
                <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Reliability</span>
                    <span className="text-sm font-bold text-gray-900">{reliability}/10</span>
                </div>
                <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={reliability}
                    onChange={(e) => setReliability(Number(e.target.value))}
                    className="w-full accent-green-600"
                />
                </div>
                <div>
                <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Goal threat</span>
                    <span className="text-sm font-bold text-gray-900">{goalThreat}/10</span>
                </div>
                <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={goalThreat}
                    onChange={(e) => setGoalThreat(Number(e.target.value))}
                    className="w-full accent-green-600"
                />
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Season breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Season breakdown</h2>
        {profile.seasonStats.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No match data yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs text-gray-400 font-medium uppercase">Season</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 font-medium uppercase">Played</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 font-medium uppercase">W</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 font-medium uppercase">D</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 font-medium uppercase">L</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 font-medium uppercase">Goals</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 font-medium uppercase">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {profile.seasonStats.map((s) => (
                  <tr key={s.seasonYear} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-semibold text-gray-900">{s.seasonYear}</td>
                    <td className="py-3 px-3 text-center text-gray-600">{s.matchesPlayed}</td>
                    <td className="py-3 px-3 text-center text-green-600 font-medium">{s.wins}</td>
                    <td className="py-3 px-3 text-center text-amber-500 font-medium">{s.draws}</td>
                    <td className="py-3 px-3 text-center text-red-400 font-medium">{s.losses}</td>
                    <td className="py-3 px-3 text-center text-gray-600">{s.goals}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-bold ${
                        s.winRate >= 60 ? 'text-green-600' :
                        s.winRate >= 40 ? 'text-amber-500' : 'text-red-400'
                      }`}>
                        {s.winRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
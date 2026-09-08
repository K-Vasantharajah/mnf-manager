'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlayerMatches, usePlayerProfile } from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import MatchDetailModal from '../../matches/MatchDetailModal';

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

function PlayerMatchHistoryModal({
  playerId,
  seasonYear,
  onClose,
  onMatchClick,
}: {
  playerId: number;
  seasonYear: number;
  onClose: () => void;
  onMatchClick: (matchId: number) => void;
}) {
  const { data: matches, isLoading } = usePlayerMatches(playerId, seasonYear);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Season {seasonYear} matches</h2>
            <p className="text-xs text-gray-400 mt-0.5">{matches?.length || 0} matches</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : (
            matches?.map((match) => (
              <div
                key={match.id}
                className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  onClose();
                  onMatchClick(match.id);
                }}
              >
                <span className="text-xs text-gray-400 min-w-10">
                  {match.gameWeek || `S${match.seasonYear}`}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-10 text-center ${
                  match.result === 'WIN' ? 'bg-green-100 text-green-700' :
                  match.result === 'DRAW' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-500'
                }`}>
                  {match.result}
                </span>
                <span className="text-sm flex-1 text-gray-600">
                  {match.captainAName} vs {match.captainBName}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {match.scoreA} — {match.scoreB}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const playerId = Number(params.id);

  const { data: profile, isLoading, isError } = usePlayerProfile(playerId);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStrongFoot, setEditStrongFoot] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingRatings, setEditingRatings] = useState(false);
  const [ability, setAbility] = useState<number>(0);
  const [reliability, setReliability] = useState<number>(0);
  const [goalThreat, setGoalThreat] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  function startEditing() {
    setAbility(profile?.ability || 0);
    setReliability(profile?.reliability || 0);
    setGoalThreat(profile?.goalThreat || 0);
    setEditingRatings(true);
  }

  function startEditingProfile() {
    setEditName(profile?.name || '');
    setEditStrongFoot(profile?.strongFoot || 'Right');
    setEditPosition(profile?.position || 'UNKNOWN');
    setEditActive(profile?.active ?? true);
    setEditingProfile(true);
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await api.put(`/api/v1/players/${playerId}`, {
        name: editName,
        strongFoot: editStrongFoot,
        active: editActive,
        position: editPosition,
        notes: profile?.notes || '',
      });
      await queryClient.invalidateQueries({ queryKey: ['players', playerId, 'profile'] });
      await queryClient.invalidateQueries({ queryKey: ['players', 'all'] });
      setEditingProfile(false);
    } catch {
      alert('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
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

  const pointPercentageColor = profile.careerStats.careerPointsPercentage >= 60
    ? 'text-green-600'
    : profile.careerStats.careerPointsPercentage >= 40
    ? 'text-amber-500'
    : 'text-red-400';

  return (
    <div className="max-w-4xl">
      {selectedSeasonYear && !selectedMatchId && (
        <PlayerMatchHistoryModal
          playerId={playerId}
          seasonYear={selectedSeasonYear}
          onClose={() => setSelectedSeasonYear(null)}
          onMatchClick={(matchId) => {
            setSelectedSeasonYear(null);
            setSelectedMatchId(matchId);
          }}
        />
      )}

      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
          onBack={() => {
            setSelectedMatchId(null);
            setSelectedSeasonYear(selectedSeasonYear);
          }}
        />
      )}
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
            <div className={`text-4xl font-black ${pointPercentageColor}`}>
              {profile.careerStats.careerPointsPercentage}%
            </div>
            <div className="text-green-300 text-xs">career pt %</div>
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
              label="Pt %"
              value={`${profile.careerStats.careerPointsPercentage}%`}
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

      {/* Profile edit card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Profile</h2>
          {!editingProfile ? (
            <button
              onClick={startEditingProfile}
              className="text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 px-3 py-1 rounded-lg"
            >
              Edit profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingProfile(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {!editingProfile ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Position</span>
              <span className="font-medium text-gray-900">
                {profile.position && profile.position !== 'UNKNOWN' ? profile.position : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Strong foot</span>
              <span className="font-medium text-gray-900">{profile.strongFoot}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <span className={`font-medium ${profile.active ? 'text-green-600' : 'text-gray-400'}`}>
                {profile.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Position</label>
              <select
                value={editPosition}
                onChange={(e) => setEditPosition(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="GK">GK — Goalkeeper</option>
                <option value="CB">CB — Centre Back</option>
                <option value="LB">LB — Left Back</option>
                <option value="RB">RB — Right Back</option>
                <option value="CDM">CDM — Defensive Mid</option>
                <option value="CM">CM — Central Mid</option>
                <option value="CAM">CAM — Attacking Mid</option>
                <option value="LW">LW — Left Wing</option>
                <option value="RW">RW — Right Wing</option>
                <option value="ST">ST — Striker</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Strong foot</label>
              <select
                value={editStrongFoot}
                onChange={(e) => setEditStrongFoot(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="accent-green-600"
                id="active-toggle"
              />
              <label htmlFor="active-toggle" className="text-sm text-gray-600 cursor-pointer">
                Active player
              </label>
            </div>
          </div>
        )}
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
                  <th className="text-center py-2 px-3 text-xs text-gray-400 font-medium uppercase">Pt %</th>
                </tr>
              </thead>
              <tbody>
                {profile.seasonStats.map((s) => (
                  <tr 
                  key={s.seasonYear} 
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedSeasonYear(s.seasonYear)}
                  >
                    <td className="py-3 px-3 font-semibold text-gray-900">{s.seasonYear}</td>
                    <td className="py-3 px-3 text-center text-gray-600">{s.matchesPlayed}</td>
                    <td className="py-3 px-3 text-center text-green-600 font-medium">{s.wins}</td>
                    <td className="py-3 px-3 text-center text-amber-500 font-medium">{s.draws}</td>
                    <td className="py-3 px-3 text-center text-red-400 font-medium">{s.losses}</td>
                    <td className="py-3 px-3 text-center text-gray-600">{s.goals}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-bold ${
                        s.pointsPercentage >= 60 ? 'text-green-600' :
                        s.pointsPercentage >= 40 ? 'text-amber-500' : 'text-red-400'
                      }`}>
                        {s.pointsPercentage}%
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
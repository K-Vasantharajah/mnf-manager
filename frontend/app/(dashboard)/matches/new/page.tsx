'use client';

import { useState } from 'react';
import { usePlayers } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface GoalScorerEntry {
  playerId: number;
  goals: number;
  team: 'A' | 'B';
}

export default function NewMatchPage() {
  const router = useRouter();
  const { data: players } = usePlayers();
  const queryClient = useQueryClient();

  const [matchDate, setMatchDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [seasonYear, setSeasonYear] = useState(2026);
  const [captainAId, setCaptainAId] = useState<number | ''>('');
  const [captainBId, setCaptainBId] = useState<number | ''>('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [durationMins, setDurationMins] = useState(60);
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<number[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<number[]>([]);
  const [goalScorers, setGoalScorers] = useState<GoalScorerEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePlayers = players || [];

  function toggleTeamPlayer(playerId: number, team: 'A' | 'B') {
    if (team === 'A') {
      setTeamAPlayerIds((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId]
      );
    } else {
      setTeamBPlayerIds((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId]
      );
    }
  }

  function addGoalScorer(playerId: number, team: 'A' | 'B') {
    const existing = goalScorers.find((g) => g.playerId === playerId);
    if (existing) return;
    setGoalScorers((prev) => [...prev, { playerId, goals: 1, team }]);
  }

  function updateGoals(playerId: number, goals: number) {
    setGoalScorers((prev) =>
      prev.map((g) => (g.playerId === playerId ? { ...g, goals } : g))
    );
  }

  function removeGoalScorer(playerId: number) {
    setGoalScorers((prev) => prev.filter((g) => g.playerId !== playerId));
  }

  function getPlayerName(id: number) {
    return activePlayers.find((p) => p.id === id)?.name || 'Unknown';
  }

  async function handleSubmit() {
    if (!captainAId || !captainBId) {
      setError('Please select both captains');
      return;
    }
    if (captainAId === captainBId) {
      setError('Captains must be different players');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/api/v1/matches', {
        matchDate,
        seasonYear,
        captainAId,
        captainBId,
        scoreA,
        scoreB,
        durationMins,
        teamAPlayerIds,
        teamBPlayerIds,
        goalScorers,
      });
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      router.push('/matches');
    } catch {
      setError('Failed to save match. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Record a match</h1>
        <p className="text-sm text-gray-400 mt-1">
          Enter the result from Monday night
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Match details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Match details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Date</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Season</label>
            <input
              type="number"
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Duration (mins)</label>
            <input
              type="number"
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Captains and score */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Captains and score</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Captain A</label>
            <select
              value={captainAId}
              onChange={(e) => setCaptainAId(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="">Select captain</option>
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 pb-0.5">
            <div className="text-center">
              <label className="text-xs text-gray-400 block mb-1">Score A</label>
              <input
                type="number"
                min={0}
                value={scoreA}
                onChange={(e) => setScoreA(Number(e.target.value))}
                className="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              />
            </div>
            <span className="text-gray-300 text-lg font-light mb-2">—</span>
            <div className="text-center">
              <label className="text-xs text-gray-400 block mb-1">Score B</label>
              <input
                type="number"
                min={0}
                value={scoreB}
                onChange={(e) => setScoreB(Number(e.target.value))}
                className="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Captain B</label>
            <select
              value={captainBId}
              onChange={(e) => setCaptainBId(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="">Select captain</option>
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Team selection */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {(['A', 'B'] as const).map((team) => {
          const captainId = team === 'A' ? captainAId : captainBId;
          const captainName = captainId ? getPlayerName(Number(captainId)) : `Team ${team}`;
          const teamPlayerIds = team === 'A' ? teamAPlayerIds : teamBPlayerIds;

          return (
            <div key={team} className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">
                {captainName}&apos;s team
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                {teamPlayerIds.length} players selected
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {activePlayers.map((player) => {
                  const selected = teamPlayerIds.includes(player.id);
                  const onOtherTeam =
                    team === 'A'
                      ? teamBPlayerIds.includes(player.id)
                      : teamAPlayerIds.includes(player.id);

                  return (
                    <button
                      key={player.id}
                      onClick={() => !onOtherTeam && toggleTeamPlayer(player.id, team)}
                      disabled={onOtherTeam}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        selected
                          ? 'bg-green-50 text-green-700 font-medium'
                          : onOtherTeam
                          ? 'opacity-30 cursor-not-allowed text-gray-400'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${
                          selected
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {selected && '✓'}
                      </div>
                      {player.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal scorers */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Goal scorers</h2>

        {goalScorers.length > 0 && (
          <div className="mb-4 space-y-2">
            {goalScorers.map((gs) => (
              <div key={gs.playerId} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-gray-900 flex-1">
                  {getPlayerName(gs.playerId)}
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    gs.team === 'A' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Team {gs.team}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateGoals(gs.playerId, Math.max(1, gs.goals - 1))}
                    className="w-7 h-7 rounded bg-gray-200 text-gray-800 text-sm font-bold hover:bg-gray-300 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-gray-900 min-w-4 text-center">{gs.goals}</span>
                  <button
                    onClick={() => updateGoals(gs.playerId, gs.goals + 1)}
                    className="w-7 h-7 rounded bg-gray-200 text-gray-800 text-sm font-bold hover:bg-gray-300 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeGoalScorer(gs.playerId)}
                  className="text-red-500 hover:text-red-700 text-sm ml-2 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(['A', 'B'] as const).map((team) => {
            const teamPlayerIds = team === 'A' ? teamAPlayerIds : teamBPlayerIds;
            const captainId = team === 'A' ? captainAId : captainBId;
            const captainName = captainId ? getPlayerName(Number(captainId)) : `Team ${team}`;
            const availablePlayers = activePlayers.filter(
              (p) => teamPlayerIds.includes(p.id) && !goalScorers.find((g) => g.playerId === p.id)
            );

            return (
              <div key={team}>
                <p className="text-xs text-gray-400 mb-2">{captainName}&apos;s team scorers</p>
                {availablePlayers.length === 0 ? (
                  <p className="text-xs text-gray-300 italic">
                    {teamPlayerIds.length === 0
                      ? 'Select team players first'
                      : 'All players added'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {availablePlayers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addGoalScorer(p.id, team)}
                        className="w-full text-left text-sm px-3 py-1.5 rounded-lg hover:bg-green-50 hover:text-green-700 text-gray-700 transition-colors"
                      >
                        + {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/matches')}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save match'}
        </button>
      </div>
    </div>
  );
}
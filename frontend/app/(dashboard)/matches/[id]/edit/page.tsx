'use client';

import { useState, useRef } from 'react';
import { usePlayers, useMatchDetail  } from '@/lib/hooks';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface GoalScorerEntry {
  playerId: number;
  goals: number;
  team: 'A' | 'B';
  isOwnGoal: boolean;
}

export default function EditMatchPage() {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.id);
  const queryClient = useQueryClient();
  const { data: players } = usePlayers();
  const { data: match, isLoading } = useMatchDetail (matchId);

  const [matchDate, setMatchDate] = useState('');
  const seasonYear = matchDate ? new Date(matchDate).getFullYear() : new Date().getFullYear();
  const [gameWeek, setGameWeek] = useState('');
  const [captainAId, setCaptainAId] = useState<number | ''>('');
  const [captainBId, setCaptainBId] = useState<number | ''>('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<number[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<number[]>([]);
  const [goalScorers, setGoalScorers] = useState<GoalScorerEntry[]>([]);
  const [initialised, setInitialised] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  if (match && !initialised) {
    setMatchDate(match.matchDate ? match.matchDate.toString().split('T')[0] : '');
    setGameWeek(match.gameWeek || '');
    setCaptainAId(match.captainAId);
    setCaptainBId(match.captainBId);
    setScoreA(match.scoreA);
    setScoreB(match.scoreB);
    setTeamAPlayerIds(match.teamAPlayers?.map(p => p.playerId) || []);
    setTeamBPlayerIds(match.teamBPlayers?.map(p => p.playerId) || []);
    setGoalScorers(
      (match.goalScorers || []).map((gs) => ({
        playerId: gs.playerId,
        goals: gs.goals,
        team: gs.team,
        isOwnGoal: gs.isOwnGoal || false,
      }))
    );
    setInitialised(true);
  }

  const activePlayers = players || [];

  async function handleAddPlayer() {
    if (!newPlayerName.trim()) return;
    setAddingPlayer(true);
    try {
      await api.post('/api/v1/players', {
        name: newPlayerName.trim(),
        strongFoot: 'Right',
        active: true,
        notes: 'Added during match recording',
      });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
      await queryClient.invalidateQueries({ queryKey: ['players', 'all'] });
      setNewPlayerName('');
      setShowAddPlayer(false);
    } catch {
      alert('Failed to add player');
    } finally {
      setAddingPlayer(false);
    }
  }

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

  function addGoalScorer(playerId: number, team: 'A' | 'B', isOwnGoal: boolean = false) {
    const existing = goalScorers.find((g) => g.playerId === playerId && g.isOwnGoal === isOwnGoal);
    if (existing) return;
    setGoalScorers((prev) => [...prev, { playerId, goals: 1, team, isOwnGoal }]);
  }

  function updateGoals(index: number, goals: number) {
    setGoalScorers((prev) =>
      prev.map((g, i) => (i === index ? { ...g, goals } : g))
    );
  }

  function removeGoalScorer(index: number) {
    setGoalScorers((prev) => prev.filter((_, i) => i !== index));
  }

  function getPlayerName(id: number) {
    return activePlayers.find((p) => p.id === id)?.name || 'Unknown';
  }

  function showError(message: string) {
    setError(message);
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  async function handleSubmit() {
    if (!captainAId || !captainBId) {
      showError('Please select both captains');
      return;
    }
    if (captainAId === captainBId) {
      showError('Captains must be different players');
      return;
    }
    
    if (goalScorers.length > 0 && !goalsMatch) {
      showError(`Goals attributed (${teamAGoals}-${teamBGoals}) don't match the score (${scoreA}-${scoreB})`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.put(`/api/v1/matches/${matchId}`, {
        matchDate,
        seasonYear,
        gameWeek,
        captainAId,
        captainBId,
        scoreA,
        scoreB,
        teamAPlayerIds,
        teamBPlayerIds,
        goalScorers: goalScorers.map(gs => ({
          playerId: gs.playerId,
          goals: gs.goals,
          team: gs.team,
          isOwnGoal: gs.isOwnGoal,
        })),
      });
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      router.push('/matches');
    } catch {
      showError('Failed to update match. Please try again.');
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading match...</div>
      </div>
    );
  }

  const teamAGoals = goalScorers
    .filter(gs => gs.team === 'A' && !gs.isOwnGoal)
    .reduce((sum, gs) => sum + gs.goals, 0) +
    goalScorers
    .filter(gs => gs.team === 'B' && gs.isOwnGoal)
    .reduce((sum, gs) => sum + gs.goals, 0);

  const teamBGoals = goalScorers
    .filter(gs => gs.team === 'B' && !gs.isOwnGoal)
    .reduce((sum, gs) => sum + gs.goals, 0) +
    goalScorers
    .filter(gs => gs.team === 'A' && gs.isOwnGoal)
    .reduce((sum, gs) => sum + gs.goals, 0);

  const goalsMatch = teamAGoals === scoreA && teamBGoals === scoreB;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit match</h1>
        <p className="text-sm text-gray-400 mt-1">
          Update the match details, teams and goal scorers
        </p>
      </div>

      {error && (
        <div
          ref={errorRef}
          className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* Match details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Match details</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Date</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Game week</label>
            <input
              type="text"
              value={gameWeek}
              onChange={(e) => setGameWeek(e.target.value)}
              placeholder="e.g. GW29"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Captains and score */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Captains and score</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-600 block mb-1">Captain A</label>
            <select
              value={captainAId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setCaptainAId(id);
                if (id) {
                  setTeamAPlayerIds(prev =>
                    prev.includes(id) ? prev : [...prev, id]
                  );
                }
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select captain</option>
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 pb-0.5">
            <div className="text-center">
              <label className="text-xs text-gray-600 block mb-1">Score A</label>
              <input
                type="number"
                min={0}
                value={scoreA}
                onChange={(e) => setScoreA(Number(e.target.value))}
                className="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <span className="text-gray-300 text-lg font-light mb-2">—</span>
            <div className="text-center">
              <label className="text-xs text-gray-600 block mb-1">Score B</label>
              <input
                type="number"
                min={0}
                value={scoreB}
                onChange={(e) => setScoreB(Number(e.target.value))}
                className="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-xs text-gray-600 block mb-1">Captain B</label>
            <select
              value={captainBId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setCaptainBId(id);
                if (id) {
                  setTeamBPlayerIds(prev =>
                    prev.includes(id) ? prev : [...prev, id]
                  );
                }
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
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
          const captainName = captainId
            ? getPlayerName(Number(captainId))
            : `Team ${team}`;
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
                      type="button"
                      key={player.id}
                      onClick={() => {
                        const isCaptain = player.id === Number(captainAId) || player.id === Number(captainBId);
                        if (!isCaptain && !onOtherTeam) toggleTeamPlayer(player.id, team);
                      }}
                      disabled={onOtherTeam || (team === 'A' && player.id === Number(captainAId)) || (team === 'B' && player.id === Number(captainBId))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        selected
                          ? 'bg-green-50 text-green-700 font-medium'
                          : onOtherTeam
                          ? 'opacity-30 cursor-not-allowed text-gray-400'
                          : (team === 'A' && player.id === Number(captainAId)) || (team === 'B' && player.id === Number(captainBId))
                          ? 'bg-green-50 text-green-700 font-medium cursor-not-allowed'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center text-xs ${
                        selected
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {selected && '✓'}
                      </div>
                      {player.name}
                      {((team === 'A' && player.id === Number(captainAId)) || (team === 'B' && player.id === Number(captainBId))) && (
                        <span className="ml-auto text-xs text-green-600 font-medium">Captain</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new players */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">New player?</h2>
          <button
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 px-3 py-1 rounded-lg"
          >
            {showAddPlayer ? 'Cancel' : '+ Add player'}
          </button>
        </div>
        {showAddPlayer && (
          <div className="flex items-center gap-3 mt-4">
            <input
              type="text"
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleAddPlayer}
              disabled={addingPlayer || !newPlayerName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {addingPlayer ? 'Adding...' : 'Add'}
            </button>
          </div>
        )}
      </div>

      {/* Goal scorers */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Goal scorers</h2>
        {goalScorers.length > 0 && (
          <div className="mb-4 space-y-2">
            {goalScorers.map((gs, index) => (
              <div
                key={`${gs.playerId}-${gs.isOwnGoal}-${index}`}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              >
                <span className="text-sm font-semibold text-gray-900 flex-1">
                  {getPlayerName(gs.playerId)}
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    gs.team === 'A' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Team {gs.team}
                  </span>
                  {gs.isOwnGoal && (
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      OG
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateGoals(index, Math.max(1, gs.goals - 1))}
                    className="w-7 h-7 rounded bg-gray-200 text-gray-800 text-sm font-bold hover:bg-gray-300 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-gray-900 min-w-4 text-center">
                    {gs.goals}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateGoals(index, gs.goals + 1)}
                    className="w-7 h-7 rounded bg-gray-200 text-gray-800 text-sm font-bold hover:bg-gray-300 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeGoalScorer(index)}
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
              (p) => {
                if (!teamPlayerIds.includes(p.id)) return false;
                const hasRegularGoal = goalScorers.some(g => g.playerId === p.id && !g.isOwnGoal);
                const hasOwnGoal = goalScorers.some(g => g.playerId === p.id && g.isOwnGoal);
                return !hasRegularGoal || !hasOwnGoal;
              }
            );

            return (
              <div key={team}>
                <p className="text-xs text-gray-500 mb-2">{captainName}&apos;s team scorers</p>
                {availablePlayers.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    {teamPlayerIds.length === 0
                      ? 'Select team players first'
                      : 'All players added'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {availablePlayers.map((p) => {
                      const hasRegularGoal = goalScorers.some(g => g.playerId === p.id && !g.isOwnGoal);
                      const hasOwnGoal = goalScorers.some(g => g.playerId === p.id && g.isOwnGoal);

                      return (
                        <div key={p.id} className="flex items-center gap-1">
                          {!hasRegularGoal && (
                            <button
                              type="button"
                              onClick={() => addGoalScorer(p.id, team, false)}
                              className="flex-1 text-left text-sm px-3 py-1.5 rounded-lg hover:bg-green-50 hover:text-green-700 text-gray-700 transition-colors"
                            >
                              + {p.name}
                            </button>
                          )}
                          {hasRegularGoal && (
                            <span className="flex-1 text-sm px-3 py-1.5 text-gray-400">{p.name}</span>
                          )}
                          {!hasOwnGoal && (
                            <button
                              type="button"
                              onClick={() => addGoalScorer(p.id, team, true)}
                              className="text-xs px-2 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors border border-gray-200"
                              title="Own goal"
                            >
                              OG
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!goalsMatch && goalScorers.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg">
          ⚠️ Goals attributed ({teamAGoals}-{teamBGoals}) don&apos;t match the score ({scoreA}-{scoreB})
        </div>
      )}
      
      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/matches')}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
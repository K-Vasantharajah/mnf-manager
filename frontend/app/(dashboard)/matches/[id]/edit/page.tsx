'use client';

import { useState, useRef } from 'react';
import { usePlayers, useMatchDetail } from '@/lib/hooks';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

import LoadingState from '@/components/ui/LoadingState';

interface GoalScorerEntry {
  playerId: number;
  goals: number;
  team: 'A' | 'B';
  isOwnGoal: boolean;
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M1.5 5L4 7.5L8.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1 1L13 13M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertIcon({ color }: { color: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3" />
      <path d="M8 5V8.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.75" fill={color} />
    </svg>
  );
}

const inputClass =
  'w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pitch/40 focus:border-pitch transition-colors';

export default function EditMatchPage() {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.id);
  const queryClient = useQueryClient();
  const { data: players } = usePlayers();
  const { data: match, isLoading } = useMatchDetail(matchId);

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
    setTeamAPlayerIds(match.teamAPlayers?.map((p) => p.playerId) || []);
    setTeamBPlayerIds(match.teamBPlayers?.map((p) => p.playerId) || []);
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
      setTeamAPlayerIds((prev) => {
        if (!prev.includes(playerId) && prev.length >= 9) return prev;
        return prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId];
      });
    } else {
      setTeamBPlayerIds((prev) => {
        if (!prev.includes(playerId) && prev.length >= 9) return prev;
        return prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId];
      });
    }
  }

  function addGoalScorer(playerId: number, team: 'A' | 'B', isOwnGoal: boolean = false) {
    const existing = goalScorers.find((g) => g.playerId === playerId && g.isOwnGoal === isOwnGoal);
    if (existing) return;
    setGoalScorers((prev) => [...prev, { playerId, goals: 1, team, isOwnGoal }]);
  }

  function updateGoals(index: number, goals: number) {
    setGoalScorers((prev) => prev.map((g, i) => (i === index ? { ...g, goals } : g)));
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
      showError(
        `Goals attributed (${teamAGoals}-${teamBGoals}) don't match the score (${scoreA}-${scoreB})`
      );
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
        goalScorers: goalScorers.map((gs) => ({
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

  if (isLoading) return <LoadingState message="Loading match..." />;

  const teamAGoals =
    goalScorers
      .filter((gs) => gs.team === 'A' && !gs.isOwnGoal)
      .reduce((sum, gs) => sum + gs.goals, 0) +
    goalScorers
      .filter((gs) => gs.team === 'B' && gs.isOwnGoal)
      .reduce((sum, gs) => sum + gs.goals, 0);

  const teamBGoals =
    goalScorers
      .filter((gs) => gs.team === 'B' && !gs.isOwnGoal)
      .reduce((sum, gs) => sum + gs.goals, 0) +
    goalScorers
      .filter((gs) => gs.team === 'A' && gs.isOwnGoal)
      .reduce((sum, gs) => sum + gs.goals, 0);

  const goalsMatch = teamAGoals === scoreA && teamBGoals === scoreB;

  return (
    <div className="max-w-4xl">
      <div className="mb-8 pb-6 border-b border-line">
        <h1 className="font-display text-3xl text-paper">Edit match</h1>
        <p className="text-sm text-muted mt-2">Update the match details, teams and goal scorers</p>
      </div>

      {error && (
        <div
          ref={errorRef}
          className="mb-4 flex items-center gap-2 bg-signal/10 border border-signal/30 text-signal text-sm px-4 py-3 rounded-lg"
        >
          <AlertIcon color="#C05746" />
          {error}
        </div>
      )}

      {/* Match details */}
      <div className="bg-surface border border-line rounded-xl p-5 mb-4">
        <h2 className="text-sm text-muted mb-4">Match details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted block mb-1.5">Date</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Game week</label>
            <input
              type="text"
              value={gameWeek}
              onChange={(e) => setGameWeek(e.target.value)}
              placeholder="e.g. GW29"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Captains and score */}
      <div className="bg-surface border border-line rounded-xl p-5 mb-4">
        <h2 className="text-sm text-muted mb-4">Captains and score</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1.5">Captain A</label>
            <select
              value={captainAId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setCaptainAId(id);
                if (id) {
                  setTeamAPlayerIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
                }
              }}
              className={inputClass}
            >
              <option value="">Select captain</option>
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 pb-0.5">
            <div className="text-center">
              <label className="text-xs text-muted block mb-1.5">Score A</label>
              <input
                type="number"
                min={0}
                value={scoreA}
                onChange={(e) => setScoreA(Number(e.target.value))}
                className={`w-16 text-center font-mono ${inputClass}`}
              />
            </div>
            <span className="text-muted text-lg font-light mb-2">&ndash;</span>
            <div className="text-center">
              <label className="text-xs text-muted block mb-1.5">Score B</label>
              <input
                type="number"
                min={0}
                value={scoreB}
                onChange={(e) => setScoreB(Number(e.target.value))}
                className={`w-16 text-center font-mono ${inputClass}`}
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-xs text-muted block mb-1.5">Captain B</label>
            <select
              value={captainBId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setCaptainBId(id);
                if (id) {
                  setTeamBPlayerIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
                }
              }}
              className={inputClass}
            >
              <option value="">Select captain</option>
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
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
          const teamFull = teamPlayerIds.length >= 9;

          return (
            <div key={team} className="bg-surface border border-line rounded-xl p-5">
              <h2 className="text-paper mb-1">{captainName}&apos;s team</h2>
              <p className="text-xs text-muted mb-3">{teamPlayerIds.length}/9 players selected</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {activePlayers.map((player) => {
                  const selected = teamPlayerIds.includes(player.id);
                  const onOtherTeam =
                    team === 'A'
                      ? teamBPlayerIds.includes(player.id)
                      : teamAPlayerIds.includes(player.id);
                  const isCaptain =
                    (team === 'A' && player.id === Number(captainAId)) ||
                    (team === 'B' && player.id === Number(captainBId));

                  return (
                    <button
                      type="button"
                      key={player.id}
                      onClick={() => {
                        if (!isCaptain && !onOtherTeam) toggleTeamPlayer(player.id, team);
                      }}
                      disabled={onOtherTeam || isCaptain || (teamFull && !selected)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        selected || isCaptain
                          ? 'bg-pitch/10 text-pitch'
                          : onOtherTeam || (teamFull && !selected)
                            ? 'opacity-30 cursor-not-allowed text-muted'
                            : 'hover:bg-surface-2 text-paper/80'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                          selected || isCaptain ? 'bg-pitch border-pitch text-ink' : 'border-line'
                        }`}
                      >
                        {(selected || isCaptain) && <CheckIcon />}
                      </div>
                      {player.name}
                      {isCaptain && <span className="ml-auto text-xs text-pitch">Captain</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new players */}
      <div className="bg-surface border border-line rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-muted">New player?</h2>
          <button
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="text-xs text-pitch hover:opacity-80 border border-pitch/30 px-3 py-1 rounded-lg transition-opacity"
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
              className={`flex-1 ${inputClass}`}
            />
            <button
              onClick={handleAddPlayer}
              disabled={addingPlayer || !newPlayerName.trim()}
              className="bg-pitch hover:opacity-90 text-ink px-4 py-2 rounded-lg text-sm transition-opacity disabled:opacity-30"
            >
              {addingPlayer ? 'Adding\u2026' : 'Add'}
            </button>
          </div>
        )}
      </div>

      {/* Goal scorers */}
      <div className="bg-surface border border-line rounded-xl p-5 mb-4">
        <h2 className="text-sm text-muted mb-4">Goal scorers</h2>
        {goalScorers.length > 0 && (
          <div className="mb-4 space-y-2">
            {goalScorers.map((gs, index) => (
              <div
                key={`${gs.playerId}-${gs.isOwnGoal}-${index}`}
                className="flex items-center gap-3 bg-surface-2 border border-line rounded-lg px-3 py-2"
              >
                <span className="text-sm text-paper flex-1">
                  {getPlayerName(gs.playerId)}
                  <span
                    className={`ml-2 text-xs font-mono px-2 py-0.5 rounded-full ${
                      gs.team === 'A' ? 'bg-pitch/15 text-pitch' : 'bg-[#4A90D9]/15 text-[#4A90D9]'
                    }`}
                  >
                    Team {gs.team}
                  </span>
                  {gs.isOwnGoal && (
                    <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-signal/15 text-signal">
                      OG
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateGoals(index, Math.max(1, gs.goals - 1))}
                    className="w-7 h-7 rounded bg-line text-paper text-sm hover:bg-muted/30 flex items-center justify-center transition-colors"
                  >
                    &minus;
                  </button>
                  <span className="text-sm font-mono text-paper min-w-4 text-center">
                    {gs.goals}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateGoals(index, gs.goals + 1)}
                    className="w-7 h-7 rounded bg-line text-paper text-sm hover:bg-muted/30 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeGoalScorer(index)}
                  aria-label="Remove goal scorer"
                  className="text-signal hover:opacity-80 ml-2 transition-opacity"
                >
                  <CloseIcon />
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
            const availablePlayers = activePlayers.filter((p) => {
              if (!teamPlayerIds.includes(p.id)) return false;
              const hasRegularGoal = goalScorers.some((g) => g.playerId === p.id && !g.isOwnGoal);
              const hasOwnGoal = goalScorers.some((g) => g.playerId === p.id && g.isOwnGoal);
              return !hasRegularGoal || !hasOwnGoal;
            });

            return (
              <div key={team}>
                <p className="text-xs text-muted mb-2">{captainName}&apos;s team scorers</p>
                {availablePlayers.length === 0 ? (
                  <p className="text-xs text-muted italic">
                    {teamPlayerIds.length === 0 ? 'Select team players first' : 'All players added'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {availablePlayers.map((p) => {
                      const hasRegularGoal = goalScorers.some(
                        (g) => g.playerId === p.id && !g.isOwnGoal
                      );
                      const hasOwnGoal = goalScorers.some(
                        (g) => g.playerId === p.id && g.isOwnGoal
                      );

                      return (
                        <div key={p.id} className="flex items-center gap-1">
                          {!hasRegularGoal && (
                            <button
                              type="button"
                              onClick={() => addGoalScorer(p.id, team, false)}
                              className="flex-1 text-left text-sm px-3 py-1.5 rounded-lg hover:bg-pitch/10 hover:text-pitch text-paper/80 transition-colors"
                            >
                              + {p.name}
                            </button>
                          )}
                          {hasRegularGoal && (
                            <span className="flex-1 text-sm px-3 py-1.5 text-muted">{p.name}</span>
                          )}
                          {!hasOwnGoal && (
                            <button
                              type="button"
                              onClick={() => addGoalScorer(p.id, team, true)}
                              className="text-xs px-2 py-1.5 rounded-lg hover:bg-signal/10 hover:text-signal text-muted transition-colors border border-line"
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
        <div className="mb-4 flex items-center gap-2 bg-amber/10 border border-amber/30 text-amber text-sm px-4 py-3 rounded-lg">
          <AlertIcon color="#D7A44A" />
          Goals attributed ({teamAGoals}-{teamBGoals}) don&apos;t match the score ({scoreA}-{scoreB}
          )
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/matches')}
          className="px-4 py-2 text-sm text-muted hover:text-paper transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-pitch hover:opacity-90 text-ink px-6 py-2.5 rounded-lg text-sm transition-opacity disabled:opacity-30"
        >
          {submitting ? 'Saving\u2026' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

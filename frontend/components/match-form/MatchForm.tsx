'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePlayers } from '@/lib/hooks';
import { useMatchForm } from '@/hooks/useMatchForm';
import { AlertIcon } from '@/components/ui/icons';
import { inputClass } from '@/components/ui/formStyles';
import { OUTCOME_BADGE, outcome } from '@/lib/outcome';
import TeamSelector from './TeamSelector';
import GoalScorerChip from './GoalScorerChip';
import GoalScorerPicker from './GoalScorerPicker';

export interface GoalScorerInput {
  playerId: number;
  goals: number;
  team: 'A' | 'B';
  isOwnGoal: boolean;
}

export interface MatchFormValues {
  matchDate: string;
  gameWeek: string;
  captainAId: number;
  captainBId: number;
  scoreA: number;
  scoreB: number;
  teamAPlayerIds: number[];
  teamBPlayerIds: number[];
  goalScorers: GoalScorerInput[];
}

export interface MatchPayload {
  matchDate: string;
  seasonYear: number;
  gameWeek?: string;
  captainAId: number;
  captainBId: number;
  scoreA: number;
  scoreB: number;
  teamAPlayerIds: number[];
  teamBPlayerIds: number[];
  goalScorers: GoalScorerInput[];
}

export default function MatchForm({
  initial,
  showGameWeek = false,
  submitLabel,
  failureMessage,
  send,
}: {
  initial?: MatchFormValues;
  showGameWeek?: boolean;
  submitLabel: string;
  failureMessage: string;
  send: (payload: MatchPayload) => Promise<unknown>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: players } = usePlayers();
  const activePlayers = players || [];

  const {
    showAddPlayer,
    setShowAddPlayer,
    newPlayerName,
    setNewPlayerName,
    addingPlayer,
    handleAddPlayer,
    teamAPlayerIds,
    setTeamAPlayerIds,
    teamBPlayerIds,
    setTeamBPlayerIds,
    toggleTeamPlayer,
    goalScorers,
    setGoalScorers,
    addGoalScorer,
    updateGoals,
    removeGoalScorer,
    teamAGoals,
    teamBGoals,
    error,
    setError,
    errorRef,
    showError,
    getPlayerName,
  } = useMatchForm(activePlayers);

  const [matchDate, setMatchDate] = useState(
    initial?.matchDate ?? new Date().toISOString().split('T')[0]
  );
  const [gameWeek, setGameWeek] = useState(initial?.gameWeek ?? '');
  const [captainAId, setCaptainAId] = useState<number | ''>(initial?.captainAId ?? '');
  const [captainBId, setCaptainBId] = useState<number | ''>(initial?.captainBId ?? '');
  const [scoreA, setScoreA] = useState(initial?.scoreA ?? 0);
  const [scoreB, setScoreB] = useState(initial?.scoreB ?? 0);
  const [submitting, setSubmitting] = useState(false);

  const [initialised, setInitialised] = useState(!initial);
  if (initial && !initialised) {
    setTeamAPlayerIds(initial.teamAPlayerIds);
    setTeamBPlayerIds(initial.teamBPlayerIds);
    setGoalScorers(initial.goalScorers);
    setInitialised(true);
  }

  const seasonYear = matchDate ? new Date(matchDate).getFullYear() : new Date().getFullYear();
  const goalsMatch = teamAGoals === scoreA && teamBGoals === scoreB;
  const captainAName = captainAId ? getPlayerName(Number(captainAId)) : 'Team A';
  const captainBName = captainBId ? getPlayerName(Number(captainBId)) : 'Team B';
  const resultA = outcome(scoreA, scoreB);

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
      await send({
        matchDate,
        seasonYear,
        ...(showGameWeek ? { gameWeek } : {}),
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
      showError(failureMessage);
      setSubmitting(false);
    }
  }

  return (
    <>
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
        <div className={`grid gap-4 ${showGameWeek ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label className="text-xs text-muted block mb-1.5">Date</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className={inputClass}
            />
          </div>
          {showGameWeek && (
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
          )}
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

        {/* What will be saved, so swapped scores are obvious before saving */}
        <div className="text-center mt-4">
          <span
            className={`text-xs px-3 py-1 rounded-full ${OUTCOME_BADGE[resultA === 'draw' ? 'draw' : 'win']}`}
          >
            {resultA === 'draw'
              ? 'Saves as a draw'
              : `Saves as a win for ${resultA === 'win' ? captainAName : captainBName}`}
          </span>
        </div>
      </div>

      {/* Team selection */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <TeamSelector
          captainName={captainAName}
          activePlayers={activePlayers}
          teamPlayerIds={teamAPlayerIds}
          otherTeamPlayerIds={teamBPlayerIds}
          captainId={captainAId}
          onToggle={(id) => toggleTeamPlayer(id, 'A')}
        />
        <TeamSelector
          captainName={captainBName}
          activePlayers={activePlayers}
          teamPlayerIds={teamBPlayerIds}
          otherTeamPlayerIds={teamAPlayerIds}
          captainId={captainBId}
          onToggle={(id) => toggleTeamPlayer(id, 'B')}
        />
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
              <GoalScorerChip
                key={`${gs.playerId}-${gs.isOwnGoal}-${index}`}
                playerName={getPlayerName(gs.playerId)}
                team={gs.team}
                goals={gs.goals}
                isOwnGoal={gs.isOwnGoal}
                onIncrement={() => updateGoals(index, gs.goals + 1)}
                onDecrement={() => updateGoals(index, Math.max(1, gs.goals - 1))}
                onRemove={() => removeGoalScorer(index)}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <GoalScorerPicker
            team="A"
            captainName={captainAName}
            teamPlayerIds={teamAPlayerIds}
            activePlayers={activePlayers}
            goalScorers={goalScorers}
            onAdd={addGoalScorer}
          />
          <GoalScorerPicker
            team="B"
            captainName={captainBName}
            teamPlayerIds={teamBPlayerIds}
            activePlayers={activePlayers}
            goalScorers={goalScorers}
            onAdd={addGoalScorer}
          />
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
          {submitting ? 'Saving\u2026' : submitLabel}
        </button>
      </div>
    </>
  );
}

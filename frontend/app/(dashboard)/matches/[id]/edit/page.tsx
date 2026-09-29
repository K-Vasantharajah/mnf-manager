'use client';

import { useState } from 'react';
import { usePlayers, useMatchDetail } from '@/lib/hooks';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useMatchForm } from '@/hooks/useMatchForm';

import LoadingState from '@/components/ui/LoadingState';
import { AlertIcon } from '@/components/ui/icons';
import { inputClass } from '@/components/ui/formStyles';
import TeamSelector from '@/components/match-form/TeamSelector';
import GoalScorerChip from '@/components/match-form/GoalScorerChip';
import GoalScorerPicker from '@/components/match-form/GoalScorerPicker';

export default function EditMatchPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.id);
  const queryClient = useQueryClient();
  const { data: players } = usePlayers();
  const { data: match, isLoading } = useMatchDetail(matchId);
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

  const [matchDate, setMatchDate] = useState('');
  const seasonYear = matchDate ? new Date(matchDate).getFullYear() : new Date().getFullYear();
  const [gameWeek, setGameWeek] = useState('');
  const [captainAId, setCaptainAId] = useState<number | ''>('');
  const [captainBId, setCaptainBId] = useState<number | ''>('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [initialised, setInitialised] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const goalsMatch = teamAGoals === scoreA && teamBGoals === scoreB;

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
        <TeamSelector
          captainName={captainAId ? getPlayerName(Number(captainAId)) : 'Team A'}
          activePlayers={activePlayers}
          teamPlayerIds={teamAPlayerIds}
          otherTeamPlayerIds={teamBPlayerIds}
          captainId={captainAId}
          onToggle={(id) => toggleTeamPlayer(id, 'A')}
        />
        <TeamSelector
          captainName={captainBId ? getPlayerName(Number(captainBId)) : 'Team B'}
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
            captainName={captainAId ? getPlayerName(Number(captainAId)) : 'Team A'}
            teamPlayerIds={teamAPlayerIds}
            activePlayers={activePlayers}
            goalScorers={goalScorers}
            onAdd={addGoalScorer}
          />
          <GoalScorerPicker
            team="B"
            captainName={captainBId ? getPlayerName(Number(captainBId)) : 'Team B'}
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
          {submitting ? 'Saving\u2026' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

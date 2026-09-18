import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Player } from '@/lib/types';

export interface GoalScorerEntry {
  playerId: number;
  goals: number;
  team: 'A' | 'B';
  isOwnGoal: boolean;
}

export function useMatchForm(players: Player[]) {
  const queryClient = useQueryClient();
  const errorRef = useRef<HTMLDivElement>(null);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<number[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<number[]>([]);
  const [goalScorers, setGoalScorers] = useState<GoalScorerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  function getPlayerName(id: number) {
    return players.find((p) => p.id === id)?.name || 'Unknown';
  }

  function showError(message: string) {
    setError(message);
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
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

  return {
    // Add player
    showAddPlayer,
    setShowAddPlayer,
    newPlayerName,
    setNewPlayerName,
    addingPlayer,
    handleAddPlayer,
    // Teams
    teamAPlayerIds,
    setTeamAPlayerIds,
    teamBPlayerIds,
    setTeamBPlayerIds,
    toggleTeamPlayer,
    // Goal scorers
    goalScorers,
    setGoalScorers,
    addGoalScorer,
    updateGoals,
    removeGoalScorer,
    teamAGoals,
    teamBGoals,
    // Error
    error,
    setError,
    errorRef,
    showError,
    // Helpers
    getPlayerName,
  };
}

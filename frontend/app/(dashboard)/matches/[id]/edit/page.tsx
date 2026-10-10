'use client';

import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useMatchDetail } from '@/lib/hooks';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import MatchForm, { type MatchFormValues } from '@/components/match-form/MatchForm';

export default function EditMatchPage() {
  const params = useParams();
  const matchId = Number(params.id);
  const { data: match, isLoading } = useMatchDetail(matchId);

  if (isLoading) return <LoadingState message="Loading match..." />;
  if (!match) return <ErrorState message="Match not found." />;

  const initial: MatchFormValues = {
    matchDate: match.matchDate ? match.matchDate.toString().split('T')[0] : '',
    gameWeek: match.gameWeek || '',
    captainAId: match.captainAId,
    captainBId: match.captainBId,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    teamAPlayerIds: match.teamAPlayers.map((p) => p.playerId),
    teamBPlayerIds: match.teamBPlayers.map((p) => p.playerId),
    goalScorers: match.goalScorers.map((gs) => ({
      playerId: gs.playerId,
      goals: gs.goals,
      team: gs.team,
      isOwnGoal: gs.isOwnGoal || false,
    })),
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8 pb-6 border-b border-line">
        <h1 className="font-display text-3xl text-paper">Edit match</h1>
        <p className="text-sm text-muted mt-2">Update the match details, teams and goal scorers</p>
      </div>

      <MatchForm
        initial={initial}
        showGameWeek
        submitLabel="Save changes"
        failureMessage="Failed to update match. Please try again."
        send={(payload) => api.put(`/api/v1/matches/${matchId}`, payload)}
      />
    </div>
  );
}

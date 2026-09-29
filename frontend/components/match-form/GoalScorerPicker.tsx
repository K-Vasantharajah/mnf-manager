'use client';

import { Player } from '@/lib/types';
import { GoalScorerEntry } from '@/hooks/useMatchForm';

export default function GoalScorerPicker({
  team,
  captainName,
  teamPlayerIds,
  activePlayers,
  goalScorers,
  onAdd,
}: {
  team: 'A' | 'B';
  captainName: string;
  teamPlayerIds: number[];
  activePlayers: Player[];
  goalScorers: GoalScorerEntry[];
  onAdd: (playerId: number, team: 'A' | 'B', isOwnGoal: boolean) => void;
}) {
  const availablePlayers = activePlayers.filter((p) => {
    if (!teamPlayerIds.includes(p.id)) return false;
    const hasRegularGoal = goalScorers.some((g) => g.playerId === p.id && !g.isOwnGoal);
    const hasOwnGoal = goalScorers.some((g) => g.playerId === p.id && g.isOwnGoal);
    return !hasRegularGoal || !hasOwnGoal;
  });

  return (
    <div>
      <p className="text-xs text-muted mb-2">{captainName}&apos;s team scorers</p>
      {availablePlayers.length === 0 ? (
        <p className="text-xs text-muted italic">
          {teamPlayerIds.length === 0 ? 'Select team players first' : 'All players added'}
        </p>
      ) : (
        <div className="space-y-1">
          {availablePlayers.map((p) => {
            const hasRegularGoal = goalScorers.some((g) => g.playerId === p.id && !g.isOwnGoal);
            const hasOwnGoal = goalScorers.some((g) => g.playerId === p.id && g.isOwnGoal);

            return (
              <div key={p.id} className="flex items-center gap-1">
                {!hasRegularGoal && (
                  <button
                    type="button"
                    onClick={() => onAdd(p.id, team, false)}
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
                    onClick={() => onAdd(p.id, team, true)}
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
}

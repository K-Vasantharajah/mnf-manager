'use client';

import { useMatchDetail } from '@/lib/hooks';
import LoadingState from '@/components/ui/LoadingState';
import { BackIcon, CloseIcon } from '@/components/ui/icons';
import { OUTCOME_COLOUR, OUTCOME_BADGE, outcome } from '@/lib/outcome';
import type { GoalScorerDetail, TeamPlayer } from '@/lib/types';

function CaptainBadge() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber/15 text-amber text-[10px] font-mono mr-1.5 align-middle">
      C
    </span>
  );
}

function TeamList({
  label,
  team,
  players,
  captainId,
  goalScorers,
}: {
  label: string;
  team: 'A' | 'B';
  players: TeamPlayer[];
  captainId: number;
  goalScorers: GoalScorerDetail[];
}) {
  return (
    <div>
      <h3 className="text-sm text-muted mb-3">{label}</h3>
      <div className="space-y-1.5">
        {players.map((player) => {
          const scored = (ownGoal: boolean) =>
            goalScorers.find(
              (gs) =>
                gs.playerId === player.playerId && gs.team === team && gs.isOwnGoal === ownGoal
            );
          const regularGoal = scored(false);
          const ownGoal = scored(true);

          return (
            <div key={player.playerId} className="flex items-center justify-between text-sm">
              <span className={regularGoal || ownGoal ? 'text-paper' : 'text-muted'}>
                {player.playerId === captainId && <CaptainBadge />}
                {player.playerName}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono">
                {regularGoal && (
                  <span className="text-pitch">
                    &#9917;{regularGoal.goals > 1 ? ` \u00d7${regularGoal.goals}` : ''}
                  </span>
                )}
                {ownGoal && (
                  <span className="text-signal">
                    OG{ownGoal.goals > 1 ? ` \u00d7${ownGoal.goals}` : ''}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MatchDetailModal({
  matchId,
  onClose,
  onBack,
}: {
  matchId: number;
  onClose: () => void;
  onBack?: () => void;
}) {
  const { data: match, isLoading } = useMatchDetail(matchId);

  // Every result style comes from these, so names, scores and the badge agree
  const sideA = match ? outcome(match.scoreA, match.scoreB) : null;
  const sideB = match ? outcome(match.scoreB, match.scoreA) : null;
  const isDraw = sideA === 'draw';
  const winnerName = sideA === 'win' ? match?.captainAName : match?.captainBName;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-muted hover:text-paper text-sm flex items-center gap-1 transition-colors"
              >
                <BackIcon />
                Back
              </button>
            )}
            <div>
              <h2 className="text-paper">
                {match
                  ? `${match.gameWeek || ''} \u00b7 Season ${match.seasonYear}`
                  : 'Match details'}
              </h2>
              {match && (
                <p className="text-xs text-muted mt-0.5">
                  {match.captainAName} vs {match.captainBName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-paper transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <LoadingState message="Loading match details..." />
        ) : match && sideA && sideB ? (
          <div className="overflow-y-auto flex-1 p-5">
            {/* Score */}
            <div className="flex items-center justify-between mb-6 bg-surface-2 border border-line rounded-xl p-4">
              <div className="text-center flex-1">
                <div
                  className={`text-lg ${OUTCOME_COLOUR[sideA]} ${sideA === 'win' ? 'font-semibold' : ''}`}
                >
                  {match.captainAName}
                </div>
                <div className="text-xs text-muted">captain</div>
              </div>
              <div className="flex items-center gap-3 px-4">
                <span className={`text-4xl font-mono ${OUTCOME_COLOUR[sideA]}`}>
                  {match.scoreA}
                </span>
                <span className="text-muted">&ndash;</span>
                <span className={`text-4xl font-mono ${OUTCOME_COLOUR[sideB]}`}>
                  {match.scoreB}
                </span>
              </div>
              <div className="text-center flex-1">
                <div
                  className={`text-lg ${OUTCOME_COLOUR[sideB]} ${sideB === 'win' ? 'font-semibold' : ''}`}
                >
                  {match.captainBName}
                </div>
                <div className="text-xs text-muted">captain</div>
              </div>
            </div>

            {/* Result badge */}
            <div className="text-center mb-6">
              <span
                className={`text-xs px-3 py-1 rounded-full ${OUTCOME_BADGE[isDraw ? 'draw' : 'win']}`}
              >
                {isDraw ? 'Draw' : `${winnerName} wins`}
              </span>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-4">
              <TeamList
                label="Team A"
                team="A"
                players={match.teamAPlayers}
                captainId={match.captainAId}
                goalScorers={match.goalScorers}
              />
              <TeamList
                label="Team B"
                team="B"
                players={match.teamBPlayers}
                captainId={match.captainBId}
                goalScorers={match.goalScorers}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

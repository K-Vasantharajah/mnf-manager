'use client';

import { useMatchDetail } from '@/lib/hooks';
import LoadingState from '@/components/ui/LoadingState';

function BackIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M8.5 2.5L3 7L8.5 11.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1 1L13 13M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CaptainBadge() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber/15 text-amber text-[10px] font-mono mr-1.5 align-middle">
      C
    </span>
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
        ) : match ? (
          <div className="overflow-y-auto flex-1 p-5">
            {/* Score */}
            <div className="flex items-center justify-between mb-6 bg-surface-2 border border-line rounded-xl p-4">
              <div className="text-center flex-1">
                <div
                  className={`text-lg ${
                    match.winnerId === match.captainAId ? 'text-pitch' : 'text-muted'
                  }`}
                >
                  {match.captainAName}
                </div>
                <div className="text-xs text-muted">captain</div>
              </div>
              <div className="flex items-center gap-3 px-4">
                <span
                  className={`text-4xl font-mono ${
                    match.scoreA > match.scoreB
                      ? 'text-pitch'
                      : match.isDraw
                        ? 'text-amber'
                        : 'text-muted'
                  }`}
                >
                  {match.scoreA}
                </span>
                <span className="text-muted">&ndash;</span>
                <span
                  className={`text-4xl font-mono ${
                    match.scoreB > match.scoreA
                      ? 'text-pitch'
                      : match.isDraw
                        ? 'text-amber'
                        : 'text-muted'
                  }`}
                >
                  {match.scoreB}
                </span>
              </div>
              <div className="text-center flex-1">
                <div
                  className={`text-lg ${
                    match.winnerId === match.captainBId ? 'text-pitch' : 'text-muted'
                  }`}
                >
                  {match.captainBName}
                </div>
                <div className="text-xs text-muted">captain</div>
              </div>
            </div>

            {/* Result badge */}
            <div className="text-center mb-6">
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  match.isDraw ? 'bg-amber/10 text-amber' : 'bg-pitch/10 text-pitch'
                }`}
              >
                {match.isDraw
                  ? 'Draw'
                  : `${match.winnerId === match.captainAId ? match.captainAName : match.captainBName} wins`}
              </span>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-4">
              {/* Team A */}
              <div>
                <h3 className="text-sm text-muted mb-3">Team A</h3>
                <div className="space-y-1.5">
                  {match.teamAPlayers.map((player) => {
                    const regularGoal = match.goalScorers.find(
                      (gs) => gs.playerId === player.playerId && gs.team === 'A' && !gs.isOwnGoal
                    );
                    const ownGoal = match.goalScorers.find(
                      (gs) => gs.playerId === player.playerId && gs.team === 'A' && gs.isOwnGoal
                    );

                    return (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className={regularGoal || ownGoal ? 'text-paper' : 'text-muted'}>
                          {player.playerId === match.captainAId && <CaptainBadge />}
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

              {/* Team B */}
              <div>
                <h3 className="text-sm text-muted mb-3">Team B</h3>
                <div className="space-y-1.5">
                  {match.teamBPlayers.map((player) => {
                    const regularGoal = match.goalScorers.find(
                      (gs) => gs.playerId === player.playerId && gs.team === 'B' && !gs.isOwnGoal
                    );
                    const ownGoal = match.goalScorers.find(
                      (gs) => gs.playerId === player.playerId && gs.team === 'B' && gs.isOwnGoal
                    );

                    return (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className={regularGoal || ownGoal ? 'text-paper' : 'text-muted'}>
                          {player.playerId === match.captainBId && <CaptainBadge />}
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
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

'use client';

import { useMatchDetail } from '@/lib/hooks';

export default function MatchDetailModal({
  matchId,
  onClose,
}: {
  matchId: number;
  onClose: () => void;
}) {
  const { data: match, isLoading } = useMatchDetail(matchId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">
              {match ? `${match.gameWeek || ''} · Season ${match.seasonYear}` : 'Match details'}
            </h2>
            {match && (
              <p className="text-xs text-gray-400 mt-0.5">
                {match.captainAName} vs {match.captainBName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading match details...</div>
          </div>
        ) : match ? (
          <div className="overflow-y-auto flex-1 p-5">
            {/* Score */}
            <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-xl p-4">
              <div className="text-center flex-1">
                <div className={`font-bold text-lg ${
                  match.winnerId === match.captainAId ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {match.captainAName}
                </div>
                <div className="text-xs text-gray-400">captain</div>
              </div>
              <div className="flex items-center gap-3 px-4">
                <span className={`text-4xl font-black ${
                  match.scoreA > match.scoreB ? 'text-green-600' : 
                  match.isDraw ? 'text-amber-500' : 'text-gray-300'
                }`}>
                  {match.scoreA}
                </span>
                <span className="text-gray-300">—</span>
                <span className={`text-4xl font-black ${
                  match.scoreB > match.scoreA ? 'text-green-600' : 
                  match.isDraw ? 'text-amber-500' : 'text-gray-300'
                }`}>
                  {match.scoreB}
                </span>
              </div>
              <div className="text-center flex-1">
                <div className={`font-bold text-lg ${
                  match.winnerId === match.captainBId ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {match.captainBName}
                </div>
                <div className="text-xs text-gray-400">captain</div>
              </div>
            </div>

            {/* Result badge */}
            <div className="text-center mb-6">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                match.isDraw
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-green-50 text-green-600'
              }`}>
                {match.isDraw ? 'Draw' : `${match.winnerId === match.captainAId ? match.captainAName : match.captainBName} wins`}
              </span>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-4">
                {/* Team A */}
                <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                    {match.captainAName}&apos;s team
                </h3>
                <div className="space-y-1.5">
                    {match.teamAPlayers.map(player => {
                    const goals = match.goalScorers
                        .filter(gs => gs.playerId === player.playerId && gs.team === 'A')
                        .reduce((sum, gs) => sum + gs.goals, 0);

                    return (
                        <div key={player.playerId} className="flex items-center justify-between text-sm">
                        <span className={goals > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                            {player.playerId === match.captainAId ? `👑 ${player.playerName}` : player.playerName}
                        </span>
                        {goals > 0 && (
                            <span className="text-green-600 font-bold text-xs">
                            ⚽{goals > 1 ? ` x${goals}` : ''}
                            </span>
                        )}
                        </div>
                    );
                    })}
                </div>
                </div>

                {/* Team B */}
                <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                    {match.captainBName}&apos;s team
                </h3>
                <div className="space-y-1.5">
                    {match.teamBPlayers.map(player => {
                    const goals = match.goalScorers
                        .filter(gs => gs.playerId === player.playerId && gs.team === 'B')
                        .reduce((sum, gs) => sum + gs.goals, 0);

                    return (
                        <div key={player.playerId} className="flex items-center justify-between text-sm">
                        <span className={goals > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                            {player.playerId === match.captainBId ? `👑 ${player.playerName}` : player.playerName}
                        </span>
                        {goals > 0 && (
                            <span className="text-green-600 font-bold text-xs">
                            ⚽{goals > 1 ? ` x${goals}` : ''}
                            </span>
                        )}
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
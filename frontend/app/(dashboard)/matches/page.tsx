'use client';

import { useMatches } from '@/lib/hooks';
import Link from 'next/link';

export default function MatchesPage() {
  const { data: matches, isLoading, isError } = useMatches();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading matches...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">
          Failed to load matches. Is the backend running?
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Match history</h1>
          <p className="text-sm text-gray-400 mt-1">
            {matches?.length} matches recorded
          </p>
        </div>
        <Link href="/matches/new" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
        + Record match
        </Link>
      </div>

      {matches?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No matches recorded yet
        </div>
      )}

      <div className="space-y-4">
        {matches?.map((match) => {
            const isDraw = match.isDraw;
            const winnerName = match.winner?.name;
            const captainAName = match.captainA?.name ?? 'Unknown';
            const captainBName = match.captainB?.name ?? 'Unknown';

            return (
                <div
                key={match.id}
                className="bg-white rounded-xl border border-gray-100 p-5"
                >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">
                      {match.gameWeek ? (
                        <span className="font-medium text-gray-600">{match.gameWeek} · Season {match.seasonYear}</span>
                      ) : (
                        <>
                          Season {match.seasonYear}
                          {match.matchDate && (
                            <span className="block mt-0.5">
                              {new Date(match.matchDate).toLocaleDateString('en-GB', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                        Season {match.seasonYear}
                    </span>
                    {match.durationMins && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        {match.durationMins} mins
                        </span>
                    )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex-1 text-right">
                    <div
                        className={`font-bold text-lg ${
                        winnerName === captainAName
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                    >
                        {captainAName}
                    </div>
                    <div className="text-xs text-gray-400">captain</div>
                    </div>

                    <div className="flex items-center gap-3 px-6">
                    <span
                        className={`text-3xl font-black ${
                        match.scoreA > match.scoreB
                            ? 'text-green-600'
                            : 'text-gray-300'
                        }`}
                    >
                        {match.scoreA}
                    </span>
                    <span className="text-gray-300 font-light">—</span>
                    <span
                        className={`text-3xl font-black ${
                        match.scoreB > match.scoreA
                            ? 'text-green-600'
                            : 'text-gray-300'
                        }`}
                    >
                        {match.scoreB}
                    </span>
                    </div>

                    <div className="flex-1">
                    <div
                        className={`font-bold text-lg ${
                        winnerName === captainBName
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                    >
                        {captainBName}
                    </div>
                    <div className="text-xs text-gray-400">captain</div>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        isDraw
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-green-50 text-green-600'
                    }`}
                    >
                    {isDraw ? 'Draw' : `${winnerName} wins`}
                    </span>
                    <Link
                      href={`/matches/${match.id}/edit`}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Edit match
                    </Link>
                </div>
              </div>
            );
            })}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAllPlayers } from '@/lib/hooks';
import { Player } from '@/lib/types';
import api from '@/lib/api';

type Phase = 'squad' | 'captains' | 'draft' | 'complete';

interface DraftPick {
  playerId: number;
  playerName: string;
  team: 'A' | 'B';
  position: string | null;
}

interface Preference {
  player_id: number;
  player_name: string;
  appearances_together: number;
  cooccurrence_rate: number;
}

interface Prediction {
  teamAExpectedGoals: number;
  teamBExpectedGoals: number;
  teamAWinProbability: number;
  teamBWinProbability: number;
  predictedResult: string;
}

interface CaptainRecommendation {
  player_id: number;
  name: string;
  position: string | null;
  times_captained_this_season: number;
  last_match_id_captained: number;
}

export default function DraftPage() {
  const { data: allPlayers } = useAllPlayers();

  const [phase, setPhase] = useState<Phase>('squad');
  const [squadIds, setSquadIds] = useState<number[]>([]);
  const [captainAId, setCaptainAId] = useState<number | null>(null);
  const [captainBId, setCaptainBId] = useState<number | null>(null);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'A' | 'B'>('B'); // B picks first (challenger)
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [captainRecommendations, setCaptainRecommendations] = useState<CaptainRecommendation[]>([]);
  const activePlayers = (allPlayers || []).filter(p => p.active);

  const squadPlayers = activePlayers.filter(p => squadIds.includes(p.id));
  const captainA = activePlayers.find(p => p.id === captainAId);
  const captainB = activePlayers.find(p => p.id === captainBId);

  const teamA = picks.filter(p => p.team === 'A');

  const pickedIds = new Set([
    ...picks.map(p => p.playerId),
    ...(captainAId ? [captainAId] : []),
    ...(captainBId ? [captainBId] : []),
  ]);

  const availablePlayers = squadPlayers.filter(p => !pickedIds.has(p.id));

  function toggleSquad(playerId: number) {
    setSquadIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : prev.length < 18
        ? [...prev, playerId]
        : prev
    );
  }

  function startDraft() {
    if (!captainAId || !captainBId) return;
    setPhase('draft');
    loadPreferences(captainBId, squadPlayers
      .filter(p => p.id !== captainAId && p.id !== captainBId)
      .map(p => p.id));
  }

  async function loadPreferences(captainId: number, availableIds: number[]) {
    setLoadingPrefs(true);
    try {
      const { data } = await api.post(`/api/v1/draft/preferences/${captainId}`, {
        availablePlayerIds: availableIds,
      });
      setPreferences(data.preferences || []);
    } catch {
      setPreferences([]);
    } finally {
      setLoadingPrefs(false);
    }
  }

  async function makePick(player: Player) {
    const team = currentTurn;
    const newPick: DraftPick = {
      playerId: player.id,
      playerName: player.name,
      team,
      position: player.position,
    };

    const newPicks = [...picks, newPick];
    setPicks(newPicks);

    const remainingIds = squadPlayers
      .filter(p => !new Set([
        ...newPicks.map(pk => pk.playerId),
        captainAId!,
        captainBId!,
      ]).has(p.id))
      .map(p => p.id);

    const teamAIds = [captainAId!, ...newPicks.filter(p => p.team === 'A').map(p => p.playerId)];
    const teamBIds = [captainBId!, ...newPicks.filter(p => p.team === 'B').map(p => p.playerId)];

    await updatePrediction(teamAIds, teamBIds);

    if (remainingIds.length === 0 || newPicks.length >= 16) {
      setPhase('complete');
      return;
    }

    // Last 3 players rule — Team A picks 2, Team B gets last one by default
    if (remainingIds.length === 1) {
      // Auto-assign last player to Team B
      const lastPlayer = squadPlayers.find(p => remainingIds.includes(p.id));
      if (lastPlayer) {
        const finalPicks = [...newPicks, {
          playerId: lastPlayer.id,
          playerName: lastPlayer.name,
          team: 'B' as const,
          position: lastPlayer.position,
        }];
        setPicks(finalPicks);
        setPhase('complete');
        await updatePrediction(
          [captainAId!, ...finalPicks.filter(p => p.team === 'A').map(p => p.playerId)],
          [captainBId!, ...finalPicks.filter(p => p.team === 'B').map(p => p.playerId)]
        );
      }
      return;
    }

    // Determine next turn
    let nextTurn: 'A' | 'B';
    if (remainingIds.length === 2 && team === 'B') {
      // Team A gets both remaining picks
      nextTurn = 'A';
    } else if (remainingIds.length === 2 && team === 'A') {
      nextTurn = 'A'; // Team A still picks
    } else {
      nextTurn = team === 'A' ? 'B' : 'A';
    }

    setCurrentTurn(nextTurn);
    const nextCaptainId = nextTurn === 'A' ? captainAId! : captainBId!;
    await loadPreferences(nextCaptainId, remainingIds);
  }

  async function undoPick() {
    if (picks.length === 0) return;
    const newPicks = picks.slice(0, -1);
    setPicks(newPicks);

    // The turn to restore is the team of the pick we just removed
    const lastPick = picks[picks.length - 1];
    const prevTurn = lastPick.team;
    setCurrentTurn(prevTurn);

    const prevCaptainId = prevTurn === 'A' ? captainAId! : captainBId!;
    const remainingIds = squadPlayers
      .filter(p => !new Set([
        ...newPicks.map(pk => pk.playerId),
        captainAId!,
        captainBId!,
      ]).has(p.id))
      .map(p => p.id);

    await loadPreferences(prevCaptainId, remainingIds);

    if (newPicks.length > 0) {
      await updatePrediction(
        [captainAId!, ...newPicks.filter(p => p.team === 'A').map(p => p.playerId)],
        [captainBId!, ...newPicks.filter(p => p.team === 'B').map(p => p.playerId)]
      );
    } else {
      setPrediction(null);
    }

    if (phase === 'complete') setPhase('draft');
  }

  async function updatePrediction(teamAIds: number[], teamBIds: number[]) {
    if (teamAIds.length === 0 || teamBIds.length === 0) return;
    try {
      const { data } = await api.post('/api/v1/draft/predict', {
        teamAIds,
        teamBIds,
      });
      setPrediction(data.prediction);
    } catch {
      // prediction optional
    }
  }

  function reset() {
    setPhase('squad');
    setSquadIds([]);
    setCaptainAId(null);
    setCaptainBId(null);
    setPicks([]);
    setCurrentTurn('B');
    setPreferences([]);
    setPrediction(null);
  }

  const currentCaptainName = currentTurn === 'A' ? captainA?.name : captainB?.name;

  useEffect(() => {
    if (phase === 'captains' && squadIds.length > 0) {
      api.post('/api/v1/draft/captain-recommendations', {
        availablePlayerIds: squadIds,
      }).then(({ data }) => {
        setCaptainRecommendations(data.recommendations || []);
      }).catch(() => setCaptainRecommendations([]));
    }
  }, [phase, squadIds]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Draft Simulator</h1>
          <p className="text-sm text-gray-400 mt-1">
            {phase === 'squad' && 'Select tonight\'s squad (max 18 players)'}
            {phase === 'captains' && 'Select the two captains'}
            {phase === 'draft' && `${currentCaptainName}'s pick · ${availablePlayers.length} players remaining`}
            {phase === 'complete' && 'Draft complete'}
          </p>
        </div>
        {phase !== 'squad' && (
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            Start over
          </button>
        )}
      </div>

      {/* Phase 1 — Squad selection */}
      {phase === 'squad' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {squadIds.length}/18 players selected
            </p>
            <button
              onClick={() => setPhase('captains')}
              disabled={squadIds.length < 2}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Select captains →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {activePlayers.map(player => {
              const selected = squadIds.includes(player.id);
              const full = squadIds.length >= 18 && !selected;
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => toggleSquad(player.id)}
                  disabled={full}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    selected
                      ? 'bg-green-600 text-white'
                      : full
                      ? 'opacity-30 cursor-not-allowed bg-white border border-gray-200 text-gray-600'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{player.name}</span>
                  {player.position && player.position !== 'UNKNOWN' && (
                    <span className={`ml-auto text-xs ${selected ? 'text-green-200' : 'text-gray-400'}`}>
                      {player.position}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase 2 — Captain selection */}
      {phase === 'captains' && (
        <div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Captain A</h2>
              <p className="text-xs text-gray-400 mb-3">Winning captain — picks second</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {squadPlayers.map(player => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setCaptainAId(player.id === captainAId ? null : player.id)}
                    disabled={player.id === captainBId}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      player.id === captainAId
                        ? 'bg-green-600 text-white'
                        : player.id === captainBId
                        ? 'opacity-30 cursor-not-allowed text-gray-400'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {player.name}
                    {player.position && player.position !== 'UNKNOWN' && (
                      <span className="ml-2 text-xs opacity-60">{player.position}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Captain B</h2>
              <p className="text-xs text-gray-400 mb-1">Challenging captain — picks first</p>
              <p className="text-xs text-amber-600 mb-3 font-medium">⭐ Ordered by who should captain next</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {(captainRecommendations.length > 0
                  ? captainRecommendations.filter(r => squadIds.includes(r.player_id))
                  : squadPlayers.map(p => ({
                      player_id: p.id,
                      name: p.name,
                      position: p.position,
                      times_captained_this_season: -1,
                      last_match_id_captained: 0,
                    } as CaptainRecommendation))
                ).map(rec => {
                  const playerId = rec.player_id ?? (rec as unknown as Player).id;
                  const playerName = rec.name;
                  const playerPosition = rec.position;
                  return (
                    <button
                      key={playerId}
                      type="button"
                      onClick={() => setCaptainBId(playerId === captainBId ? null : playerId)}
                      disabled={playerId === captainAId}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        playerId === captainBId
                          ? 'bg-blue-600 text-white'
                          : playerId === captainAId
                          ? 'opacity-30 cursor-not-allowed text-gray-400'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="flex-1">{playerName}</span>
                      {playerPosition && playerPosition !== 'UNKNOWN' && (
                        <span className="text-xs opacity-60">{playerPosition}</span>
                      )}
                      {'times_captained_this_season' in rec && rec.times_captained_this_season === 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">New</span>
                      )}
                      {'times_captained_this_season' in rec && rec.times_captained_this_season > 0 && (
                        <span className="text-xs text-gray-400">{rec.times_captained_this_season}x</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={startDraft}
              disabled={!captainAId || !captainBId}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              Start draft →
            </button>
          </div>
        </div>
      )}

      {/* Phase 3 — Draft */}
      {phase === 'draft' && picks.length > 0 && (
        <button
          type="button"
          onClick={undoPick}
          className="text-sm text-amber-600 hover:text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg"
        >
          ↩ Undo last pick
        </button>
      )}
      {(phase === 'draft' || phase === 'complete') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Team A */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-green-700 px-5 py-3">
              <h2 className="font-bold text-white">👑 {captainA?.name}</h2>
              <p className="text-green-300 text-xs">Team A · picks second</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-green-50 rounded-lg">
                <span className="text-xs font-bold text-green-700">CAP</span>
                <span className="text-sm font-medium text-green-900">{captainA?.name}</span>
                <span className="text-xs text-green-500 ml-auto">{captainA?.position}</span>
              </div>
              {teamA.map((pick, i) => (
                <div key={pick.playerId} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <span className="text-sm text-gray-900">{pick.playerName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{pick.position}</span>
                </div>
              ))}
              {phase === 'draft' && currentTurn === 'A' && (
                <div className="flex items-center gap-2 px-2 py-1.5 border-2 border-dashed border-green-300 rounded-lg">
                  <span className="text-xs text-green-500 animate-pulse">Picking...</span>
                </div>
              )}
            </div>
          </div>

          {/* Middle — available players and prediction */}
          <div className="space-y-4">
            {/* Win probability */}
            {prediction && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Win probability</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-600 w-16 text-right">{captainA?.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden flex">
                    <div
                      className="bg-green-500 h-3 transition-all duration-500"
                      style={{ width: `${prediction.teamAWinProbability}%` }}
                    />
                    <div
                      className="bg-blue-500 h-3 transition-all duration-500"
                      style={{ width: `${prediction.teamBWinProbability}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-16">{captainB?.name}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-green-600">{prediction.teamAWinProbability}%</span>
                  <span className="text-gray-400 text-center">
                    {prediction.teamAExpectedGoals} — {prediction.teamBExpectedGoals}
                  </span>
                  <span className="text-blue-600">{prediction.teamBWinProbability}%</span>
                </div>
              </div>
            )}

            {/* Recommended picks */}
            {phase === 'draft' && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className={`px-5 py-3 ${currentTurn === 'A' ? 'bg-green-700' : 'bg-blue-600'}`}>
                  <h3 className="font-bold text-white text-sm">
                    {currentCaptainName}&apos;s recommended picks
                  </h3>
                  <p className="text-xs text-white opacity-70">
                    Based on historical preferences
                  </p>
                </div>
                {loadingPrefs ? (
                  <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {preferences.slice(0, 8).map((pref) => {
                      const player = squadPlayers.find(p => p.id === pref.player_id);
                      if (!player || pickedIds.has(player.id)) return null;
                      return (
                        <button
                          key={pref.player_id}
                          type="button"
                          onClick={() => makePick(player)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{pref.player_name}</div>
                            <div className="text-xs text-gray-400">
                              {player.position} · {pref.cooccurrence_rate.toFixed(0)}% co-occurrence
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            pref.cooccurrence_rate >= 60
                              ? 'bg-green-100 text-green-700'
                              : pref.cooccurrence_rate >= 30
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {pref.cooccurrence_rate.toFixed(0)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* All available players */}
            {phase === 'draft' && availablePlayers.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    All available ({availablePlayers.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                  {availablePlayers.map(player => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => makePick(player)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-sm text-gray-900 flex-1">{player.name}</span>
                      <span className="text-xs text-gray-400">{player.position}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === 'complete' && (
              <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
                <p className="font-semibold text-green-800">Draft complete!</p>
                <p className="text-xs text-green-600 mt-1">
                  Predicted: {prediction?.teamAExpectedGoals} — {prediction?.teamBExpectedGoals}
                </p>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 px-5 py-3">
              <h2 className="font-bold text-white">👑 {captainB?.name}</h2>
              <p className="text-blue-200 text-xs">Team B · picks first</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 rounded-lg">
                <span className="text-xs font-bold text-blue-700">CAP</span>
                <span className="text-sm font-medium text-blue-900">{captainB?.name}</span>
                <span className="text-xs text-blue-400 ml-auto">{captainB?.position}</span>
              </div>
              {picks.filter(p => p.team === 'B').map((pick, i) => (
                <div key={pick.playerId} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <span className="text-sm text-gray-900">{pick.playerName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{pick.position}</span>
                </div>
              ))}
              {phase === 'draft' && currentTurn === 'B' && (
                <div className="flex items-center gap-2 px-2 py-1.5 border-2 border-dashed border-blue-300 rounded-lg">
                  <span className="text-xs text-blue-500 animate-pulse">Picking...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
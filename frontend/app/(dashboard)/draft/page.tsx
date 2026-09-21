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

function UndoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 5H10.5C12.433 5 14 6.567 14 8.5C14 10.433 12.433 12 10.5 12H6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M5.5 2.5L3 5L5.5 7.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const activePlayers = (allPlayers || []).filter((p) => p.active);
  const [teamAChemistry, setTeamAChemistry] = useState<number | null>(null);
  const [teamBChemistry, setTeamBChemistry] = useState<number | null>(null);

  const squadPlayers = activePlayers.filter((p) => squadIds.includes(p.id));
  const captainA = activePlayers.find((p) => p.id === captainAId);
  const captainB = activePlayers.find((p) => p.id === captainBId);

  const teamA = picks.filter((p) => p.team === 'A');

  const pickedIds = new Set([
    ...picks.map((p) => p.playerId),
    ...(captainAId ? [captainAId] : []),
    ...(captainBId ? [captainBId] : []),
  ]);

  const availablePlayers = squadPlayers.filter((p) => !pickedIds.has(p.id));

  function toggleSquad(playerId: number) {
    setSquadIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : prev.length < 18
          ? [...prev, playerId]
          : prev
    );
  }

  function startDraft() {
    if (!captainAId || !captainBId) return;
    setPhase('draft');
    loadPreferences(
      captainBId,
      squadPlayers.filter((p) => p.id !== captainAId && p.id !== captainBId).map((p) => p.id)
    );
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
      .filter(
        (p) => !new Set([...newPicks.map((pk) => pk.playerId), captainAId!, captainBId!]).has(p.id)
      )
      .map((p) => p.id);

    const teamAIds = [
      captainAId!,
      ...newPicks.filter((p) => p.team === 'A').map((p) => p.playerId),
    ];
    const teamBIds = [
      captainBId!,
      ...newPicks.filter((p) => p.team === 'B').map((p) => p.playerId),
    ];

    await updatePrediction(teamAIds, teamBIds);
    await updateTeamChemistry(teamAIds, teamBIds);

    if (remainingIds.length === 0 || newPicks.length >= 16) {
      setPhase('complete');
      return;
    }

    // Last 3 players rule — Team A picks 2, Team B gets last one by default
    if (remainingIds.length === 1) {
      // Auto-assign last player to Team B
      const lastPlayer = squadPlayers.find((p) => remainingIds.includes(p.id));
      if (lastPlayer) {
        const finalPicks = [
          ...newPicks,
          {
            playerId: lastPlayer.id,
            playerName: lastPlayer.name,
            team: 'B' as const,
            position: lastPlayer.position,
          },
        ];
        setPicks(finalPicks);
        setPhase('complete');
        await updatePrediction(
          [captainAId!, ...finalPicks.filter((p) => p.team === 'A').map((p) => p.playerId)],
          [captainBId!, ...finalPicks.filter((p) => p.team === 'B').map((p) => p.playerId)]
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
      .filter(
        (p) => !new Set([...newPicks.map((pk) => pk.playerId), captainAId!, captainBId!]).has(p.id)
      )
      .map((p) => p.id);

    await loadPreferences(prevCaptainId, remainingIds);

    if (newPicks.length > 0) {
      await updatePrediction(
        [captainAId!, ...newPicks.filter((p) => p.team === 'A').map((p) => p.playerId)],
        [captainBId!, ...newPicks.filter((p) => p.team === 'B').map((p) => p.playerId)]
      );
      await updateTeamChemistry(
        [captainAId!, ...newPicks.filter((p) => p.team === 'A').map((p) => p.playerId)],
        [captainBId!, ...newPicks.filter((p) => p.team === 'B').map((p) => p.playerId)]
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

  async function updateTeamChemistry(teamAIds: number[], teamBIds: number[]) {
    try {
      if (teamAIds.length >= 2) {
        const { data: dataA } = await api.post('/api/v1/draft/chemistry/team', {
          playerIds: teamAIds,
        });
        setTeamAChemistry(dataA.teamChemistryScore);
      }
      if (teamBIds.length >= 2) {
        const { data: dataB } = await api.post('/api/v1/draft/chemistry/team', {
          playerIds: teamBIds,
        });
        setTeamBChemistry(dataB.teamChemistryScore);
      }
    } catch {
      // chemistry optional
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
    setTeamAChemistry(null);
    setTeamBChemistry(null);
  }

  const currentCaptainName = currentTurn === 'A' ? captainA?.name : captainB?.name;

  useEffect(() => {
    if (phase === 'captains' && squadIds.length > 0) {
      api
        .post('/api/v1/draft/captain-recommendations', {
          availablePlayerIds: squadIds,
        })
        .then(({ data }) => {
          setCaptainRecommendations(data.recommendations || []);
        })
        .catch(() => setCaptainRecommendations([]));
    }
  }, [phase, squadIds]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-line">
        <div>
          <h1 className="font-display text-3xl text-paper">Draft Simulator</h1>
          <p className="text-sm text-muted mt-2">
            {phase === 'squad' && "Select tonight's squad (max 18 players)"}
            {phase === 'captains' && 'Select the two captains'}
            {phase === 'draft' &&
              `${currentCaptainName}'s pick \u00b7 ${availablePlayers.length} players remaining`}
            {phase === 'complete' && 'Draft complete'}
          </p>
        </div>
        {phase !== 'squad' && (
          <button
            onClick={reset}
            className="text-sm text-muted hover:text-paper border border-line px-3 py-1.5 rounded-lg transition-colors"
          >
            Start over
          </button>
        )}
      </div>

      {/* Phase 1 — Squad selection */}
      {phase === 'squad' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">{squadIds.length}/18 players selected</p>
            <button
              onClick={() => setPhase('captains')}
              disabled={squadIds.length < 2}
              className="bg-pitch hover:opacity-90 text-ink px-4 py-2 rounded-lg text-sm transition-opacity disabled:opacity-30"
            >
              Select captains
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {activePlayers.map((player) => {
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
                      ? 'bg-pitch text-ink'
                      : full
                        ? 'opacity-30 cursor-not-allowed bg-surface border border-line text-muted'
                        : 'bg-surface border border-line text-paper/80 hover:border-pitch/50 hover:bg-surface-2'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs flex-shrink-0">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{player.name}</span>
                  {player.position && player.position !== 'UNKNOWN' && (
                    <span className={`ml-auto text-xs ${selected ? 'text-ink/60' : 'text-muted'}`}>
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
            <div className="bg-surface border border-line rounded-xl p-5">
              <h2 className="text-paper mb-1">Captain A</h2>
              <p className="text-xs text-muted mb-3">Winning captain &middot; picks second</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {squadPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setCaptainAId(player.id === captainAId ? null : player.id)}
                    disabled={player.id === captainBId}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      player.id === captainAId
                        ? 'bg-pitch text-ink'
                        : player.id === captainBId
                          ? 'opacity-30 cursor-not-allowed text-muted'
                          : 'hover:bg-surface-2 text-paper/80'
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

            <div className="bg-surface border border-line rounded-xl p-5">
              <h2 className="text-paper mb-1">Captain B</h2>
              <p className="text-xs text-muted mb-1">Challenging captain &middot; picks first</p>
              <p className="text-xs text-amber mb-3">Ordered by who should captain next</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {(captainRecommendations.length > 0
                  ? captainRecommendations.filter((r) => squadIds.includes(r.player_id))
                  : squadPlayers.map(
                      (p) =>
                        ({
                          player_id: p.id,
                          name: p.name,
                          position: p.position,
                          times_captained_this_season: -1,
                          last_match_id_captained: 0,
                        }) as CaptainRecommendation
                    )
                ).map((rec) => {
                  const playerId = rec.player_id;
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
                          ? 'bg-[#4A90D9] text-ink'
                          : playerId === captainAId
                            ? 'opacity-30 cursor-not-allowed text-muted'
                            : 'hover:bg-surface-2 text-paper/80'
                      }`}
                    >
                      <span className="flex-1">{playerName}</span>
                      {playerPosition && playerPosition !== 'UNKNOWN' && (
                        <span className="text-xs opacity-60">{playerPosition}</span>
                      )}
                      {'times_captained_this_season' in rec &&
                        rec.times_captained_this_season === 0 && (
                          <span className="text-xs bg-pitch/15 text-pitch px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                      {'times_captained_this_season' in rec &&
                        rec.times_captained_this_season > 0 && (
                          <span className="text-xs font-mono text-muted">
                            {rec.times_captained_this_season}x
                          </span>
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
              className="bg-pitch hover:opacity-90 text-ink px-6 py-2.5 rounded-lg text-sm transition-opacity disabled:opacity-30"
            >
              Start draft
            </button>
          </div>
        </div>
      )}

      {/* Phase 3 — Draft */}
      {phase === 'draft' && picks.length > 0 && (
        <button
          type="button"
          onClick={undoPick}
          className="flex items-center gap-1.5 text-sm text-amber hover:opacity-80 border border-amber/30 px-3 py-1.5 rounded-lg mb-4 transition-opacity"
        >
          <UndoIcon />
          Undo last pick
        </button>
      )}
      {(phase === 'draft' || phase === 'complete') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Team A */}
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-pitch/30 bg-pitch/10">
              <h2 className="text-paper">{captainA?.name}</h2>
              {teamAChemistry !== null && (
                <div
                  className={`text-xs px-2 py-1 rounded-lg text-center font-mono mt-2 ${
                    teamAChemistry > 10
                      ? 'bg-pitch/15 text-pitch'
                      : teamAChemistry > 0
                        ? 'bg-amber/15 text-amber'
                        : 'bg-signal/15 text-signal'
                  }`}
                >
                  Chemistry: {teamAChemistry > 0 ? '+' : ''}
                  {teamAChemistry}
                </div>
              )}
              <p className="text-muted text-xs mt-1">Team A &middot; picks second</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-pitch/10 rounded-lg">
                <span className="text-xs font-mono text-pitch">CAP</span>
                <span className="text-sm text-paper">{captainA?.name}</span>
                <span className="text-xs text-muted ml-auto">{captainA?.position}</span>
              </div>
              {teamA.map((pick, i) => (
                <div
                  key={pick.playerId}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-2 rounded-lg"
                >
                  <span className="text-xs font-mono text-muted w-4">{i + 1}</span>
                  <span className="text-sm text-paper">{pick.playerName}</span>
                  <span className="text-xs text-muted ml-auto">{pick.position}</span>
                </div>
              ))}
              {phase === 'draft' && currentTurn === 'A' && (
                <div className="flex items-center gap-2 px-2 py-1.5 border-2 border-dashed border-pitch/40 rounded-lg">
                  <span className="text-xs text-pitch animate-pulse">Picking&hellip;</span>
                </div>
              )}
            </div>
          </div>

          {/* Middle — available players and prediction */}
          <div className="space-y-4">
            {/* Win probability */}
            {prediction && (
              <div className="bg-surface border border-line rounded-xl p-4">
                <h3 className="text-sm text-muted mb-3">Win probability</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted w-16 text-right truncate">
                    {captainA?.name}
                  </span>
                  <div className="flex-1 bg-line rounded-full h-3 overflow-hidden flex">
                    <div
                      className="bg-pitch h-3 transition-all duration-500"
                      style={{ width: `${prediction.teamAWinProbability}%` }}
                    />
                    <div
                      className="bg-[#4A90D9] h-3 transition-all duration-500"
                      style={{ width: `${prediction.teamBWinProbability}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted w-16 truncate">{captainB?.name}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-pitch">{prediction.teamAWinProbability}%</span>
                  <span className="text-muted text-center">
                    {prediction.teamAExpectedGoals}&ndash;{prediction.teamBExpectedGoals}
                  </span>
                  <span className="text-[#4A90D9]">{prediction.teamBWinProbability}%</span>
                </div>
              </div>
            )}

            {/* Recommended picks */}
            {phase === 'draft' && (
              <div className="bg-surface border border-line rounded-xl overflow-hidden">
                <div
                  className={`px-5 py-3 border-b ${
                    currentTurn === 'A'
                      ? 'bg-pitch/10 border-pitch/30'
                      : 'bg-[#4A90D9]/10 border-[#4A90D9]/30'
                  }`}
                >
                  <h3 className="text-sm text-paper">
                    {currentCaptainName}&apos;s recommended picks
                  </h3>
                  <p className="text-xs text-muted mt-0.5">Based on historical preferences</p>
                </div>
                {loadingPrefs ? (
                  <div className="p-4 text-center text-muted text-sm">Loading&hellip;</div>
                ) : (
                  <div className="divide-y divide-line">
                    {preferences.slice(0, 8).map((pref) => {
                      const player = squadPlayers.find((p) => p.id === pref.player_id);
                      if (!player || pickedIds.has(player.id)) return null;
                      return (
                        <button
                          key={pref.player_id}
                          type="button"
                          onClick={() => makePick(player)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors text-left"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-paper">{pref.player_name}</div>
                            <div className="text-xs text-muted">
                              {player.position} &middot; {pref.cooccurrence_rate.toFixed(0)}%
                              co-occurrence
                            </div>
                          </div>
                          <span
                            className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                              pref.cooccurrence_rate >= 60
                                ? 'bg-pitch/15 text-pitch'
                                : pref.cooccurrence_rate >= 30
                                  ? 'bg-amber/15 text-amber'
                                  : 'bg-line text-muted'
                            }`}
                          >
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
              <div className="bg-surface border border-line rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-line">
                  <h3 className="text-sm text-muted">All available ({availablePlayers.length})</h3>
                </div>
                <div className="divide-y divide-line max-h-48 overflow-y-auto">
                  {availablePlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => makePick(player)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-2 transition-colors text-left"
                    >
                      <span className="text-sm text-paper flex-1">{player.name}</span>
                      <span className="text-xs text-muted">{player.position}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === 'complete' && (
              <div className="bg-pitch/10 rounded-xl border border-pitch/30 p-4 text-center">
                <p className="text-paper">Draft complete</p>
                <p className="text-xs font-mono text-muted mt-1">
                  Predicted: {prediction?.teamAExpectedGoals}&ndash;{prediction?.teamBExpectedGoals}
                </p>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#4A90D9]/30 bg-[#4A90D9]/10">
              <h2 className="text-paper">{captainB?.name}</h2>
              {teamBChemistry !== null && (
                <div
                  className={`text-xs px-2 py-1 rounded-lg text-center font-mono mt-2 ${
                    teamBChemistry > 10
                      ? 'bg-pitch/15 text-pitch'
                      : teamBChemistry > 0
                        ? 'bg-amber/15 text-amber'
                        : 'bg-signal/15 text-signal'
                  }`}
                >
                  Chemistry: {teamBChemistry > 0 ? '+' : ''}
                  {teamBChemistry}
                </div>
              )}
              <p className="text-muted text-xs mt-1">Team B &middot; picks first</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-[#4A90D9]/10 rounded-lg">
                <span className="text-xs font-mono text-[#4A90D9]">CAP</span>
                <span className="text-sm text-paper">{captainB?.name}</span>
                <span className="text-xs text-muted ml-auto">{captainB?.position}</span>
              </div>
              {picks
                .filter((p) => p.team === 'B')
                .map((pick, i) => (
                  <div
                    key={pick.playerId}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-2 rounded-lg"
                  >
                    <span className="text-xs font-mono text-muted w-4">{i + 1}</span>
                    <span className="text-sm text-paper">{pick.playerName}</span>
                    <span className="text-xs text-muted ml-auto">{pick.position}</span>
                  </div>
                ))}
              {phase === 'draft' && currentTurn === 'B' && (
                <div className="flex items-center gap-2 px-2 py-1.5 border-2 border-dashed border-[#4A90D9]/40 rounded-lg">
                  <span className="text-xs text-[#4A90D9] animate-pulse">Picking&hellip;</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

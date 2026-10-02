'use client';

import { Fragment, useState, useEffect } from 'react';
import { useAllPlayers } from '@/lib/hooks';
import { Player } from '@/lib/types';
import api from '@/lib/api';
import { UndoIcon } from '@/components/ui/icons';

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

interface CaptainRecommendation {
  player_id: number;
  name: string;
  position: string | null;
  times_captained_this_season: number;
  last_match_id_captained: number;
}

type Group = 'DEF' | 'MID' | 'ATT';

const GROUPS: Group[] = ['DEF', 'MID', 'ATT'];

const GROUP_LABELS: Record<Group, string> = {
  DEF: 'Defence',
  MID: 'Midfield',
  ATT: 'Attack',
};

const POSITION_GROUPS: Record<string, Group> = {
  GK: 'DEF',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  CDM: 'MID',
  CM: 'MID',
  CAM: 'MID',
  LW: 'ATT',
  RW: 'ATT',
  ST: 'ATT',
};

interface TeamSummary {
  counts: Record<Group, number>;
  unknown: number;
  size: number;
  rated: number;
  avgRating: number | null;
}

function overallRating(player: Player): number | null {
  return player.rating?.overallRating ?? null;
}

function summariseTeam(players: Player[]): TeamSummary {
  const counts: Record<Group, number> = { DEF: 0, MID: 0, ATT: 0 };
  let unknown = 0;
  const ratings: number[] = [];

  for (const player of players) {
    const group = player.position ? POSITION_GROUPS[player.position] : undefined;
    if (group) counts[group] += 1;
    else unknown += 1;

    const rating = overallRating(player);
    if (rating !== null) ratings.push(rating);
  }

  return {
    counts,
    unknown,
    size: players.length,
    rated: ratings.length,
    avgRating: ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null,
  };
}

function coverageWarnings(
  a: TeamSummary,
  b: TeamSummary,
  nameA: string | undefined,
  nameB: string | undefined
): string[] {
  const warnings: string[] = [];
  if (a.counts.DEF === 0) warnings.push(`${nameA ?? 'Team A'} has no defenders`);
  if (b.counts.DEF === 0) warnings.push(`${nameB ?? 'Team B'} has no defenders`);
  for (const group of GROUPS) {
    if (Math.abs(a.counts[group] - b.counts[group]) >= 3) {
      warnings.push(`${GROUP_LABELS[group]} uneven: ${a.counts[group]} vs ${b.counts[group]}`);
    }
  }
  return warnings;
}

function BalancePanel({
  teamA,
  teamB,
  nameA,
  nameB,
  complete,
}: {
  teamA: Player[];
  teamB: Player[];
  nameA?: string;
  nameB?: string;
  complete: boolean;
}) {
  const a = summariseTeam(teamA);
  const b = summariseTeam(teamB);
  const warnings = complete ? coverageWarnings(a, b, nameA, nameB) : [];
  const showRatings = a.avgRating !== null && b.avgRating !== null;
  const unrated = a.size - a.rated + (b.size - b.rated);

  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <h3 className="text-sm text-muted mb-3">Team balance</h3>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-1.5 items-center">
        <span className="text-xs text-pitch truncate">{nameA}</span>
        <span />
        <span className="text-xs text-[#4A90D9] text-right truncate">{nameB}</span>
        {GROUPS.map((group) => (
          <Fragment key={group}>
            <span className="text-sm font-mono text-paper">{a.counts[group]}</span>
            <span className="text-xs text-muted text-center">{GROUP_LABELS[group]}</span>
            <span className="text-sm font-mono text-paper text-right">{b.counts[group]}</span>
          </Fragment>
        ))}
        {(a.unknown > 0 || b.unknown > 0) && (
          <>
            <span className="text-sm font-mono text-muted">{a.unknown}</span>
            <span className="text-xs text-muted text-center">No position</span>
            <span className="text-sm font-mono text-muted text-right">{b.unknown}</span>
          </>
        )}
      </div>

      {showRatings && (
        <div className="mt-3 pt-3 border-t border-line flex justify-between items-center text-xs font-mono">
          <span className="text-pitch">{a.avgRating!.toFixed(1)}</span>
          <span className="text-muted text-center">
            Avg rating
            {unrated > 0 && <span className="block opacity-70">{unrated} unrated</span>}
          </span>
          <span className="text-[#4A90D9]">{b.avgRating!.toFixed(1)}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {warnings.map((warning) => (
            <li key={warning} className="text-xs text-amber">
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DraftPage() {
  const { data: allPlayers } = useAllPlayers();

  const [phase, setPhase] = useState<Phase>('squad');
  const [squadIds, setSquadIds] = useState<number[]>([]);
  const [captainAId, setCaptainAId] = useState<number | null>(null);
  const [captainBId, setCaptainBId] = useState<number | null>(null);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'A' | 'B'>('B');
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [captainRecommendations, setCaptainRecommendations] = useState<CaptainRecommendation[]>([]);
  const activePlayers = (allPlayers || []).filter((p) => p.active);

  const squadPlayers = activePlayers.filter((p) => squadIds.includes(p.id));
  const captainA = activePlayers.find((p) => p.id === captainAId);
  const captainB = activePlayers.find((p) => p.id === captainBId);

  const teamA = picks.filter((p) => p.team === 'A');

  const playerById = new Map(activePlayers.map((p) => [p.id, p]));
  const teamPlayers = (team: 'A' | 'B', captainId: number | null): Player[] =>
    [
      ...(captainId ? [captainId] : []),
      ...picks.filter((p) => p.team === team).map((p) => p.playerId),
    ]
      .map((id) => playerById.get(id))
      .filter((p): p is Player => p !== undefined);

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

    if (remainingIds.length === 0 || newPicks.length >= 16) {
      setPhase('complete');
      return;
    }

    if (remainingIds.length === 1) {
      const lastPlayer = squadPlayers.find((p) => remainingIds.includes(p.id));
      if (lastPlayer) {
        setPicks([
          ...newPicks,
          {
            playerId: lastPlayer.id,
            playerName: lastPlayer.name,
            team: 'B' as const,
            position: lastPlayer.position,
          },
        ]);
        setPhase('complete');
      }
      return;
    }

    let nextTurn: 'A' | 'B';
    if (remainingIds.length === 2 && team === 'B') {
      nextTurn = 'A';
    } else if (remainingIds.length === 2 && team === 'A') {
      nextTurn = 'A';
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

    const lastPick = picks[picks.length - 1];
    const prevTurn = lastPick.team;
    setCurrentTurn(prevTurn);
    if (phase === 'complete') setPhase('draft');

    const prevCaptainId = prevTurn === 'A' ? captainAId! : captainBId!;
    const remainingIds = squadPlayers
      .filter(
        (p) => !new Set([...newPicks.map((pk) => pk.playerId), captainAId!, captainBId!]).has(p.id)
      )
      .map((p) => p.id);

    await loadPreferences(prevCaptainId, remainingIds);
  }

  function reset() {
    setPhase('squad');
    setSquadIds([]);
    setCaptainAId(null);
    setCaptainBId(null);
    setPicks([]);
    setCurrentTurn('B');
    setPreferences([]);
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

          {/* Middle — balance and available players */}
          <div className="space-y-4">
            <BalancePanel
              teamA={teamPlayers('A', captainAId)}
              teamB={teamPlayers('B', captainBId)}
              nameA={captainA?.name}
              nameB={captainB?.name}
              complete={phase === 'complete'}
            />

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
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#4A90D9]/30 bg-[#4A90D9]/10">
              <h2 className="text-paper">{captainB?.name}</h2>
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

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlayerMatches, usePlayerProfile } from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

import MatchDetailModal from '../../matches/MatchDetailModal';
import MatchListModal, { MatchListRow } from '@/components/ui/MatchListModal';
import RatingBar from '@/components/ui/RatingBar';
import DeltaBadge from '@/components/ui/DeltaBadge';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import StatCard from '@/components/ui/StatCard';
import { BackIcon } from '@/components/ui/icons';
import { inputClass } from '@/components/ui/formStyles';

function PlayerMatchHistoryModal({
  playerId,
  seasonYear,
  onClose,
  onMatchClick,
}: {
  playerId: number;
  seasonYear: number;
  onClose: () => void;
  onMatchClick: (matchId: number) => void;
}) {
  const { data: matches, isLoading } = usePlayerMatches(playerId, seasonYear);

  const rows: MatchListRow[] = (matches ?? []).map((m) => ({
    matchId: m.id,
    label: m.gameWeek || `S${m.seasonYear}`,
    result: m.result,
    leftName: m.captainAName,
    rightName: m.captainBName,
    leftScore: m.scoreA,
    rightScore: m.scoreB,
  }));

  return (
    <MatchListModal
      title={`Season ${seasonYear} matches`}
      subtitle={`${matches?.length || 0} matches`}
      rows={rows}
      loading={isLoading}
      onClose={onClose}
      onMatchClick={onMatchClick}
    />
  );
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const playerId = Number(params.id);

  const { data: profile, isLoading, isError } = usePlayerProfile(playerId);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStrongFoot, setEditStrongFoot] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [previousSeasonYear, setPreviousSeasonYear] = useState<number | null>(null);

  function startEditingProfile() {
    setEditName(profile?.name || '');
    setEditStrongFoot(profile?.strongFoot || 'Right');
    setEditPosition(profile?.position || 'UNKNOWN');
    setEditActive(profile?.active ?? true);
    setEditingProfile(true);
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await api.put(`/api/v1/players/${playerId}`, {
        name: editName,
        strongFoot: editStrongFoot,
        active: editActive,
        position: editPosition,
      });
      await queryClient.invalidateQueries({ queryKey: ['players', playerId, 'profile'] });
      await queryClient.invalidateQueries({ queryKey: ['players', 'all'] });
      setEditingProfile(false);
    } catch {
      alert('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  }

  if (isLoading) return <LoadingState message="Loading player profile..." />;

  if (isError || !profile)
    return <ErrorState message="Failed to load player. Is the backend running?" />;

  const pointPercentageColor =
    profile.careerStats.careerPointsPercentage >= 60
      ? 'text-pitch'
      : profile.careerStats.careerPointsPercentage >= 40
        ? 'text-amber'
        : 'text-signal';

  return (
    <div>
      {selectedSeasonYear && !selectedMatchId && (
        <PlayerMatchHistoryModal
          playerId={playerId}
          seasonYear={selectedSeasonYear}
          onClose={() => setSelectedSeasonYear(null)}
          onMatchClick={(matchId) => {
            setPreviousSeasonYear(selectedSeasonYear);
            setSelectedSeasonYear(null);
            setSelectedMatchId(matchId);
          }}
        />
      )}

      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => {
            setSelectedMatchId(null);
            setPreviousSeasonYear(null);
          }}
          onBack={
            previousSeasonYear
              ? () => {
                  setSelectedMatchId(null);
                  setSelectedSeasonYear(previousSeasonYear);
                  setPreviousSeasonYear(null);
                }
              : undefined
          }
        />
      )}
      <button
        onClick={() => router.push('/players')}
        className="text-sm text-muted hover:text-paper mb-6 flex items-center gap-1.5 transition-colors"
      >
        <BackIcon />
        All players
      </button>

      {/* Player header */}
      <div className="bg-surface border border-line rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-line flex items-center justify-center text-2xl font-display text-paper flex-shrink-0">
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl text-paper">{profile.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-surface-2 border border-line text-muted text-xs px-2 py-1 rounded-lg">
                {profile.strongFoot} foot
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-lg ${
                  profile.active ? 'bg-pitch/15 text-pitch' : 'bg-line text-muted'
                }`}
              >
                {profile.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-display text-4xl ${pointPercentageColor}`}>
              {profile.careerStats.careerPointsPercentage}%
            </div>
            <div className="text-muted text-xs mt-1">career pt %</div>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-5 mb-5 ${profile.ratingsVisible ? 'md:grid-cols-2' : ''}`}
      >
        {/* Career stats */}
        <div className="bg-surface border border-line rounded-xl p-5">
          <h2 className="text-sm text-muted mb-4">Career stats</h2>
          <div
            className={`grid grid-cols-2 gap-3 ${profile.ratingsVisible ? '' : 'md:grid-cols-4'}`}
          >
            <StatCard label="Matches" value={profile.careerStats.totalMatches} />
            <StatCard
              label="Pt %"
              value={`${profile.careerStats.careerPointsPercentage}%`}
              sub={`${profile.careerStats.totalWins}W ${profile.careerStats.totalDraws}D ${profile.careerStats.totalLosses}L`}
            />
            <StatCard label="Goals" value={profile.careerStats.totalGoals} />
            <StatCard label="Goals per game" value={profile.careerStats.careerGoalsPerGame} />
          </div>
        </div>

        {/* Ratings — admin only */}
        {profile.ratingsVisible && (
          <div className="bg-surface border border-line rounded-xl p-5">
            <h2 className="text-sm text-muted">Ratings</h2>
            <p className="text-xs text-muted mt-0.5 mb-4">ML derived &middot; updates weekly</p>

            {profile.overallRating ? (
              <div className="space-y-4">
                {/* Overall */}
                <div className="bg-pitch/10 rounded-xl p-4 flex items-center justify-between mb-2">
                  <span className="text-sm text-paper">Overall</span>
                  <span className="text-2xl font-mono text-pitch">
                    {profile.overallRating}
                    <DeltaBadge delta={profile.overallDelta} />
                  </span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted">Attack</span>
                    <span className="text-sm font-mono text-paper">
                      {profile.attackRating}
                      <DeltaBadge delta={profile.attackDelta} />
                    </span>
                  </div>
                  <RatingBar value={profile.attackRating || 0} color="bg-red-400" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted">Defence</span>
                    <span className="text-sm font-mono text-paper">
                      {profile.defenceRating}
                      <DeltaBadge delta={profile.defenceDelta} />
                    </span>
                  </div>
                  <RatingBar value={profile.defenceRating || 0} color="bg-blue-500" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted">Reliability</span>
                    <span className="text-sm font-mono text-paper">
                      {profile.reliability}
                      <DeltaBadge delta={profile.reliabilityDelta} />
                    </span>
                  </div>
                  <RatingBar value={profile.reliability || 0} color="bg-green-500" />
                </div>

                <p className="text-xs text-muted pt-2 border-t border-line">
                  Ratings compare you against others in your position group, using points
                  percentage, goals, clean sheets and goals conceded. Recent matches count for more.
                  They reflect recorded outcomes rather than individual skill.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted text-sm">
                <p>Not enough data</p>
                <p className="mt-1">Needs 10+ matches for ML rating</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile edit card */}
      <div className="bg-surface border border-line rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm text-muted">Profile</h2>
          {!editingProfile ? (
            <button
              onClick={startEditingProfile}
              className="text-xs text-pitch hover:opacity-80 border border-pitch/30 px-3 py-1 rounded-lg transition-opacity"
            >
              Edit profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingProfile(false)}
                className="text-xs text-muted hover:text-paper px-3 py-1 rounded-lg border border-line transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="text-xs text-ink bg-pitch hover:opacity-90 px-3 py-1 rounded-lg transition-opacity disabled:opacity-30"
              >
                {savingProfile ? 'Saving\u2026' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {!editingProfile ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Position</span>
              <span className="text-paper">
                {profile.position && profile.position !== 'UNKNOWN' ? profile.position : '\u2014'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Strong foot</span>
              <span className="text-paper">{profile.strongFoot}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Status</span>
              <span className={profile.active ? 'text-pitch' : 'text-muted'}>
                {profile.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted block mb-1.5">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1.5">Position</label>
              <select
                value={editPosition}
                onChange={(e) => setEditPosition(e.target.value)}
                className={inputClass}
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="GK">GK &mdash; Goalkeeper</option>
                <option value="CB">CB &mdash; Centre Back</option>
                <option value="LB">LB &mdash; Left Back</option>
                <option value="RB">RB &mdash; Right Back</option>
                <option value="CDM">CDM &mdash; Defensive Mid</option>
                <option value="CM">CM &mdash; Central Mid</option>
                <option value="CAM">CAM &mdash; Attacking Mid</option>
                <option value="LW">LW &mdash; Left Wing</option>
                <option value="RW">RW &mdash; Right Wing</option>
                <option value="ST">ST &mdash; Striker</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1.5">Strong foot</label>
              <select
                value={editStrongFoot}
                onChange={(e) => setEditStrongFoot(e.target.value)}
                className={inputClass}
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="accent-pitch"
                id="active-toggle"
              />
              <label htmlFor="active-toggle" className="text-sm text-muted cursor-pointer">
                Active player
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Season breakdown */}
      <div className="bg-surface border border-line rounded-xl p-5">
        <h2 className="text-sm text-muted mb-4">Season breakdown</h2>
        {profile.seasonStats.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">No match data yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-2 px-3 text-xs text-muted font-normal">Season</th>
                  <th className="text-center py-2 px-3 text-xs text-muted font-normal">Played</th>
                  <th className="text-center py-2 px-3 text-xs text-muted font-normal">W</th>
                  <th className="text-center py-2 px-3 text-xs text-muted font-normal">D</th>
                  <th className="text-center py-2 px-3 text-xs text-muted font-normal">L</th>
                  <th className="text-center py-2 px-3 text-xs text-muted font-normal">Goals</th>
                  <th className="text-center py-2 px-3 text-xs text-muted font-normal">Pt %</th>
                </tr>
              </thead>
              <tbody>
                {profile.seasonStats.map((s) => (
                  <tr
                    key={s.seasonYear}
                    className="border-b border-line last:border-0 hover:bg-surface-2 cursor-pointer transition-colors"
                    onClick={() => setSelectedSeasonYear(s.seasonYear)}
                  >
                    <td className="py-3 px-3 text-paper">{s.seasonYear}</td>
                    <td className="py-3 px-3 text-center font-mono text-muted">
                      {s.matchesPlayed}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-pitch">{s.wins}</td>
                    <td className="py-3 px-3 text-center font-mono text-amber">{s.draws}</td>
                    <td className="py-3 px-3 text-center font-mono text-signal">{s.losses}</td>
                    <td className="py-3 px-3 text-center font-mono text-muted">{s.goals}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-mono ${
                          s.pointsPercentage >= 60
                            ? 'text-pitch'
                            : s.pointsPercentage >= 40
                              ? 'text-amber'
                              : 'text-signal'
                        }`}
                      >
                        {s.pointsPercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

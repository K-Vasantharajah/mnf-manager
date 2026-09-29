'use client';

import { Player } from '@/lib/types';
import { CheckIcon } from '@/components/ui/icons';

export default function TeamSelector({
  captainName,
  activePlayers,
  teamPlayerIds,
  otherTeamPlayerIds,
  captainId,
  onToggle,
}: {
  captainName: string;
  activePlayers: Player[];
  teamPlayerIds: number[];
  otherTeamPlayerIds: number[];
  captainId: number | '';
  onToggle: (playerId: number) => void;
}) {
  const teamFull = teamPlayerIds.length >= 9;

  return (
    <div className="bg-surface border border-line rounded-xl p-5">
      <h2 className="text-paper mb-1">{captainName}&apos;s team</h2>
      <p className="text-xs text-muted mb-3">{teamPlayerIds.length}/9 players selected</p>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {activePlayers.map((player) => {
          const selected = teamPlayerIds.includes(player.id);
          const onOtherTeam = otherTeamPlayerIds.includes(player.id);
          const isCaptain = player.id === Number(captainId);

          return (
            <button
              type="button"
              key={player.id}
              onClick={() => {
                if (!isCaptain && !onOtherTeam) onToggle(player.id);
              }}
              disabled={onOtherTeam || isCaptain || (teamFull && !selected)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                selected || isCaptain
                  ? 'bg-pitch/10 text-pitch'
                  : onOtherTeam || (teamFull && !selected)
                    ? 'opacity-30 cursor-not-allowed text-muted'
                    : 'hover:bg-surface-2 text-paper/80'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                  selected || isCaptain ? 'bg-pitch border-pitch text-ink' : 'border-line'
                }`}
              >
                {(selected || isCaptain) && <CheckIcon />}
              </div>
              {player.name}
              {isCaptain && <span className="ml-auto text-xs text-pitch">Captain</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

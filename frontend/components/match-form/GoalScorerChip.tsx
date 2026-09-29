'use client';

import { CloseIcon } from '@/components/ui/icons';

export default function GoalScorerChip({
  playerName,
  team,
  goals,
  isOwnGoal,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  playerName: string;
  team: 'A' | 'B';
  goals: number;
  isOwnGoal: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-surface-2 border border-line rounded-lg px-3 py-2">
      <span className="text-sm text-paper flex-1">
        {playerName}
        <span
          className={`ml-2 text-xs font-mono px-2 py-0.5 rounded-full ${
            team === 'A' ? 'bg-pitch/15 text-pitch' : 'bg-[#4A90D9]/15 text-[#4A90D9]'
          }`}
        >
          Team {team}
        </span>
        {isOwnGoal && (
          <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-signal/15 text-signal">
            OG
          </span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          className="w-7 h-7 rounded bg-line text-paper text-sm hover:bg-muted/30 flex items-center justify-center transition-colors"
        >
          &minus;
        </button>
        <span className="text-sm font-mono text-paper min-w-4 text-center">{goals}</span>
        <button
          type="button"
          onClick={onIncrement}
          className="w-7 h-7 rounded bg-line text-paper text-sm hover:bg-muted/30 flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove goal scorer"
        className="text-signal hover:opacity-80 ml-2 transition-opacity"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

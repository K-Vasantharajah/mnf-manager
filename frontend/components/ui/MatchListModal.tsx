'use client';

import { CloseIcon } from '@/components/ui/icons';

export interface MatchListRow {
  matchId: number;
  label: string;
  result?: 'WIN' | 'DRAW' | 'LOSS';
  leftName?: string;
  rightName: string;
  leftScore: number;
  rightScore: number;
}

const resultStyles: Record<string, string> = {
  WIN: 'bg-pitch/10 text-pitch',
  DRAW: 'bg-amber/10 text-amber',
  LOSS: 'bg-signal/10 text-signal',
};

export default function MatchListModal({
  title,
  subtitle,
  rows,
  onClose,
  onMatchClick,
}: {
  title: string;
  subtitle?: string;
  rows: MatchListRow[];
  onClose: () => void;
  onMatchClick: (matchId: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-paper">{title}</h2>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-paper transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {rows.map((row) => (
            <div
              key={row.matchId}
              className="flex items-center gap-3 px-5 py-3 border-b border-line last:border-0 hover:bg-surface-2 cursor-pointer transition-colors"
              onClick={() => {
                onClose();
                onMatchClick(row.matchId);
              }}
            >
              <span className="text-xs text-muted font-mono min-w-10">{row.label}</span>
              {row.result && (
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded min-w-14 text-center ${
                    resultStyles[row.result]
                  }`}
                >
                  {row.result}
                </span>
              )}
              <span className="text-sm flex-1 text-paper/80">
                {row.leftName ? `${row.leftName} vs ${row.rightName}` : `vs ${row.rightName}`}
              </span>
              <span className="text-sm font-mono text-paper">
                {row.leftScore}&ndash;{row.rightScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Player } from '@/lib/types';

export type FactType =
  | 'APPEARANCE_MILESTONE'
  | 'GOAL_MILESTONE'
  | 'FIRST_CAPTAINCY'
  | 'CAPTAINCY_MILESTONE'
  | 'WIN_STREAK'
  | 'SCORING_STREAK'
  | 'UNBEATEN_STREAK'
  | 'UNBEATEN_TOGETHER'
  | 'ATTENDANCE_STREAK';

export interface Fact {
  type: FactType;
  playerId: number;
  partnerId: number | null;
  value: number;
  remaining: number | null;
}

const VISIBLE_BY_DEFAULT = 8;

function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function describe(fact: Fact, nameOf: (id: number) => string | undefined): string | null {
  const player = nameOf(fact.playerId);
  if (!player) return null;

  switch (fact.type) {
    case 'APPEARANCE_MILESTONE':
      return `${player}'s ${ordinal(fact.value)} MNF match`;
    case 'GOAL_MILESTONE': {
      const needed = fact.remaining ?? 0;
      return `${player} is ${needed} goal${needed === 1 ? '' : 's'} off ${fact.value}`;
    }
    case 'FIRST_CAPTAINCY':
      return `${player} captains for the first time`;
    case 'CAPTAINCY_MILESTONE':
      return `${player} captains for the ${ordinal(fact.value)} time`;
    case 'WIN_STREAK':
      return `${player} has won their last ${fact.value} matches`;
    case 'SCORING_STREAK':
      return `${player} has scored in their last ${fact.value} matches`;
    case 'UNBEATEN_STREAK':
      return `${player} is unbeaten in their last ${fact.value} matches`;
    case 'ATTENDANCE_STREAK':
      return `${player} has played ${fact.value} weeks in a row`;
    case 'UNBEATEN_TOGETHER': {
      const partner = fact.partnerId !== null ? nameOf(fact.partnerId) : undefined;
      if (!partner) return null;
      return `${player} and ${partner} are unbeaten in their last ${fact.value} together`;
    }
    default:
      return null;
  }
}

export default function OnTheNight({
  facts,
  players,
}: {
  facts: Fact[];
  players: Map<number, Player>;
}) {
  const [showAll, setShowAll] = useState(false);

  const lines = facts
    .map((fact) => ({ fact, text: describe(fact, (id) => players.get(id)?.name) }))
    .filter((line): line is { fact: Fact; text: string } => line.text !== null);

  if (lines.length === 0) return null;

  const visible = showAll ? lines : lines.slice(0, VISIBLE_BY_DEFAULT);

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-line">
        <h3 className="text-sm text-paper">On the night</h3>
        <p className="text-xs text-muted mt-0.5">Milestones and runs for tonight&apos;s squad</p>
      </div>
      <ul className="divide-y divide-line">
        {visible.map(({ fact, text }) => (
          <li
            key={`${fact.type}-${fact.playerId}-${fact.partnerId ?? ''}`}
            className="px-4 py-2.5 text-sm text-paper/80"
          >
            {text}
          </li>
        ))}
      </ul>
      {lines.length > VISIBLE_BY_DEFAULT && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="w-full px-4 py-2 text-xs text-muted hover:text-paper border-t border-line transition-colors"
        >
          {showAll ? 'Show fewer' : `Show all ${lines.length}`}
        </button>
      )}
    </div>
  );
}

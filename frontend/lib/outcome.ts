export type Outcome = 'win' | 'draw' | 'loss';

export function outcome(goalsFor: number, goalsAgainst: number): Outcome {
  if (goalsFor > goalsAgainst) return 'win';
  if (goalsFor === goalsAgainst) return 'draw';
  return 'loss';
}

export function fromResult(result: 'WIN' | 'DRAW' | 'LOSS'): Outcome {
  return result.toLowerCase() as Outcome;
}

export const OUTCOME_COLOUR: Record<Outcome, string> = {
  win: 'text-pitch',
  draw: 'text-amber',
  loss: 'text-muted',
};

export const OUTCOME_BADGE: Record<Outcome, string> = {
  win: 'bg-pitch/10 text-pitch',
  draw: 'bg-amber/10 text-amber',
  loss: 'bg-line text-muted',
};

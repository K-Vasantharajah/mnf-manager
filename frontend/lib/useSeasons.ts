import { useMatches } from './hooks';

export function useSeasons(): number[] {
  const { data: matches } = useMatches();
  const years = new Set((matches || []).map((m) => m.seasonYear));
  years.add(new Date().getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

export function seasonOptions(seasons: number[]) {
  return [
    ...seasons.map((year) => ({ label: String(year), value: year })),
    { label: 'All', value: 'all' as const },
  ];
}

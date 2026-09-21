interface SeasonFilterProps {
  selected: string;
  onChange: (season: string) => void;
}

export default function SeasonFilter({ selected, onChange }: SeasonFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-surface border border-line rounded-lg p-1">
      {['All', '2026', '2025'].map((season) => (
        <button
          key={season}
          onClick={() => onChange(season)}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            selected === season ? 'bg-surface-2 text-paper' : 'text-muted hover:text-paper'
          }`}
        >
          {season}
        </button>
      ))}
    </div>
  );
}

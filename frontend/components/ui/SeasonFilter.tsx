interface SeasonFilterProps {
  selected: string;
  onChange: (season: string) => void;
}

export default function SeasonFilter({ selected, onChange }: SeasonFilterProps) {
  return (
    <div className="flex gap-2">
      {['All', '2026', '2025'].map((season) => (
        <button
          key={season}
          onClick={() => onChange(season)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selected === season
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {season}
        </button>
      ))}
    </div>
  );
}

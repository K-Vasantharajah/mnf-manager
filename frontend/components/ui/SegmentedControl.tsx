'use client';

export default function SegmentedControl<T extends string | number | undefined>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-surface border border-line rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            value === opt.value ? 'bg-surface-2 text-paper' : 'text-muted hover:text-paper'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

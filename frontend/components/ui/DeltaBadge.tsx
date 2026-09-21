export default function DeltaBadge({ delta }: { delta: number | null | undefined }) {
  if (!delta || delta === 0) return null;
  return (
    <span className={`text-xs font-mono ml-1 ${delta > 0 ? 'text-pitch' : 'text-signal'}`}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}

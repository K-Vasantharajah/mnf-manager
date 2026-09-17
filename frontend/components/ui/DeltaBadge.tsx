export default function DeltaBadge({ delta }: { delta: number | null | undefined }) {
  if (!delta || delta === 0) return null;
  return (
    <span className={`text-xs font-bold ml-1 ${delta > 0 ? 'text-green-500' : 'text-red-400'}`}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}
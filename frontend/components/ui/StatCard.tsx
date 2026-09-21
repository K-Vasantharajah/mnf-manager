export default function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <div className="text-xs text-muted mb-2">{label}</div>
      <div className="text-2xl font-mono text-paper">{value}</div>
      {sub && <div className="text-xs text-muted mt-1.5">{sub}</div>}
    </div>
  );
}

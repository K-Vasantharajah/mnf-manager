export default function RatingBar({ value, color }: { value: number; color: string }) {
  const colorMap: Record<string, string> = {
    'bg-red-400': '#f87171',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
    'bg-amber-400': '#fbbf24',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ flexGrow: 1, backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${value * 10}%`, backgroundColor: colorMap[color] || '#22c55e', height: '6px' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '16px', textAlign: 'right', color: '#111827' }}>{value}</span>
    </div>
  );
}
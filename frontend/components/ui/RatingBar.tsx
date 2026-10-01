export default function RatingBar({
  value,
  color,
  min = 0,
  max = 100,
}: {
  value: number;
  color: string;
  min?: number;
  max?: number;
}) {
  const colorMap: Record<string, string> = {
    'bg-red-400': '#C05746',
    'bg-blue-500': '#4A90D9',
    'bg-green-500': '#3FA66B',
    'bg-amber-400': '#D7A44A',
  };

  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div
        style={{
          flexGrow: 1,
          backgroundColor: 'var(--color-line)',
          borderRadius: '9999px',
          height: '6px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            backgroundColor: colorMap[color] || '#3FA66B',
            height: '6px',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          minWidth: '20px',
          textAlign: 'right',
          color: 'var(--color-paper)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

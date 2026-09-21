export default function RatingBar({ value, color }: { value: number; color: string }) {
  const colorMap: Record<string, string> = {
    'bg-red-400': '#C05746',
    'bg-blue-500': '#4A90D9',
    'bg-green-500': '#3FA66B',
    'bg-amber-400': '#D7A44A',
  };

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
            width: `${value * 10}%`,
            backgroundColor: colorMap[color] || '#3FA66B',
            height: '6px',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          minWidth: '16px',
          textAlign: 'right',
          color: 'var(--color-paper)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

interface Props {
  name: string;
  value: number;
  delta: number;
  color: string;
}

export default function EncoderCard({ name, value, delta, color }: Props) {
  const deltaColor = delta > 0 ? '#22C55E' : delta < 0 ? '#EF4444' : '#64748B';
  const deltaSign = delta > 0 ? '+' : '';

  return (
    <div
      className="rounded-md p-4"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <p className="text-xs uppercase tracking-wider" style={{ color: '#94A3B8' }}>
        {name}
      </p>
      <p className="font-mono text-lg font-medium mt-1" style={{ color: '#E5E7EB' }}>
        {value.toLocaleString()}
      </p>
      <p className="font-mono text-xs mt-0.5" style={{ color: deltaColor }}>
        {deltaSign}{delta}/sec
      </p>
      <div className="mt-2 w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, (value % 16384) / 163.84)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  front: number;
  left: number;
  right: number;
  irLeft: number;
  irRight: number;
}

export default function ObstacleMap({ front, left, right, irLeft, irRight }: Props) {
  const cx = 300;
  const cy = 150;
  const scale = 0.8; // pixels per cm
  const maxR = 200 * scale; // 200cm max display

  const frontR = Math.min(front * scale, maxR);
  const leftR = Math.min(left * scale, maxR);
  const rightR = Math.min(right * scale, maxR);

  const frontColor = front > 50 ? 'rgba(34,197,94,0.12)' : front > 20 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.18)';
  const frontStroke = front > 50 ? 'rgba(34,197,94,0.4)' : front > 20 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.6)';

  return (
    <div className="relative w-full" style={{ height: 300 }}>
      <svg viewBox="0 0 600 300" className="w-full h-full" style={{ background: 'rgba(11,18,32,0.5)', borderRadius: 6 }}>
        {/* Range rings */}
        {[50, 100, 200].map((r) => (
          <circle
            key={r}
            cx={cx} cy={cy} r={r * scale}
            fill="none"
            stroke={r === 50 ? 'rgba(239,68,68,0.2)' : r === 100 ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.1)'}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Ring labels */}
        <text x={cx + 5} y={cy - 50 * scale + 3} fill="#64748B" fontSize={9} fontFamily="JetBrains Mono">50cm</text>
        <text x={cx + 5} y={cy - 100 * scale + 3} fill="#64748B" fontSize={9} fontFamily="JetBrains Mono">100cm</text>
        <text x={cx + 5} y={cy - 200 * scale + 3} fill="#64748B" fontSize={9} fontFamily="JetBrains Mono">200cm</text>

        {/* Grid crosshair */}
        <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
        <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />

        {/* Detection arcs */}
        {/* Front arc: 60deg cone */}
        <path
          d={`M ${cx} ${cy} L ${cx + frontR * Math.sin(Math.PI / 6)} ${cy - frontR * Math.cos(Math.PI / 6)} A ${frontR} ${frontR} 0 0 1 ${cx - frontR * Math.sin(Math.PI / 6)} ${cy - frontR * Math.cos(Math.PI / 6)} Z`}
          fill={frontColor}
          stroke={frontStroke}
          strokeWidth={1}
        />
        {/* Left arc: 60deg cone */}
        <path
          d={`M ${cx} ${cy} L ${cx - leftR * Math.cos(Math.PI / 6)} ${cy - leftR * Math.sin(Math.PI / 6)} A ${leftR} ${leftR} 0 0 0 ${cx - leftR * Math.cos(Math.PI / 6)} ${cy + leftR * Math.sin(Math.PI / 6)} Z`}
          fill={left > 50 ? 'rgba(34,197,94,0.08)' : left > 20 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.12)'}
          stroke={left > 50 ? 'rgba(34,197,94,0.3)' : left > 20 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.5)'}
          strokeWidth={1}
        />
        {/* Right arc: 60deg cone */}
        <path
          d={`M ${cx} ${cy} L ${cx + rightR * Math.cos(Math.PI / 6)} ${cy - rightR * Math.sin(Math.PI / 6)} A ${rightR} ${rightR} 0 0 1 ${cx + rightR * Math.cos(Math.PI / 6)} ${cy + rightR * Math.sin(Math.PI / 6)} Z`}
          fill={right > 50 ? 'rgba(34,197,94,0.08)' : right > 20 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.12)'}
          stroke={right > 50 ? 'rgba(34,197,94,0.3)' : right > 20 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.5)'}
          strokeWidth={1}
        />

        {/* IR obstacle indicators */}
        {irLeft === 1 && (
          <polygon
            points={`${cx - 30},${cy - 5} ${cx - 25},${cy} ${cx - 30},${cy + 5}`}
            fill="#EF4444"
            className="animate-blink-warning"
          />
        )}
        {irRight === 1 && (
          <polygon
            points={`${cx + 30},${cy - 5} ${cx + 25},${cy} ${cx + 30},${cy + 5}`}
            fill="#EF4444"
            className="animate-blink-warning"
          />
        )}

        {/* Vehicle marker */}
        <polygon points={`${cx},${cy - 12} ${cx - 8},${cy + 6} ${cx + 8},${cy + 6}`} fill="#22C55E" />
        <text x={cx - 10} y={cy + 20} fill="#64748B" fontSize={9} fontFamily="JetBrains Mono">UGV</text>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 text-[10px] font-mono" style={{ color: '#64748B' }}>
        Green: Clear · Amber: Caution · Red: Critical
      </div>
    </div>
  );
}

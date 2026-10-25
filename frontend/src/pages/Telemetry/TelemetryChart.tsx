import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

interface Props {
  data: Array<Record<string, number>>;
  dataKey: string;
  color: string;
  yDomain?: [number, number];
  unit?: string;
  referenceLines?: Array<{ y: number; color: string; label: string }>;
}

export default function TelemetryChart({ data, dataKey, color, yDomain, unit, referenceLines }: Props) {
  return (
    <div className="h-[240px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`chartGrad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="index" hide />
          <YAxis
            domain={yDomain || ['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(17,24,39,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              fontSize: 12,
              color: '#E5E7EB',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}${unit || ''}`, dataKey]}
            labelStyle={{ display: 'none' }}
          />
          {referenceLines?.map((rl) => (
            <ReferenceLine
              key={rl.label}
              y={rl.y}
              stroke={rl.color}
              strokeDasharray="6 4"
              strokeWidth={1}
              label={{ value: rl.label, fill: rl.color, fontSize: 10, position: 'insideTopRight' }}
            />
          ))}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#chartGrad-${dataKey})`}
            dot={false}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

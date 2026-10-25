import {
  Battery, Zap, Thermometer, Droplets, SignalHigh, Hash,
  Download,
} from 'lucide-react';
import { useTelemetryStore } from '@/store/telemetryStore';
import StatCard from '@/components/common/StatCard';
import DataCard from '@/components/common/DataCard';
import TelemetryChart from './TelemetryChart';
import EncoderCard from './EncoderCard';

export default function TelemetryPage() {
  const batteryPercent = useTelemetryStore((s) => s.batteryPercent);
  const batteryVoltage = useTelemetryStore((s) => s.batteryVoltage);

  const temperature = useTelemetryStore((s) => s.temperature);
  const humidity = useTelemetryStore((s) => s.humidity);

  const rssi = useTelemetryStore((s) => s.rssi);
  const snr = useTelemetryStore((s) => s.snr);

  const history = useTelemetryStore((s) => s.history);

  const leftEncoder = useTelemetryStore((s) => s.leftEncoder);
  const rightEncoder = useTelemetryStore((s) => s.rightEncoder);
  
  const batteryColor = batteryPercent > 50 ? '#22C55E' : batteryPercent > 20 ? '#F59E0B' : '#EF4444';
  const batteryIconColor = batteryPercent > 50 ? '#22C55E' : batteryPercent > 20 ? '#F59E0B' : '#EF4444';
  const signalColor = rssi > -60 ? '#22C55E' : rssi > -80 ? '#F59E0B' : '#EF4444';

  const chartData = history.batteryPercent.map((_, i) => ({
    index: i,

    batteryPercent: history.batteryPercent[i] ?? 0,
    batteryVoltage: history.batteryVoltage[i] ?? 0,

    temperature: history.temperature[i] ?? 0,
    humidity: history.humidity[i] ?? 0,

    rssi: history.rssi[i] ?? 0,
    snr: history.snr[i] ?? 0,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: '#E5E7EB' }}>
            TELEMETRY
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Real-time vehicle diagnostics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {['Live', '1m', '5m', '15m'].map((t, i) => (
              <button
                key={t}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${i === 0 ? 'text-[#E5E7EB]' : 'text-[#94A3B8] hover:text-[#E5E7EB]'}`}
                style={i === 0 ? { background: 'rgba(255,255,255,0.08)' } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
          >
            <Download size={14} />
            EXPORT DATA
          </button>
        </div>
      </div>

      {/* Telemetry Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Battery size={20} color={batteryIconColor} />}
          label="BATTERY LEVEL"
          value={`${Math.round(batteryPercent)}%`}
          sub={`${batteryVoltage.toFixed(2)}V`}
          color={batteryColor}
          washColor={batteryPercent > 50 ? 'green-wash' : batteryPercent > 20 ? 'amber-wash' : 'red-wash'}
          progress={batteryPercent}
          progressColor={batteryColor}
          delay={0}
        >
          <TelemetrySparkline data={chartData} dataKey="batteryPercent" color={batteryColor} />
        </StatCard>
        <StatCard
          icon={<Zap size={20} color="#F59E0B" />}
          label="VOLTAGE"
          value={`${batteryVoltage.toFixed(1)}V`}
          sub="Nominal: 12.6V"
          trend="-0.2V"
          trendColor="#F59E0B"
          color="#E5E7EB"
          washColor="amber-wash"
          delay={80}
        >
          <TelemetrySparkline data={chartData} dataKey="batteryVoltage" color="#F59E0B" />
        </StatCard>
        <StatCard
          icon={<Thermometer size={20} color="#F59E0B" />}
          label="TEMPERATURE"
          value={`${Math.round(temperature)}C`}
          sub="Ambient internal"
          color="#E5E7EB"
          washColor="amber-wash"
          progress={(temperature / 60) * 100}
          progressColor={temperature > 45 ? '#EF4444' : '#F59E0B'}
          delay={160}
        >
          <TelemetrySparkline data={chartData} dataKey="temperature" color={temperature > 45 ? '#EF4444' : '#F59E0B'} />
        </StatCard>
        <StatCard
          icon={<Droplets size={20} color="#3B82F6" />}
          label="HUMIDITY"
          value={`${Math.round(humidity)}%`}
          sub="Relative humidity"
          color="#E5E7EB"
          washColor="blue-wash"
          progress={humidity}
          progressColor="#3B82F6"
          delay={240}
        >
          <TelemetrySparkline data={chartData} dataKey="humidity" color="#3B82F6" />
        </StatCard>
        <StatCard
          icon={<SignalHigh size={20} color={signalColor} />}
          label="SIGNAL QUALITY"
          value={`${Math.round(rssi)} dBm`}
          sub={`SNR: ${Math.round(snr)}dB · Strong`}
          color={signalColor}
          washColor={rssi > -60 ? 'green-wash' : rssi > -80 ? 'amber-wash' : 'red-wash'}
          progress={Math.max(0, Math.min(100, (rssi + 100) / 70 * 100))}
          progressColor={signalColor}
          delay={320}
        >
          <TelemetrySparkline data={chartData} dataKey="rssi" color={signalColor} />
        </StatCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataCard title="BATTERY HISTORY" icon={<Battery size={16} style={{ color: '#94A3B8' }} />}>
          <TelemetryChart
            data={chartData}
            dataKey="batteryPercent"
            color="#22C55E"
            yDomain={[0, 100]}
            unit="%"
            referenceLines={[{ y: 20, color: '#EF4444', label: 'CRITICAL' }, { y: 50, color: '#F59E0B', label: 'WARNING' }]}
          />
        </DataCard>
        <DataCard title="TEMPERATURE HISTORY" icon={<Thermometer size={16} style={{ color: '#94A3B8' }} />}>
          <TelemetryChart
            data={chartData}
            dataKey="temperature"
            color="#F59E0B"
            yDomain={[0, 60]}
            unit="C"
            referenceLines={[{ y: 45, color: '#EF4444', label: 'CRITICAL' }]}
          />
        </DataCard>
        <DataCard title="SIGNAL HISTORY" icon={<SignalHigh size={16} style={{ color: '#94A3B8' }} />} className="lg:col-span-2">
          <div className="h-[200px]">
            <TelemetryChart data={chartData} dataKey="rssi" color="#22C55E" yDomain={[-100, -30]} unit="dBm" />
          </div>
        </DataCard>
      </div>

      {/* Encoder Data */}
      <DataCard title="ENCODER DATA" icon={<Hash size={16} style={{ color: '#94A3B8' }} />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <EncoderCard
            name="Left Encoder"
            value={leftEncoder}
            delta={0}
            color="#06B6D4"
          />

          <EncoderCard
            name="Right Encoder"
            value={rightEncoder}
            delta={0}
            color="#06B6D4"
          />

          <EncoderCard
            name="Movement"
            value={0}
            delta={0}
            color="#8B5CF6"
          />

          <EncoderCard
            name="Mode"
            value={0}
            delta={0}
            color="#22C55E"
          />
        </div>
      </DataCard>
    </div>
  );
}

function TelemetrySparkline({ data, dataKey, color }: { data: Array<Record<string, number>>; dataKey: string; color: string }) {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d[dataKey] ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 200;
  const h = 40;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-3" preserveAspectRatio="none" style={{ height: 40 }}>
      <defs>
        <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#grad-${dataKey})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

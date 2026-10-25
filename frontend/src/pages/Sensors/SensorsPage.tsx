import { useState, type ReactNode } from 'react';
import {
  Shield,
  Radar,
  Eye,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Filter,
  Download,
} from 'lucide-react';

import { useTelemetryStore } from '@/store/telemetryStore';
import DataCard from '@/components/common/DataCard';
import StatusBadge from '@/components/common/StatusBadge';
import ObstacleMap from './ObstacleMap';

export default function SensorsPage() {
  const ultrasonicFront = useTelemetryStore((s) => s.distanceFront);
  const ultrasonicLeft = useTelemetryStore((s) => s.distanceLeft);
  const ultrasonicRight = useTelemetryStore((s) => s.distanceRight);
  const irLeft = useTelemetryStore((s) => s.irLeft);
  const irRight = useTelemetryStore((s) => s.irRight);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  type SensorStatus = 'online' | 'warning' | 'critical';
  interface SensorRecord {
    name: string;
    type: string;
    value: string;
    status: SensorStatus;
  }

  const sensorData: SensorRecord[] = [
    { name: 'Ultrasonic Front', type: 'Distance', value: `${Math.round(ultrasonicFront)} cm`, status: ultrasonicFront > 50 ? 'online' as const : ultrasonicFront > 20 ? 'warning' as const : 'critical' as const },
    { name: 'Ultrasonic Left', type: 'Distance', value: `${Math.round(ultrasonicLeft)} cm`, status: ultrasonicLeft > 50 ? 'online' as const : ultrasonicLeft > 20 ? 'warning' as const : 'critical' as const },
    { name: 'Ultrasonic Right', type: 'Distance', value: `${Math.round(ultrasonicRight)} cm`, status: ultrasonicRight > 50 ? 'online' as const : ultrasonicRight > 20 ? 'warning' as const : 'critical' as const },
    { name: 'IR Left', type: 'Digital', value: irLeft ? 'OBSTACLE' : 'CLEAR', status: irLeft ? 'critical' as const : 'online' as const },
    { name: 'IR Right', type: 'Digital', value: irRight ? 'OBSTACLE' : 'CLEAR', status: irRight ? 'critical' as const : 'online' as const },
  ];

  console.log(sensorData);

  const exportSensorData = () => {
    const data = JSON.stringify(sensorData, null, 2);

    const blob = new Blob([data], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensor-data.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  const activeSensors = sensorData.filter((s) => s.status !== 'critical').length;
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: '#E5E7EB' }}>
            SENSORS
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Obstacle detection and proximity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge variant="online">{activeSensors}/{sensorData.length} ACTIVE</StatusBadge>
          <div className="flex rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${view === v ? 'text-[#E5E7EB]' : 'text-[#94A3B8] hover:text-[#E5E7EB]'}`}
                style={view === v ? { background: 'rgba(255,255,255,0.08)' } : undefined}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Proximity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ultrasonic Panel */}
        <DataCard title="ULTRASONIC SENSORS" icon={<Radar size={16} style={{ color: '#94A3B8' }} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <UltrasonicWidget
              icon={<ArrowUp size={24} />}
              label="FRONT"
              distance={ultrasonicFront}
            />
            <UltrasonicWidget
              icon={<ArrowLeft size={24} />}
              label="LEFT"
              distance={ultrasonicLeft}
            />
            <UltrasonicWidget
              icon={<ArrowRight size={24} />}
              label="RIGHT"
              distance={ultrasonicRight}
            />
          </div>
        </DataCard>

        {/* IR Sensor Panel */}
        <DataCard title="IR SENSORS" icon={<Eye size={16} style={{ color: '#94A3B8' }} />}>
          <div className="flex gap-4 mt-2">
            <IRWidget label="IR LEFT" value={irLeft} />
            <IRWidget label="IR RIGHT" value={irRight} />
          </div>
        </DataCard>
      </div>

      {/* Obstacle Map */}
      <DataCard title="OBSTACLE MAP" icon={<Shield size={16} style={{ color: '#94A3B8' }} />} subtitle="Top-down proximity visualization">
        <ObstacleMap
          front={ultrasonicFront}
          left={ultrasonicLeft}
          right={ultrasonicRight}
          irLeft={irLeft}
          irRight={irRight}
        />
      </DataCard>

      {/* Sensor Details Table */}
      <DataCard
        title="SENSOR READINGS LOG"
        icon={<Shield size={16} style={{ color: '#94A3B8' }} />}
        actions={
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-md hover:bg-white/5 transition-colors" style={{ color: '#64748B' }}>
              <Filter size={14} />
            </button>
            <button onClick={exportSensorData} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}>
              <Download size={12} />
              Export
            </button>
          </div>
        }
      >
        <div className="mt-2 overflow-x-auto">
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {sensorData.map((sensor) => (
                <div
                  key={sensor.name}
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4
                      className="text-sm font-medium"
                      style={{ color: '#E5E7EB' }}
                    >
                      {sensor.name}
                    </h4>

                    <StatusBadge variant={sensor.status}>
                      {sensor.status}
                    </StatusBadge>
                  </div>

                  <p
                    className="text-xs mt-1"
                    style={{ color: '#94A3B8' }}
                  >
                    {sensor.type}
                  </p>

                  <p
                    className="font-mono text-xl mt-3"
                    style={{ color: '#E5E7EB' }}
                  >
                    {sensor.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Sensor', 'Type', 'Current Value', 'Status', 'Last Update', 'Trend'].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensorData.map((s, i) => (
                    <tr
                      key={s.name}
                      className="border-b transition-colors hover:bg-white/[0.02]"
                      style={{ borderColor: 'rgba(255,255,255,0.04)', animationDelay: `${i * 50}ms` }}
                    >
                      <td className="px-3 py-2.5 text-sm" style={{ color: '#E5E7EB' }}>{s.name}</td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: '#94A3B8' }}>{s.type}</td>
                      <td className="px-3 py-2.5 font-mono text-sm" style={{ color: '#E5E7EB' }}>{s.value}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge variant={s.status}>
                          {s.status === 'online' ? 'Online' : s.status === 'warning' ? 'Warning' : 'Critical'}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: '#64748B' }}>
                        {new Date().toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#64748B' }}>
                        {s.status === 'online' ? 'Stable' : s.status === 'warning' ? 'Decreasing' : 'Alert'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DataCard>
    </div>
  );
}

function UltrasonicWidget({ icon, label, distance, }: { icon: ReactNode; label: string; distance: number; }) {
  const color = distance > 100 ? '#22C55E' : distance > 40 ? '#F59E0B' : '#EF4444';
  const status = distance > 100 ? 'Online' : distance > 40 ? 'Warning' : 'Critical';
  const statusVariant = distance > 100 ? 'online' as const : distance > 40 ? 'warning' as const : 'critical' as const;

  return (
    <div
      className="flex-1 text-center p-5 rounded-lg flex flex-col items-center gap-2"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>{label}</span>
      <span className="font-mono text-2xl font-medium" style={{ color, lineHeight: 1 }}>
        {Math.round(distance)} <span className="text-sm" style={{ color: '#64748B' }}>cm</span>
      </span>
      <StatusBadge variant={statusVariant} size="sm">{status}</StatusBadge>
    </div>
  );
}

function IRWidget({ label, value }: { label: string; value: number }) {
  const color = value ? '#EF4444' : '#22C55E';
  const text = value ? 'OBSTACLE' : 'NO OBSTACLE';

  return (
    <div
      className="flex-1 text-center p-5 rounded-lg flex flex-col items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>{label}</span>
      <span className="font-mono text-xl font-medium" style={{ color, lineHeight: 1 }} > {value ? 'TOUCHDOWN DETECTED' : 'TOUCHDOWN CLEAR'} </span>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          border: `2px solid ${color}`,
          background: value ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        }}
      >
        <div
          className={`w-3 h-3 rounded-full ${value ? 'animate-blink-warning' : ''}`}
          style={{ background: color }}
        />
      </div>
      <span className="text-[11px]" style={{ color: '#64748B' }}>{text}</span>
    </div>
  );
}

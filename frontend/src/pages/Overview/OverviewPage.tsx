import {
  CheckCircle2, Target, BatteryMedium, SignalHigh,
  Thermometer, Droplets, Crosshair, Download,
  AlertTriangle, Info, CheckCircle, Eye,
} from 'lucide-react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useVisionStore } from '@/store/visionStore';
import { DETECTION_COLORS, DETECTION_LABELS } from '@/types/telemetry';
import type { VisionDetection } from '@/types/telemetry';
import type { TelemetryAlert } from '@/types/telemetry';
import StatCard from '@/components/common/StatCard';
import DataCard from '@/components/common/DataCard';
import Scene3D from './Scene3D';

export default function OverviewPage() {
  const rssi = useTelemetryStore((s) => s.rssi);
  const snr = useTelemetryStore((s) => s.snr);
  const batteryPercent = useTelemetryStore((s) => s.batteryPercent);
  const batteryVoltage = useTelemetryStore((s) => s.batteryVoltage);

  const mode = useTelemetryStore((s) => s.mode);
  const ugvMode = useTelemetryStore((s) => s.ugvMode);

  const latitude = useTelemetryStore((s) => s.latitude);
  const longitude = useTelemetryStore((s) => s.longitude);

  const yaw = useTelemetryStore((s) => s.yaw);
  const gpsAltitude = useTelemetryStore((s) => s.gpsAltitude);
  const temperature = useTelemetryStore((s) => s.temperature);
  const humidity = useTelemetryStore((s) => s.humidity);
  const PreAlerts = useTelemetryStore((s) => s.alerts);
  const PreDetections = useVisionStore((s) => s.detections);
  const alerts = PreAlerts.filter((a) => !a.dismissed);
  const detections = PreDetections.slice(0, 6);
  const health = useTelemetryStore((s) => s.health);



  const batteryColor = batteryPercent > 50
    ? '#22C55E'
    : batteryPercent > 20
    ? '#F59E0B'
    : '#EF4444';
  const batteryIconColor = batteryColor;
  const signalColor = rssi > -60 ? '#22C55E' : rssi > -80 ? '#F59E0B' : '#EF4444';


  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#E5E7EB' }}>
            COMMAND OVERVIEW
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Real-time situational awareness
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}>
            <Download size={14} />
            EXPORT
          </button>
          <span className="font-mono text-xs" style={{ color: '#64748B' }}>
            {new Date().toISOString().slice(11, 19)} UTC
          </span>
        </div>
      </div>

      {/* Status Grid - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle2 size={16} color="#22C55E" />}
          label="SYSTEM STATUS"
          value="OPERATIONAL"
          sub="All systems nominal"
          color="#22C55E"
          washColor="green-wash"
          compact
          delay={0}
        />
        <StatCard
          icon={<Target size={16} color="#3B82F6" />}
          label="VEHICLE MODE"
          value={`${mode} • ${ugvMode}`}
          sub={
            ugvMode === 'MANUAL'
              ? 'Operator controlled'
              : 'Autonomous'
          }
          color={
            ugvMode === 'MANUAL'
              ? '#3B82F6'
              : '#22C55E'
          }
          washColor="blue-wash"
          compact
          delay={80}
        />
        <StatCard
          icon={<BatteryMedium size={16} color={batteryIconColor} />}
          label="BATTERY"
          color={batteryColor}
          value={`${Math.round(batteryPercent)}%`}
          sub={`${batteryVoltage.toFixed(2)}V`}
          washColor={
            batteryPercent > 50
              ? 'green-wash'
              : batteryPercent > 20
              ? 'amber-wash'
              : 'red-wash'
          }
          progress={batteryPercent}
                    progressColor={batteryColor}
                    compact
                    delay={160}
        />
        <StatCard
          icon={<SignalHigh size={16} color={signalColor} />}
          label="SIGNAL"
          value={`RSSI ${Math.round(rssi)}`}
          sub={`SNR ${Math.round(snr)}dB · ${rssi > -60 ? 'Strong' : rssi > -80 ? 'Fair' : 'Weak'}`}
          color={signalColor}
          washColor={rssi > -60 ? 'green-wash' : rssi > -80 ? 'amber-wash' : 'red-wash'}
          progress={Math.max(0, Math.min(100, (rssi + 100) / 70 * 100))}
          progressColor={signalColor}
          compact
          delay={240}
        />
      </div>

      {/* Environment + Mission Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Thermometer size={20} color="#F59E0B" />}
          label="TEMPERATURE"
          value={`${Math.round(temperature)}C`}
          sub="Internal ambient"
          trend="+2C from avg"
          trendColor="#F59E0B"
          washColor="amber-wash"
          delay={320}
        />
        <StatCard
          icon={<Droplets size={20} color="#3B82F6" />}
          label="HUMIDITY"
          value={`${Math.round(humidity)}%`}
          sub="Relative humidity"
          color="#3B82F6"
          progress={humidity}
          progressColor="#3B82F6"
          washColor="blue-wash"
          delay={400}
        />
        <StatCard
          icon={<Crosshair size={20} color="#22C55E" />}
          label="MISSION STATUS"
          value="ACTIVE"
          sub="Waypoint 3 of 7"
          color="#22C55E"
          washColor="green-wash"
          delay={480}
        >
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full"
                style={{
                  background: i <= 3 ? '#22C55E' : i === 4 ? '#3B82F6' : 'rgba(255,255,255,0.06)',
                }}
              />
            ))}
          </div>
        </StatCard>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* 3D Map */}
        <DataCard
          title="SITUATIONAL AWARENESS"
          subtitle="3D operational environment"
          className="min-h-[420px]"
          noPadding
        >
          <div className="relative w-full h-[380px] rounded-lg overflow-hidden">
            <Scene3D />
            <div
              className="absolute bottom-3 left-3 px-3 py-2 rounded-md"
              style={{ background: 'rgba(11,18,32,0.8)', backdropFilter: 'blur(8px)' }}
            >
              <div className="font-mono text-xs">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>

              <div className="font-mono text-xs">
                ALT {gpsAltitude.toFixed(1)}m
              </div>

              <div className="font-mono text-xs">
                YAW {yaw.toFixed(0)}°
              </div>
            </div>
          </div>
        </DataCard>

        {/* Alerts + Detections */}
        <div className="flex flex-col gap-4">
          {/* Active Alerts */}
          <DataCard
            title="ACTIVE ALERTS"
            actions={
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                {alerts.length}
              </span>
            }
          >
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {alerts.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6" style={{ color: '#64748B' }}>
                  <CheckCircle size={16} />
                  <span className="text-sm">No active alerts</span>
                </div>
              ) : (
                alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))
              )}
            </div>
          </DataCard>

          {/* Recent Detections */}
          <DataCard
            title="RECENT DETECTIONS"
            actions={
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                {detections.length}
              </span>
            }
          >
            <div className="max-h-[240px] overflow-y-auto">
              {detections.map((det, i) => (
                <DetectionItem key={det.id} detection={det} index={i} />
              ))}
            </div>
          </DataCard>
        </div>
      </div>

      {/* System Health Bar */}
      <DataCard noPadding>
        <div className="flex items-center gap-6 px-5 py-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-[0.05em]" style={{ color: '#94A3B8' }}>
            SYSTEM HEALTH
          </span>
          <div className="flex-1 flex items-center gap-5 flex-wrap">
            {health.length === 0 ? (
              <span
                className="text-xs"
                style={{ color: '#64748B' }}
              >
                No health data available
              </span>
            ) : (
              health.map((h) => (
                <div key={h.name} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: h.status === 'healthy' ? '#22C55E' : h.status === 'degraded' ? '#F59E0B' : '#EF4444',
                    }}
                  />
                  <span className="text-xs" style={{ color: '#94A3B8' }}>{h.name}</span>
                  <span className="font-mono text-[11px]" style={{ color: '#64748B' }}>{h.uptime}%</span>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#94A3B8' }}>Overall</span>
            <span className="font-mono text-base font-medium" style={{ color: '#22C55E' }}>98%</span>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="10" cy="10" r="8" fill="none" stroke="#22C55E" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 8 * 0.98} ${2 * Math.PI * 8 * 0.02}`}
                strokeDashoffset={-Math.PI * 8 * 0.5}
                transform="rotate(-90 10 10)"
              />
            </svg>
          </div>
        </div>
      </DataCard>
    </div>
  );
}

function AlertItem({ alert, }: { alert: TelemetryAlert; }) {
  const dismissAlert = useTelemetryStore((s) => s.dismissAlert);
  const borderColor = alert.severity === 'warning' ? '#F59E0B' : alert.severity === 'critical' ? '#EF4444' : '#3B82F6';
  const Icon = alert.severity === 'warning' ? AlertTriangle : alert.severity === 'critical' ? AlertTriangle : Info;

  return (
    <div
      className="flex items-start gap-2 p-3 rounded-lg"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        background:
          alert.severity === 'warning' ? 'rgba(245,158,11,0.04)' :
          alert.severity === 'critical' ? 'rgba(239,68,68,0.04)' :
          'rgba(59,130,246,0.04)',
      }}
    >
      <Icon size={16} style={{ color: borderColor, flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: '#E5E7EB' }}>{alert.title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{alert.detail}</p>
        <p className="text-[11px] mt-1" style={{ color: '#64748B' }}>
          {new Date(alert.timestamp).toLocaleTimeString()}
        </p>
      </div>
      <button
        onClick={() => dismissAlert(alert.id)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-white/5 transition-colors"
        style={{ color: '#64748B' }}
      >
        <span className="sr-only">Dismiss</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

function DetectionItem({ detection, index }: { detection: VisionDetection; index: number }) {
  const color = DETECTION_COLORS[detection.class as keyof typeof DETECTION_COLORS] || '#94A3B8';
  const label = DETECTION_LABELS[detection.class as keyof typeof DETECTION_LABELS] || detection.class;

  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b last:border-b-0 transition-colors hover:bg-white/[0.02] cursor-pointer"
      style={{ borderColor: 'rgba(255,255,255,0.04)', animationDelay: `${720 + index * 50}ms` }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20` }}
      >
        <Eye size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#E5E7EB' }}>{label}</p>
        <p className="text-[11px]" style={{ color: '#94A3B8' }}>
          {Math.round(detection.confidence * 100)}% confidence
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-mono text-[11px]" style={{ color: '#64748B' }}>
          {new Date(detection.timestamp).toLocaleTimeString()}
        </p>
        <p className="text-[11px]" style={{ color: '#64748B' }}>SE quadrant</p>
      </div>
    </div>
  );
}

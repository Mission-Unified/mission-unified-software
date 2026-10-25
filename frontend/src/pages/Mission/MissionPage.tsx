import { useState, useCallback } from 'react';
import {
  Gauge, Gamepad2, ClipboardList, MapPinned, Plane,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square,
  CheckCircle2,
} from 'lucide-react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useCommandStore } from '@/store/commandStore';
import { useCommand } from '@/hooks/useCommand';
import DataCard from '@/components/common/DataCard';
import StatusBadge from '@/components/common/StatusBadge';
import { showToast } from '@/hooks/useToast';

const waypoints = [
  { id: 1, lat: 12.9714, lon: 77.5942, action: 'MOVE' as const, completed: true, current: false, distance: 0 },
  { id: 2, lat: 12.9715, lon: 77.5944, action: 'HOLD' as const, actionValue: 30, completed: true, current: false, distance: 25 },
  { id: 3, lat: 12.9716, lon: 77.5946, action: 'CAPTURE' as const, completed: true, current: false, distance: 50 },
  { id: 4, lat: 12.9718, lon: 77.5948, action: 'MOVE' as const, completed: false, current: true, distance: 240 },
  { id: 5, lat: 12.9720, lon: 77.5950, action: 'HOLD' as const, actionValue: 60, completed: false, current: false, distance: 480 },
  { id: 6, lat: 12.9722, lon: 77.5952, action: 'CAPTURE' as const, completed: false, current: false, distance: 720 },
  { id: 7, lat: 12.9724, lon: 77.5954, action: 'LAND' as const, completed: false, current: false, distance: 960 },
];

export default function MissionPage() {
  const battery = useTelemetryStore((s) => s.batteryPercent);
  const mode = useCommandStore((s) => s.controlMode);
  const movement = useTelemetryStore((s) => s.movement);
  const speed = useCommandStore((s) => s.movementSpeed);
  const heading = useTelemetryStore((s) => s.yaw);
  const gpsSats = useTelemetryStore((s) => s.satellites);

  const { sendCommand, setMovementSpeed, setControlMode } = useCommand();
  const [eStopActive, setEStopActive] = useState(false);
  const [, setPressedKey] = useState<string | null>(null);

  const handleCommand = useCallback(async (cmd: string, label: string) => {
    try {
      await sendCommand(cmd);
      showToast(`Command: ${label}`, undefined, 'success');
    } catch {
      showToast(`Command failed: ${label}`, undefined, 'error');
    }
  }, [sendCommand]);

  const handleEStop = useCallback(() => {
    setEStopActive(true);
    sendCommand('CTRL:E').catch(() => {});
    showToast('EMERGENCY STOP ACTIVATED', undefined, 'error');
  }, [sendCommand]);

  const movementColor = movement === 'STOP' ? '#94A3B8' : '#22C55E';

  const dpads = [
    { cmd: 'CTRL:F', label: 'Forward', icon: ArrowUp, pos: 'col-start-2 row-start-1' },
    { cmd: 'CTRL:L', label: 'Left', icon: ArrowLeft, pos: 'col-start-1 row-start-2' },
    { cmd: 'CTRL:S', label: 'Stop', icon: Square, pos: 'col-start-2 row-start-2', danger: true },
    { cmd: 'CTRL:R', label: 'Right', icon: ArrowRight, pos: 'col-start-3 row-start-2' },
    { cmd: 'CTRL:B', label: 'Backward', icon: ArrowDown, pos: 'col-start-2 row-start-3' },
  ];

  return (
    <div className="p-6 space-y-6 relative">
      {/* E-Stop Overlay */}
      {eStopActive && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <div className="animate-blink-warning">
            <p className="text-4xl font-bold tracking-wider" style={{ color: '#EF4444' }}>EMERGENCY STOP ACTIVATED</p>
          </div>
          <button
            onClick={() => setEStopActive(false)}
            className="mt-8 px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#E5E7EB' }}
          >
            RESET SYSTEM
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: '#E5E7EB' }}>
            MISSION CONTROL
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Vehicle operation and command
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleEStop}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors hover:brightness-110"
            style={{ background: '#EF4444', color: '#FFFFFF' }}
          >
            <Square size={16} />
            E-STOP
          </button>
          <div className="flex rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['MANUAL', 'AUTO'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setControlMode(m)}
                className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${mode === m ? 'text-[#0B1220]' : 'text-[#94A3B8]'}`}
                style={mode === m ? { background: m === 'MANUAL' ? '#3B82F6' : '#22C55E' } : undefined}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status + Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vehicle Status */}
        <DataCard title="VEHICLE STATUS" icon={<Gauge size={16} style={{ color: '#94A3B8' }} />}>
          <div className="mt-2 space-y-0">
            {[
              { label: 'System Status', value: <StatusBadge variant="online">Online</StatusBadge> },
              { label: 'Control Mode', value: <span className="font-mono text-base" style={{ color: mode === 'MANUAL' ? '#3B82F6' : '#22C55E' }}>{mode}</span> },
              { label: 'Movement State', value: <span className="font-mono text-base" style={{ color: movementColor }}>{movementText(movement)}</span> },
              { label: 'Mission Status', value: <span className="font-mono text-base" style={{ color: '#22C55E' }}>IN PROGRESS</span> },
              { label: 'Current Speed', value: <span className="font-mono text-base" style={{ color: '#E5E7EB' }}>0.0 m/s</span> },
              { label: 'Heading', value: <span className="font-mono text-base" style={{ color: '#E5E7EB' }}>{String(heading).padStart(3, '0')}°</span> },
              { label: 'GPS Lock', value: <span className="font-mono text-base" style={{ color: '#22C55E' }}>{gpsSats} SVs</span> },
              { label: 'Battery', value: (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base" style={{ color: battery > 20 ? '#22C55E' : '#EF4444' }}>{Math.round(battery)}%</span>
                  <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${battery}%`, background: battery > 20 ? '#22C55E' : '#EF4444' }} />
                  </div>
                </div>
              )},
            ].map((item, i) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2.5 border-b last:border-b-0"
                style={{ borderColor: 'rgba(255,255,255,0.04)', animationDelay: `${i * 60}ms` }}
              >
                <span className="text-sm" style={{ color: '#94A3B8' }}>{item.label}</span>
                <div>{item.value}</div>
              </div>
            ))}
          </div>
        </DataCard>

        {/* Manual Controls */}
        <DataCard title="MANUAL CONTROL" icon={<Gamepad2 size={16} style={{ color: '#94A3B8' }} />}>
          <div className="flex flex-col items-center mt-4">
            {/* D-Pad */}
            <div
              className="grid grid-cols-3 gap-2"
              style={{
                opacity: mode === 'AUTO' ? 0.3 : 1,
                pointerEvents: mode === 'AUTO' ? 'none' : 'auto',
              }}
            >
              {dpads.map((btn) => (
                <button
                  key={btn.cmd}
                  className={`${btn.pos} w-[52px] h-[52px] rounded-[10px] flex items-center justify-center transition-all duration-150 active:scale-95`}
                  style={{
                    background: btn.danger ? 'rgba(239,68,68,0.1)' : 'rgba(17,24,39,0.8)',
                    border: `1px solid ${btn.danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'}`,
                    color: btn.danger ? '#EF4444' : '#E5E7EB',
                  }}
                  onMouseDown={() => { setPressedKey(btn.cmd); handleCommand(btn.cmd, btn.label); }}
                  onMouseUp={() => setPressedKey(null)}
                  onMouseLeave={() => setPressedKey(null)}
                >
                  <btn.icon size={24} />
                </button>
              ))}
            </div>

            {/* Speed Slider */}
            <div className="w-full max-w-[200px] mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider" style={{ color: '#94A3B8' }}>Speed</span>
                <span className="font-mono text-base" style={{ color: '#E5E7EB' }}>{speed}%</span>
              </div>
              <input
                type="range"
                min={0} max={100} value={speed}
                onChange={(e) => setMovementSpeed(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #22C55E ${speed}%, rgba(255,255,255,0.06) ${speed}%)`,
                }}
              />
            </div>

            {/* Speed Presets */}
            <div className="flex gap-2 mt-3">
              {[
                { label: 'SLOW', value: 25 },
                { label: 'CRUISE', value: 50 },
                { label: 'FAST', value: 75 },
                { label: 'MAX', value: 100 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setMovementSpeed(preset.value)}
                  className="px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors"
                  style={{
                    background: speed === preset.value ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${speed === preset.value ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)'}`,
                    color: speed === preset.value ? '#22C55E' : '#94A3B8',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </DataCard>
      </div>

      {/* Mission Details + Waypoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataCard title="MISSION DETAILS" icon={<ClipboardList size={16} style={{ color: '#94A3B8' }} />}>
          <div className="mt-2 space-y-4">
            <div>
              <p className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>Reconnaissance Patrol Alpha</p>
              <StatusBadge variant="info">RECON</StatusBadge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Progress</p>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: '42.8%', background: '#22C55E' }} />
              </div>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>3 of 7 waypoints completed</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Duration', value: '00:23:14' },
                { label: 'Distance', value: '1.24 km' },
                { label: 'Est. Remaining', value: '00:18:30' },
                { label: 'Dist. Remaining', value: '0.96 km' },
              ].map((s) => (
                <div key={s.label} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>{s.label}</p>
                  <p className="font-mono text-sm" style={{ color: '#E5E7EB' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </DataCard>

        <DataCard title="WAYPOINTS" icon={<MapPinned size={16} style={{ color: '#94A3B8' }} />}>
          <div className="mt-2 max-h-[300px] overflow-y-auto space-y-1">
            {waypoints.map((wp) => (
              <div
                key={wp.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg transition-colors hover:bg-white/[0.02]"
                style={{
                  background: wp.current ? 'rgba(59,130,246,0.04)' : undefined,
                }}
              >
                {/* Number circle */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                  style={{
                    borderColor: wp.completed ? '#22C55E' : wp.current ? '#3B82F6' : 'rgba(255,255,255,0.12)',
                    color: wp.completed ? '#22C55E' : wp.current ? '#3B82F6' : '#64748B',
                  }}
                >
                  {wp.completed ? <CheckCircle2 size={14} /> : <span className="text-xs font-semibold">{wp.id}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs" style={{ color: '#E5E7EB' }}>
                    {wp.lat.toFixed(4)}N, {wp.lon.toFixed(4)}E
                  </p>
                  <p className="text-[10px] uppercase" style={{ color: '#94A3B8' }}>
                    {wp.action}{wp.actionValue ? ` ${wp.actionValue}s` : ''}
                  </p>
                </div>
                <span className="font-mono text-xs flex-shrink-0" style={{ color: '#64748B' }}>{wp.distance}m</span>
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      {/* UAV Controls Placeholder */}
      <DataCard title="UAV CONTROLS" icon={<Plane size={16} style={{ color: '#94A3B8' }} />}>
        <div className="relative mt-2 p-6" style={{ opacity: 0.3, pointerEvents: 'none' }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {['Altitude', 'Takeoff', 'Land', 'RTL', 'Gimbal Pitch', 'Gimbal Roll', 'LOITER', 'GUIDED'].map((label) => (
              <div key={label} className="p-3 rounded-lg text-center text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748B' }}>
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
            COMING SOON
          </span>
        </div>
      </DataCard>
    </div>
  );
}

function movementText(m: string): string {
  switch (m) {
    case 'STOP': return 'STOPPED';
    case 'FORWARD': return 'FORWARD';
    case 'BACKWARD': return 'BACKWARD';
    case 'LEFT': return 'LEFT';
    case 'RIGHT': return 'RIGHT';
    default: return m;
  }
}

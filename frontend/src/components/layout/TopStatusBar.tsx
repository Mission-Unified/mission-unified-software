import { useState, useEffect } from 'react';
import { Battery, Wifi, Thermometer, Droplets, Navigation } from 'lucide-react';
import { useTelemetryStore } from '@/store/telemetryStore';

export default function TopStatusBar() {
  const connected = useTelemetryStore((s) => s.connected);
  const battery = useTelemetryStore((s) => s.batteryPercent);
  const rssi = useTelemetryStore((s) => s.rssi);
  const temperature = useTelemetryStore((s) => s.temperature);
  const humidity = useTelemetryStore((s) => s.humidity);
  const mode = useTelemetryStore((s) => s.mode);
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-GB", {
        hour12: false,
        timeZone: "Africa/Lagos",
      });
      setTime(`${time} GMT+1`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const batteryColor = battery > 50 ? '#22C55E' : battery > 20 ? '#F59E0B' : '#EF4444';

  return (
    <header
      className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-5 z-50"
      style={{
        background: '#0B1220',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left: System name + connection */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="TCS-7 Logo"
            className="w-7 h-7 object-contain"
          />

          <div className="flex flex-col leading-none">
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: "#E5E7EB" }}
            >
              In<span
              className="text-sm font-bold tracking-wide"
              style={{ color: "#c0ff2e" }}
            >geni</span>atores
            </span>

            <span
              className="text-[10px]"
              style={{ color: "#94A3B8" }}
            >
              UAV-UGV Mission Dashboard
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${connected ? 'animate-pulse-glow' : ''}`}
            style={{ background: connected ? '#22C55E' : '#EF4444' }}
          />
          <span
            className="text-[10px] font-bold tracking-[0.05em] uppercase"
            style={{ color: connected ? '#22C55E' : '#EF4444' }}
          >
            {connected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Center: Telemetry strip */}
      <div className="hidden lg:flex items-center gap-5">
        <TelemetryItem
          icon={<Battery size={14} style={{ color: batteryColor }} />}
          value={`${Math.round(battery)}%`}
          color={batteryColor}
        />
        <Divider />
        <TelemetryItem
          icon={<Wifi size={14} style={{ color: '#22C55E' }} />}
          value={`RSSI ${Math.round(rssi)}dBm`}
        />
        <Divider />
        <TelemetryItem
          icon={<Thermometer size={14} style={{ color: '#F59E0B' }} />}
          value={`${Math.round(temperature)}C`}
        />
        <Divider />
        <TelemetryItem
          icon={<Droplets size={14} style={{ color: '#3B82F6' }} />}
          value={`${Math.round(humidity)}%`}
        />
        <Divider />
        <TelemetryItem
          icon={<Navigation size={14} style={{ color: mode === 'UAV' ? '#3B82F6' : '#22C55E' }} />}
          value={mode}
          color={mode === 'UAV' ? '#3B82F6' : '#22C55E'}
        />
      </div>

      {/* Right: Time + operator */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs" style={{ color: '#94A3B8' }}>
          {time}
        </span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
        >
          OP
        </div>
      </div>
    </header>
  );
}

function TelemetryItem({
  icon,
  value,
  color = '#E5E7EB',
}: {
  icon: React.ReactNode;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="font-mono text-xs" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <span style={{ color: 'rgba(255,255,255,0.12)' }}>|</span>;
}

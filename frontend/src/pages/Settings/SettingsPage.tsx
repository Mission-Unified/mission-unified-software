import { useState } from 'react';
import {
  Wifi, Monitor, UserCog, Bell, Database, Stethoscope, Info,
  Check, RotateCcw, ExternalLink, Bug, FileText,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useTelemetryStore } from '@/store/telemetryStore';
import { ACCENT_COLORS } from '@/types/telemetry';
import StatusBadge from '@/components/common/StatusBadge';
import { showToast } from '@/hooks/useToast';

const categories = [
  { id: 'connection', icon: Wifi, label: 'Connection' },
  { id: 'display', icon: Monitor, label: 'Display' },
  { id: 'operator', icon: UserCog, label: 'Operator' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'data', icon: Database, label: 'Data' },
  { id: 'diagnostics', icon: Stethoscope, label: 'Diagnostics' },
  { id: 'about', icon: Info, label: 'About' },
];

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('connection');
  const ui = useUIStore();
  const connected = useTelemetryStore((s) => s.connected);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: '#E5E7EB' }}>
            SETTINGS
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            System configuration and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { showToast('Settings reset to defaults', undefined, 'info'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'transparent', color: '#64748B' }}
          >
            <RotateCcw size={14} />
            RESET DEFAULTS
          </button>
          <button
            onClick={() => showToast('Settings saved', undefined, 'success')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: '#22C55E', color: '#0B1220' }}
          >
            SAVE CHANGES
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Settings Navigation */}
        <div className="glass-card p-2 space-y-0.5 h-fit">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all text-left"
              style={{
                background: activeCategory === cat.id ? 'rgba(34,197,94,0.08)' : 'transparent',
                color: activeCategory === cat.id ? '#22C55E' : '#94A3B8',
                fontWeight: activeCategory === cat.id ? 500 : 400,
              }}
            >
              <cat.icon size={18} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="glass-card p-6">
          {activeCategory === 'connection' && <ConnectionPanel connected={connected} />}
          {activeCategory === 'display' && <DisplayPanel ui={ui} />}
          {activeCategory === 'operator' && <OperatorPanel ui={ui} />}
          {activeCategory === 'notifications' && <NotificationsPanel ui={ui} />}
          {activeCategory === 'data' && <DataPanel />}
          {activeCategory === 'diagnostics' && <DiagnosticsPanel connected={connected} />}
          {activeCategory === 'about' && <AboutPanel />}
        </div>
      </div>
    </div>
  );
}

/* ==================== Connection Panel ==================== */
function ConnectionPanel({ connected }: { connected: boolean }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>Backend Connection</h2>
      <div className="space-y-4">
        <SettingInput
          label="Telemetry Endpoint"
          defaultValue="ws://localhost:8000/ws/telemetry"
          status={connected ? 'Connected' : 'Disconnected'}
          statusColor={connected ? '#22C55E' : '#EF4444'}
        />
        <SettingInput
          label="Vision Endpoint"
          defaultValue="ws://localhost:8000/ws/vision"
          status={connected ? 'Connected' : 'Disconnected'}
          statusColor={connected ? '#22C55E' : '#EF4444'}
        />
        <SettingInput
          label="Command Endpoint"
          defaultValue="http://localhost:8000/command"
          status="Ready"
          statusColor="#22C55E"
        />
        <ToggleSetting label="Auto-reconnect on disconnect" defaultChecked />
        <NumberSetting label="Connection timeout" defaultValue={30} unit="seconds" />
      </div>

      <div className="border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: '#E5E7EB' }}>Connection Status</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'Telemetry WS', status: connected ? 'Connected' : 'Disconnected', color: connected ? '#22C55E' : '#EF4444', latency: '12ms' },
            { name: 'Vision WS', status: connected ? 'Connected' : 'Disconnected', color: connected ? '#22C55E' : '#EF4444', latency: '8ms' },
            { name: 'Command API', status: 'Ready', color: '#22C55E', latency: '45ms' },
          ].map((c) => (
            <div key={c.name} className="p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{c.name}</p>
              <p className="text-xs font-medium mt-1" style={{ color: c.color }}>{c.status}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>{c.latency}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== Display Panel ==================== */
function DisplayPanel({ ui }: { ui: ReturnType<typeof useUIStore.getState> }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>Display Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Theme</label>
          <div className="flex gap-3">
            {['Dark', 'Darker', 'Auto'].map((theme) => (
              <button
                key={theme}
                className="flex-1 p-3 rounded-lg text-center text-sm transition-all"
                style={{
                  background: theme === 'Dark' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${theme === 'Dark' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: theme === 'Dark' ? '#22C55E' : '#94A3B8',
                }}
              >
                <div className="w-8 h-8 rounded-full mx-auto mb-1" style={{
                  background: theme === 'Dark' ? '#0B1220' : theme === 'Darker' ? '#000000' : '#1a2332',
                }} />
                {theme}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Information Density</label>
          <div className="flex rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['compact', 'default', 'comfortable'] as const).map((d) => (
              <button
                key={d}
                onClick={() => ui.setDensity(d)}
                className="flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
                style={{
                  background: ui.density === d ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: ui.density === d ? '#E5E7EB' : '#94A3B8',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Accent Color</label>
          <div className="flex gap-2 flex-wrap">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => ui.setAccentColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{
                  background: c,
                  border: `2px solid ${ui.accentColor === c ? '#E5E7EB' : 'transparent'}`,
                }}
              >
                {ui.accentColor === c && <Check size={14} color="#fff" />}
              </button>
            ))}
          </div>
        </div>

        <ToggleSetting label="Enable animations" checked={ui.animations} onChange={ui.setAnimations} />

        <SliderSetting label="Card glass effect intensity" value={ui.glassmorphism} onChange={ui.setGlassmorphism} unit="%" />
      </div>
    </div>
  );
}

/* ==================== Operator Panel ==================== */
function OperatorPanel({ ui }: { ui: ReturnType<typeof useUIStore.getState> }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>Operator Settings</h2>
      <div className="space-y-4">
        <TextSetting label="Operator callsign" value={ui.operatorCallsign} onChange={ui.setOperatorCallsign} />
        <TextSetting label="Display name" defaultValue="Operator" />
        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Role</label>
          <select className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}>
            <option>Pilot</option>
            <option>Commander</option>
            <option>Observer</option>
            <option>Maintenance</option>
          </select>
        </div>
        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Measurement Units</label>
          <div className="flex rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['metric', 'imperial'] as const).map((u) => (
              <button
                key={u}
                onClick={() => ui.setUnits(u)}
                className="flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
                style={{
                  background: ui.units === u ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: ui.units === u ? '#E5E7EB' : '#94A3B8',
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Time Display</label>
          <div className="flex rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['utc', 'local'] as const).map((t) => (
              <button
                key={t}
                onClick={() => ui.setTimeFormat(t)}
                className="flex-1 py-1.5 rounded-md text-xs font-medium uppercase transition-all"
                style={{
                  background: ui.timeFormat === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: ui.timeFormat === t ? '#E5E7EB' : '#94A3B8',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: '#E5E7EB' }}>Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {[
              { key: '1-7', action: 'Switch modules' },
              { key: 'W/A/S/D', action: 'Movement (Mission)' },
              { key: 'Space', action: 'Emergency stop' },
              { key: 'M', action: 'Toggle MANUAL/AUTO' },
              { key: 'R', action: 'Toggle recording (Vision)' },
              { key: 'Ctrl+K', action: 'Search logs' },
              { key: 'Esc', action: 'Close modal/dialog' },
            ].map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-1.5">
                <kbd className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(255,255,255,0.06)', color: '#E5E7EB' }}>
                  {shortcut.key}
                </kbd>
                <span className="text-sm" style={{ color: '#94A3B8' }}>{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== Notifications Panel ==================== */
function NotificationsPanel({ ui }: { ui: ReturnType<typeof useUIStore.getState> }) {
  const items = [
    { key: 'critical' as const, icon: 'AlertTriangle', label: 'Critical alerts', desc: 'Emergency stop, collision, signal loss' },
    { key: 'warning' as const, icon: 'AlertOctagon', label: 'Warning alerts', desc: 'Low battery, weak signal, high temperature' },
    { key: 'info' as const, icon: 'Info', label: 'Info alerts', desc: 'Mode changes, waypoint reached' },
    { key: 'success' as const, icon: 'Check', label: 'Success alerts', desc: 'Commands acknowledged, uploads complete' },
    { key: 'telemetry' as const, icon: 'Activity', label: 'Telemetry alerts', desc: 'Real-time parameter threshold breaches' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>Notification Settings</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium" style={{ color: '#E5E7EB' }}>{item.label}</p>
              <p className="text-xs" style={{ color: '#64748B' }}>{item.desc}</p>
            </div>
            <ToggleSwitch
              checked={ui.notifications[item.key]}
              onChange={(v) => ui.setNotification(item.key, v)}
            />
          </div>
        ))}
      </div>
      <div className="border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Notification Position</label>
        <div className="flex rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const).map((p) => (
            <button
              key={p}
              onClick={() => ui.setToastPosition(p)}
              className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: ui.toastPosition === p ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: ui.toastPosition === p ? '#E5E7EB' : '#94A3B8',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== Data Panel ==================== */
function DataPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>Data Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Telemetry History Retention</label>
          <select className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}>
            <option>1 hour</option>
            <option>6 hours</option>
            <option selected>24 hours</option>
            <option>7 days</option>
            <option>30 days</option>
          </select>
        </div>
        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Default Export Format</label>
          <div className="flex rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {['CSV', 'JSON', 'PDF'].map((f) => (
              <button
                key={f}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ background: f === 'CSV' ? 'rgba(255,255,255,0.08)' : 'transparent', color: f === 'CSV' ? '#E5E7EB' : '#94A3B8' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <ToggleSetting label="Auto-export logs on session end" />
        <div>
          <label className="text-sm block mb-2" style={{ color: '#94A3B8' }}>Telemetry Update Display Rate</label>
          <select className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}>
            <option>Every message</option>
            <option>10 Hz</option>
            <option>5 Hz</option>
            <option selected>1 Hz</option>
            <option>0.5 Hz</option>
          </select>
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>UI update throttle - backend rate unaffected</p>
        </div>
        <div className="border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => showToast('All data cleared', undefined, 'warning')}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:brightness-110"
            style={{ background: '#EF4444', color: '#FFFFFF' }}
          >
            CLEAR ALL DATA
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== Diagnostics Panel ==================== */
function DiagnosticsPanel({ connected }: { connected: boolean }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>System Diagnostics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'CPU Usage', value: '23%', color: '#22C55E' },
          { label: 'Memory', value: '342 MB / 2 GB', color: '#22C55E' },
          { label: 'Uptime', value: '02:14:33', color: '#22C55E' },
          { label: 'Browser', value: 'Chrome 125', color: '#3B82F6' },
          { label: 'Resolution', value: `${window.innerWidth}x${window.innerHeight}`, color: '#3B82F6' },
          { label: 'Backend', value: 'localhost:8000', color: connected ? '#22C55E' : '#EF4444' },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs" style={{ color: '#94A3B8' }}>{item.label}</p>
            <p className="font-mono text-sm font-medium mt-1" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: '#E5E7EB' }}>Latency History</h3>
        <div className="h-[100px] rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <LatencySparkline />
        </div>
        <div className="flex items-center gap-6 mt-2">
          <span className="font-mono text-base" style={{ color: '#22C55E' }}>12ms avg</span>
          <span className="text-xs" style={{ color: '#64748B' }}>Min: 8ms · Max: 45ms</span>
        </div>
      </div>

      <div className="border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: '#E5E7EB' }}>WebSocket Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Endpoint', 'Status', 'Messages', 'Last Message', 'Reconnects'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Telemetry WS', status: connected ? 'Connected' : 'Disconnected', msgs: '14,832', last: '14:32:01', recon: '0' },
                { name: 'Vision WS', status: connected ? 'Connected' : 'Disconnected', msgs: '44,496', last: '14:32:01', recon: '0' },
                { name: 'Command API', status: 'Ready', msgs: '86 sent', last: '14:32:01', recon: 'N/A' },
              ].map((row) => (
                <tr key={row.name} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-3 py-2 text-sm" style={{ color: '#E5E7EB' }}>{row.name}</td>
                  <td className="px-3 py-2">
                    <StatusBadge variant={row.status === 'Connected' ? 'online' : row.status === 'Ready' ? 'info' : 'offline'}>
                      {row.status}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: '#94A3B8' }}>{row.msgs}</td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: '#64748B' }}>{row.last}</td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: '#64748B' }}>{row.recon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}>
          RECONNECT ALL
        </button>
        <button className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}>
          FLUSH CACHE
        </button>
        <button className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
          RELOAD APPLICATION
        </button>
      </div>
    </div>
  );
}

/* ==================== About Panel ==================== */
function AboutPanel() {
  return (
    <div className="text-center py-10">
      <h2 className="text-4xl font-bold tracking-[0.05em]" style={{ color: '#E5E7EB' }}>Ingeniatores</h2>
      <p className="text-base mt-1" style={{ color: '#94A3B8' }}>UAV-UGV Mision Dashboard v1</p>
      <StatusBadge variant="info">v1.0.0</StatusBadge>
      <p className="font-mono text-xs mt-3" style={{ color: '#64748B' }}>Build 2026.05.31-1432</p>
      <p className="text-sm mt-4 max-w-[400px] mx-auto" style={{ color: '#94A3B8' }}>
        Advanced UAV-UGV command and control interface for unmanned systems operations.
      </p>
      <div className="flex items-center justify-center gap-4 mt-6">
        {[
          { icon: ExternalLink, label: 'Documentation' },
          { icon: Bug, label: 'Report Issue' },
          { icon: FileText, label: 'License' },
        ].map((link) => (
          <button
            key={link.label}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
            style={{ color: '#94A3B8' }}
          >
            <link.icon size={14} />
            {link.label}
          </button>
        ))}
      </div>
      <p className="text-xs mt-6" style={{ color: '#64748B' }}>Built with React, TypeScript, Three.js, Recharts</p>
      <p className="text-xs mt-1" style={{ color: '#64748B' }}>&copy; 2026 Tactical Systems Division</p>
    </div>
  );
}

/* ==================== Reusable Setting Components ==================== */

function SettingInput({ label, defaultValue, status, statusColor }: { label: string; defaultValue: string; status: string; statusColor: string }) {
  return (
    <div>
      <label className="text-sm block mb-1.5" style={{ color: '#94A3B8' }}>{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="text"
          defaultValue={defaultValue}
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:border-[#22C55E] transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
        />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
          <span className="text-xs" style={{ color: statusColor }}>{status}</span>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}>
          TEST
        </button>
      </div>
    </div>
  );
}

function ToggleSetting({ label, checked, onChange, defaultChecked }: { label: string; checked?: boolean; onChange?: (v: boolean) => void; defaultChecked?: boolean }) {
  const isChecked = checked ?? defaultChecked ?? false;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: '#94A3B8' }}>{label}</span>
      <ToggleSwitch checked={isChecked} onChange={onChange || (() => {})} />
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-10 h-5 rounded-full relative transition-colors duration-200"
      style={{ background: checked ? '#22C55E' : 'rgba(255,255,255,0.1)' }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

function TextSetting({ label, value, onChange, defaultValue }: { label: string; value?: string; onChange?: (v: string) => void; defaultValue?: string }) {
  return (
    <div>
      <label className="text-sm block mb-1.5" style={{ color: '#94A3B8' }}>{label}</label>
      <input
        type="text"
        value={value ?? defaultValue ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:border-[#22C55E] transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
      />
    </div>
  );
}

function NumberSetting({ label, defaultValue, unit }: { label: string; defaultValue: number; unit?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: '#94A3B8' }}>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          defaultValue={defaultValue}
          className="w-20 px-3 py-2 rounded-lg text-sm outline-none text-right"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
        />
        {unit && <span className="text-xs" style={{ color: '#64748B' }}>{unit}</span>}
      </div>
    </div>
  );
}

function SliderSetting({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm" style={{ color: '#94A3B8' }}>{label}</span>
        <span className="font-mono text-sm" style={{ color: '#E5E7EB' }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #22C55E ${value}%, rgba(255,255,255,0.06) ${value}%)`,
        }}
      />
    </div>
  );
}

function LatencySparkline() {
  const points = [12, 15, 10, 8, 14, 20, 18, 12, 9, 11, 13, 16, 12, 10, 8, 12, 15, 11, 9, 10, 12, 14, 12, 10, 8, 11, 13, 12, 10, 9];
  const w = 400;
  const h = 60;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const path = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / range) * (h - 10) - 5}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${path} ${w},${h}`} fill="url(#latencyGrad)" />
      <polyline points={path} fill="none" stroke="#22C55E" strokeWidth={2} />
    </svg>
  );
}

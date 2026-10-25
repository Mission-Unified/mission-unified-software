import { useState, useMemo } from 'react';
import {
  Search, Download, ChevronLeft, ChevronRight,
  AlertTriangle, AlertOctagon, Info,
} from 'lucide-react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useCommandStore } from '@/store/commandStore';
import { useVisionStore } from '@/store/visionStore';
import { DETECTION_COLORS, DETECTION_LABELS } from '@/types/telemetry';
import DataCard from '@/components/common/DataCard';
import StatusBadge from '@/components/common/StatusBadge';
import { showToast } from '@/hooks/useToast';

type LogTab = 'telemetry' | 'commands' | 'detections';
type Severity = 'info' | 'warning' | 'error' | 'critical';

const severityIcons: Record<Severity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertOctagon,
  critical: AlertOctagon,
};

const severityColors: Record<Severity, string> = {
  info: '#3B82F6',
  warning: '#F59E0B',
  error: '#EF4444',
  critical: '#EF4444',
};

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<LogTab>('telemetry');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const commandHistory = useCommandStore((s) => s.commandHistory);
  const commandLogs = useMemo(
    () =>
      commandHistory.map((cmd) => ({
        id: cmd.id,
        time: new Date(
          cmd.timestamp
        ).toLocaleTimeString(),

        severity:
          cmd.status === 'failed'
            ? 'error'
            : cmd.status === 'pending'
            ? 'warning'
            : 'info',

        command: cmd.command,

        description:
          cmd.status === 'failed'
            ? cmd.error || 'Command Failed'
            : 'Command Executed',

        by: 'Operator',

        status:
          cmd.status === 'success'
            ? 'Ack'
            : cmd.status === 'failed'
            ? 'Failed'
            : 'Pending',

        rt: cmd.responseTime
          ? `${cmd.responseTime}ms`
          : '',
      })),
    [commandHistory]
  );

  const telemetryHistory = useTelemetryStore((s) => s.history);
  const detections = useVisionStore((s) => s.detections);

  const mode = useTelemetryStore((s) => s.mode);

  const telemetryLogs = useMemo(() => {
    const entries: Array<Record<string, string | number>> = [];
    const keys = ['batteryPercent', 'batteryVoltage', 'rssi', 'temperature', 'humidity'] as const;
    const len = telemetryHistory.batteryPercent.length;
    for (let i = Math.max(0, len - 20); i < len; i++) {
      keys.forEach((k) => {
        const val = telemetryHistory[k][i];
        const prev = i > 0 ? telemetryHistory[k][i - 1] : val;
        const delta = val - prev;
        entries.push({
          id: `${k}-${i}`,
          time: new Date(telemetryHistory.timestamps[i] || Date.now()).toLocaleTimeString(),
          severity: Math.abs(delta) > 3 ? 'warning' : 'info',
          parameter: k.charAt(0).toUpperCase() + k.slice(1),
          value: typeof val === 'number' ? `${k === 'batteryPercent' || k === 'humidity' ? Math.round(val) + '%' : k === 'rssi' ? Math.round(val) + 'dBm' : k === 'temperature' ? Math.round(val) + 'C' : val.toFixed(1) + 'V'}` : String(val),
          previous: typeof prev === 'number' ? `${k === 'batteryPercent' || k === 'humidity' ? Math.round(prev) + '%' : k === 'rssi' ? Math.round(prev) + 'dBm' : k === 'temperature' ? Math.round(prev) + 'C' : prev.toFixed(1) + 'V'}` : String(prev),
          delta: delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
          source: mode || 'Unknown',
        });
      });
    }
    return entries;
  }, [telemetryHistory]);

  const tabs: {
    key: LogTab;
    label: string;
    count: number;
  }[] = [
    {
      key: 'telemetry',
      label: 'TELEMETRY',
      count: telemetryLogs.length,
    },
    {
      key: 'commands',
      label: 'COMMANDS',
      count: commandLogs.length,
    },
    {
      key: 'detections',
      label: 'DETECTIONS',
      count: detections.length,
    },
  ];

  const filteredLogs = useMemo(() => {
    let data: Array<Record<string, string | number>> = [];
    if (activeTab === 'telemetry') data = telemetryLogs;
    else if (activeTab === 'commands') data = commandLogs;
    else {
      data = detections.slice(0, 100).map((d) => ({
        id: d.id,
        time: new Date(d.timestamp).toLocaleTimeString(),

        severity: 'info' as Severity,

        class: d.class,
        confidence: `${Math.round(d.confidence * 100)}%`,
        trackId: d.trackId,

        location:
          typeof d.latitude === 'number' &&
          typeof d.longitude === 'number'
            ? `${d.latitude.toFixed(6)}, ${d.longitude.toFixed(6)}`
            : 'N/A',

        latitude:
          typeof d.latitude === 'number'
            ? d.latitude.toFixed(6)
            : 'N/A',

        longitude:
          typeof d.longitude === 'number'
            ? d.longitude.toFixed(6)
            : 'N/A',

        groundDistance:
          typeof d.groundDistance_m === 'number'
            ? `${d.groundDistance_m.toFixed(1)} m`
            : 'N/A',

        bearing:
          typeof d.bearing_deg === 'number'
            ? `${d.bearing_deg.toFixed(1)}°`
            : 'N/A',

        localizationError:
          typeof d.localizationError_m === 'number'
            ? `${d.localizationError_m.toFixed(1)} m`
            : 'N/A',

        bbox: `[${d.bbox.join(', ')}]`,
      }));
    }

    if (severityFilter !== 'all') {
      data = data.filter((d) => d.severity === severityFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((d) => Object.values(d).some((v) => String(v).toLowerCase().includes(s)));
    }
    return data;
  }, [activeTab, severityFilter, search, telemetryLogs, detections]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / perPage));
  const paginated = filteredLogs.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: '#E5E7EB' }}>
            SYSTEM LOGS
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Telemetry, command, and detection history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 rounded-lg text-sm w-64 outline-none transition-colors focus:border-[#22C55E]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
            />
          </div>
          <button
            onClick={() => showToast('Logs exported', undefined, 'success')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
          >
            <Download size={14} />
            EXPORT
          </button>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex items-center justify-between">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2"
              style={{
                color: activeTab === tab.key ? '#22C55E' : '#94A3B8',
                borderColor: activeTab === tab.key ? '#22C55E' : 'transparent',
              }}
            >
              {tab.label}
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: activeTab === tab.key ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                  color: activeTab === tab.key ? '#22C55E' : '#64748B',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
            className="px-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
          <select
            className="px-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
          >
            <option>Last hour</option>
            <option>Last 6 hours</option>
            <option>Today</option>
            <option>Last 7 days</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <DataCard noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {getColumns(activeTab).map((col) => (
                  <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#94A3B8' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <Search size={24} className="mx-auto mb-2" style={{ color: '#64748B' }} />
                    <p className="text-sm" style={{ color: '#64748B' }}>No matching logs found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <LogRow
                    key={String(row.id || i)}
                    row={row}
                    tab={activeTab}
                    isExpanded={expandedRow === String(row.id || i)}
                    onToggle={() => setExpandedRow(expandedRow === String(row.id || i) ? null : String(row.id || i))}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-xs" style={{ color: '#64748B' }}>
            Showing {Math.min(filteredLogs.length, (page - 1) * perPage + 1)}-{Math.min(filteredLogs.length, page * perPage)} of {filteredLogs.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-md disabled:opacity-30" style={{ color: '#94A3B8' }}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: page === p ? 'rgba(34,197,94,0.12)' : 'transparent',
                  color: page === p ? '#22C55E' : '#94A3B8',
                }}
              >
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-md disabled:opacity-30" style={{ color: '#94A3B8' }}>
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="text-xs" style={{ color: '#64748B' }}>50 per page</span>
        </div>
      </DataCard>
    </div>
  );
}

function getColumns(tab: LogTab): string[] {
  switch (tab) {
    case 'telemetry': return ['Time', 'Severity', 'Parameter', 'Value', 'Previous', 'Delta', 'Source'];
    case 'commands': return ['Time', 'Severity', 'Command', 'Description', 'Issued By', 'Status', 'Response'];
    case 'detections': return ['Time', 'Severity', 'Class', 'Confidence', 'Track ID', 'Location', 'Ground Distance', 'Bearing', 'Localization Error', 'Bounding Box',];
  }
}

function LogRow({ row, tab, isExpanded, onToggle }: {
  row: Record<string, string | number>;
  tab: LogTab;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const sev = (row.severity as Severity) || 'info';
  const borderColor = severityColors[sev];

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b cursor-pointer transition-colors hover:bg-white/[0.02]"
        style={{ borderColor: 'rgba(255,255,255,0.04)', borderLeft: `4px solid ${borderColor}` }}
      >
        {tab === 'telemetry' && (
          <>
            <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: '#E5E7EB' }}>{String(row.time)}</td>
            <td className="px-4 py-2.5"><SeverityBadge severity={sev} /></td>
            <td className="px-4 py-2.5 text-sm font-medium" style={{ color: '#E5E7EB' }}>{String(row.parameter)}</td>
            <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#E5E7EB' }}>{String(row.value)}</td>
            <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#64748B' }}>{String(row.previous)}</td>
            <td className="px-4 py-2.5">
              <span className="text-xs font-mono" style={{ color: String(row.delta).startsWith('+') ? '#22C55E' : String(row.delta).startsWith('-') ? '#EF4444' : '#64748B' }}>
                {String(row.delta)}
              </span>
            </td>
            <td className="px-4 py-2.5"><StatusBadge variant="online">{String(row.source)}</StatusBadge></td>
          </>
        )}
        {tab === 'commands' && (
          <>
            <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: '#E5E7EB' }}>{String(row.time)}</td>
            <td className="px-4 py-2.5"><SeverityBadge severity={sev} /></td>
            <td className="px-4 py-2.5 font-mono text-sm font-medium" style={{ color: '#E5E7EB' }}>{String(row.command)}</td>
            <td className="px-4 py-2.5 text-sm" style={{ color: '#E5E7EB' }}>{String(row.description)}</td>
            <td className="px-4 py-2.5 text-sm" style={{ color: '#94A3B8' }}>{String(row.by)}</td>
            <td className="px-4 py-2.5">
              <StatusBadge variant={row.status === 'Ack' ? 'online' : 'warning'}>{String(row.status)}</StatusBadge>
            </td>
            <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#64748B' }}>{String(row.rt) || '—'}</td>
          </>
        )}
        {tab === 'detections' && (
          <>
            <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: '#E5E7EB' }}>{String(row.time)}</td>
            <td className="px-4 py-2.5"><SeverityBadge severity="info" /></td>
            <td className="px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full" style={{ background: DETECTION_COLORS[row.class as keyof typeof DETECTION_COLORS] || '#94A3B8' }} />
                {DETECTION_LABELS[row.class as keyof typeof DETECTION_LABELS] || String(row.class)}
              </span>
            </td>
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: String(row.confidence), background: DETECTION_COLORS[row.class as keyof typeof DETECTION_COLORS] || '#94A3B8' }} />
                </div>
                <span className="font-mono text-xs">{String(row.confidence)}</span>
              </div>
            </td>
            <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#64748B' }}>#{String(row.trackId)}</td>
            <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#64748B' }}>{String(row.location)}</td>
            <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#64748B' }}>{String(row.bbox)}</td>
            <td className="px-4 py-2.5 font-mono text-xs">
              {String(row.groundDistance)}
            </td>

            <td className="px-4 py-2.5 font-mono text-xs">
              {String(row.bearing)}
            </td>

            <td className="px-4 py-2.5 font-mono text-xs">
              {String(row.localizationError)}
            </td>
          </>
        )}
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={10} className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid #22C55E' }}>
            <pre className="font-mono text-xs overflow-x-auto" style={{ color: '#94A3B8' }}>
              {JSON.stringify(row, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const Icon = severityIcons[severity];
  return (
    <span className="flex items-center gap-1 text-xs">
      <Icon size={12} style={{ color: severityColors[severity] }} />
      <span style={{ color: severityColors[severity] }} className="capitalize">{severity}</span>
    </span>
  );
}

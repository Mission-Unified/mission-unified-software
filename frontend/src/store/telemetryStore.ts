import { create } from 'zustand';
import type { TelemetryData, TelemetryAlert, HealthItem } from '@/types/telemetry';

interface TelemetryHistory {
  timestamps: string[];
  batteryPercent: number[];
  batteryVoltage: number[];

  temperature: number[];
  humidity: number[];

  rssi: number[];
  snr: number[];

  leftEncoder: number[];
  rightEncoder: number[];

  distanceFront: number[];
  distanceLeft: number[];
  distanceRight: number[];
}

interface TelemetryState extends TelemetryData {
  connected: boolean;
  history: TelemetryHistory;
  alerts: TelemetryAlert[];
  health: HealthItem[];
  updateTelemetry: (data: Partial<TelemetryData>) => void;
  setConnected: (connected: boolean) => void;
  dismissAlert: (id: string) => void;
  addAlert: (alert: TelemetryAlert) => void;
}

const defaultTelemetry: TelemetryData = {
  latitude: 0,
  longitude: 0,

  gpsAltitude: 0,
  barometerAltitude: 0,

  speed: 0,
  satellites: 0,
  hdop: 0,

  pitch: 0,
  roll: 0,
  yaw: 0,

  pressure: 0,

  distanceFront: 0,
  distanceLeft: 0,
  distanceRight: 0,

  temperature: 0,
  humidity: 0,

  irLeft: 0,
  irRight: 0,

  batteryVoltage: 0,
  batteryPercent: 0,

  mode: 'UGV',
  ugvMode: 'MANUAL',

  movement: 'STOP',

  alert: false,

  command: '',

  leftEncoder: 0,
  rightEncoder: 0,

  rssi: 0,
  snr: 0,

  timestamp: '',
};


export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  ...defaultTelemetry,
  connected: false,
  history: {
    timestamps: [],
    batteryPercent: [],
    batteryVoltage: [],

    temperature: [],
    humidity: [],

    rssi: [],
    snr: [],

    leftEncoder: [],
    rightEncoder: [],

    distanceFront: [],
    distanceLeft: [],
    distanceRight: [],
  },
  alerts: [],
  health: [],

  updateTelemetry: (data) => {
    const state = get();
    const newHistory = { ...state.history };

    if (data.batteryPercent !== undefined) newHistory.batteryPercent = [...state.history.batteryPercent, data.batteryPercent].slice(-50);
    if (data.batteryVoltage !== undefined) newHistory.batteryVoltage = [...state.history.batteryVoltage, data.batteryVoltage].slice(-50);
    if (data.temperature !== undefined) newHistory.temperature = [...state.history.temperature, data.temperature].slice(-50);
    if (data.humidity !== undefined) newHistory.humidity = [...state.history.humidity, data.humidity].slice(-50);
    if (data.rssi !== undefined) newHistory.rssi = [...state.history.rssi, data.rssi].slice(-50);
    if (data.snr !== undefined) newHistory.snr = [...state.history.snr, data.snr].slice(-50);
    if (data.leftEncoder !== undefined) newHistory.leftEncoder = [...state.history.leftEncoder, data.leftEncoder].slice(-50);
    if (data.rightEncoder !== undefined) newHistory.rightEncoder = [...state.history.rightEncoder, data.rightEncoder].slice(-50);
    if (data.distanceFront !== undefined)newHistory.distanceFront = [...state.history.distanceFront, data.distanceFront, ].slice(-50);
    if (data.distanceLeft !== undefined) newHistory.distanceLeft = [...state.history.distanceLeft, data.distanceLeft].slice(-50);
    if (data.distanceRight !== undefined) newHistory.distanceRight = [...state.history.distanceRight, data.distanceRight].slice(-50);
    if (data.timestamp !== undefined) newHistory.timestamps = [...state.history.timestamps, data.timestamp].slice(-50);

    // Auto-generate alerts
    const newAlerts = [...state.alerts];
    if (data.batteryPercent !== undefined && data.batteryPercent < 20 && !newAlerts.find(a => a.title === 'Critical Battery')) {
      newAlerts.unshift({
        id: `alert-${Date.now()}`,
        severity: 'critical',
        title: 'Critical Battery',
        detail: `Battery at ${data.batteryPercent}% - immediate action required`,
        timestamp: new Date().toISOString(),
        dismissed: false,
      });
    }
    if (data.rssi !== undefined && data.rssi < -80 && !newAlerts.find(a => a.title === 'Signal Lost')) {
      newAlerts.unshift({
        id: `alert-${Date.now() + 1}`,
        severity: 'error',
        title: 'Signal Lost',
        detail: `RSSI at ${data.rssi}dBm`,
        timestamp: new Date().toISOString(),
        dismissed: false,
      });
    }

    set({ ...data, history: newHistory, alerts: newAlerts });
  },

  setConnected: (connected) => set({ connected }),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50),
    })),
}));

export function useTelemetryValue<K extends keyof TelemetryData>(key: K): TelemetryData[K] {
  return useTelemetryStore((state) => state[key]);
}

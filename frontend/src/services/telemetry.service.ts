import { useTelemetryStore } from '@/store/telemetryStore';

const WS_URL = import.meta.env.VITE_TELEMETRY_WS || 'ws://localhost:8000/ws/telemetry';
const USE_MOCK = import.meta.env.VITE_MOCK_DATA === 'true';

class TelemetryService {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private mockTimer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  connect() {
    if (USE_MOCK) {
      this.startMock();
      return;
    }
    this.ws = new WebSocket(WS_URL);
    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectDelay = 1000;
      useTelemetryStore.getState().setConnected(true);
    };
    this.ws.onmessage = (event) => {
      console.log("WS RX:", event.data);
      try {
        const msg = JSON.parse(event.data);

        const t = msg.telemetry;

        if (!t) return;

        useTelemetryStore.getState().updateTelemetry({
          latitude: t.flightController?.latitude ?? 0,
          longitude: t.flightController?.longitude ?? 0,

          gpsAltitude: t.flightController?.gpsAltitude ?? 0,
          barometerAltitude: t.flightController?.barometerAltitude ?? 0,

          speed: t.flightController?.speed ?? 0,
          satellites: t.flightController?.satellites ?? 0,
          hdop: t.flightController?.hdop ?? 0,

          pitch: t.flightController?.pitch ?? 0,
          roll: t.flightController?.roll ?? 0,
          yaw: t.flightController?.yaw ?? 0,

          pressure: t.flightController?.pressure ?? 0,

          distanceFront: t.flightController?.distanceFront ?? 0,
          distanceLeft: t.flightController?.distanceLeft ?? 0,
          distanceRight: t.flightController?.distanceRight ?? 0,

          temperature: t.environment?.temperature ?? 0,
          humidity: t.environment?.humidity ?? 0,

          irLeft: t.environment?.irLeft ?? 0,
          irRight: t.environment?.irRight ?? 0,

          batteryVoltage: t.environment?.batteryVoltage ?? 0,
          batteryPercent: t.environment?.batteryPercent ?? 0,

          mode: t.status?.mode ?? 'UGV',
          ugvMode: t.status?.ugvMode ?? 'MANUAL',

          movement: t.status?.movement ?? 'STOP',

          alert: t.status?.alert ?? false,

          command: t.status?.command ?? '',

          leftEncoder: t.status?.leftEncoder ?? 0,
          rightEncoder: t.status?.rightEncoder ?? 0,

          rssi: t.link?.rssi ?? 0,
          snr: t.link?.snr ?? 0,

          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Telemetry parse error:', err);
      }
    };
    this.ws.onclose = () => {
      this.connected = false;
      useTelemetryStore.getState().setConnected(false);
      this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      this.connected = false;
      useTelemetryStore.getState().setConnected(false);
    };
  }

  disconnect() {
    if (this.mockTimer) {
      clearInterval(this.mockTimer);
      this.mockTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    useTelemetryStore.getState().setConnected(false);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  private startMock() {
    useTelemetryStore.getState().setConnected(true);

    this.mockTimer = setInterval(() => {
      const s = useTelemetryStore.getState();
      useTelemetryStore.getState().updateTelemetry({
        batteryPercent: Math.max(0, Math.min(100, s.batteryPercent + (Math.random() - 0.52) * 0.5)),
        batteryVoltage: Math.max(10, Math.min(14, s.batteryVoltage + (Math.random() - 0.5) * 0.05)),
        temperature: Math.max(20, Math.min(55, s.temperature + (Math.random() - 0.48) * 0.3)),
        humidity: Math.max(20, Math.min(80, s.humidity + (Math.random() - 0.5) * 0.5)),
        rssi: Math.max(-100, Math.min(-30, s.rssi + (Math.random() - 0.5) * 2)),
        snr: Math.max(5, Math.min(40, s.snr + (Math.random() - 0.5) * 1)),
        leftEncoder: s.leftEncoder + Math.floor(Math.random() * 20),
        rightEncoder: s.rightEncoder + Math.floor(Math.random() * 20),
        distanceFront: Math.max(10, Math.min(300, s.distanceFront + (Math.random() - 0.5) * 10)),
        distanceLeft: Math.max(10, Math.min(300, s.distanceLeft + (Math.random() - 0.5) * 8)),
        distanceRight: Math.max(10, Math.min(300, s.distanceRight + (Math.random() - 0.5) * 8)),
        irLeft: Math.random() > 0.95 ? (s.irLeft ? 0 : 1) : s.irLeft,
        irRight: Math.random() > 0.95 ? (s.irRight ? 0 : 1) : s.irRight,
        latitude: s.latitude + (Math.random() - 0.5) * 0.00001,
        longitude: s.longitude + (Math.random() - 0.5) * 0.00001,

        yaw: (s.yaw + 2) % 360,

        speed: Math.max(
          0,
          Math.min(
            20,
            s.speed + (Math.random() - 0.5)
          )
        ),

        satellites: Math.max(
          0,
          Math.min(
            20,
            s.satellites + Math.round((Math.random() - 0.5))
          )
        ),
        timestamp: new Date().toISOString(),
      });
    }, 1000);
  }

  isConnected() {
    return this.connected;
  }
}

export const telemetryService = new TelemetryService();

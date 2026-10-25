import { useEffect } from 'react';
import { telemetryService } from '@/services/telemetry.service';
import { useTelemetryStore } from '@/store/telemetryStore';

export function useTelemetry() {
  const connected = useTelemetryStore((s) => s.connected);

  useEffect(() => {
    telemetryService.connect();
    return () => telemetryService.disconnect();
  }, []);

  return { connected, reconnect: () => telemetryService.connect() };
}

export function useTelemetryValue<K extends keyof import('@/types/telemetry').TelemetryData>(key: K) {
  return useTelemetryStore((state) => state[key] as import('@/types/telemetry').TelemetryData[K]);
}

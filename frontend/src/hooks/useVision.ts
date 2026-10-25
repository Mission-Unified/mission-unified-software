import { useEffect } from 'react';
import { visionService } from '@/services/vision.service';
import { useVisionStore } from '@/store/visionStore';

export function useVision() {
  const connected = useVisionStore((s) => s.connected);

  useEffect(() => {
    visionService.connect();
    return () => visionService.disconnect();
  }, []);

  return { connected };
}

import { useVisionStore } from '@/store/visionStore';
import type { VisionDetection, DetectionClass } from '@/types/telemetry';

const WS_URL = import.meta.env.VITE_VISION_WS || 'ws://localhost:8000/ws/vision';
const USE_MOCK = import.meta.env.VITE_MOCK_DATA === 'true';

class VisionService {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private mockTimer: ReturnType<typeof setInterval> | null = null;
  private frameTimer: ReturnType<typeof setInterval> | null = null;
  private connected = false;

  connect() {
    if (USE_MOCK) {
      this.startMock();
      return;
    }
    this.ws = new WebSocket(WS_URL);
    this.ws.binaryType = 'blob';
    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectDelay = 1000;
      useVisionStore.getState().setConnected(true);
    };
    this.ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        const url = URL.createObjectURL(event.data);
        
        const prev = useVisionStore.getState().frameUrl;

        if (prev?.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }

        useVisionStore.getState().updateFrame(url);

        return;
      }

      try {
        const data = JSON.parse(event.data);

        console.log("VISION RX:", data);

        if (data.frame) {
          const imageUrl = `data:image/jpeg;base64,${data.frame}`;

          const prev = useVisionStore.getState().frameUrl;

          if (prev?.startsWith("blob:")) {
            URL.revokeObjectURL(prev);
          }

          useVisionStore.getState().updateFrame(imageUrl);
        }

        if (data.objects) {
          const detections: VisionDetection[] = data.objects.map(
            (obj: any) => ({
              id: obj.id,
              trackId: obj.trackId ?? obj.id,

              class: obj.class,
              confidence: obj.confidence ?? 0,

              bbox: obj.bbox ?? [],

              timestamp:
                obj.timestamp ??
                data.timestamp ??
                new Date().toISOString(),

              trackAge: obj.trackAge ?? 0,
              hits: obj.hits ?? 0,
              timeSinceUpdate: obj.timeSinceUpdate ?? 0,

              velocity: obj.velocity ?? 0,
              velocityPxPerSec:
                obj.velocityPxPerSec ?? 0,

              velocityUnit:
                obj.velocityUnit ?? 'm/s',

              direction:
                obj.direction ?? 'STATIONARY',

              reidConfidence:
                obj.reidConfidence ?? null,

              embeddingDistance:
                obj.embeddingDistance ?? null,

              latitude:
                obj.latitude ?? null,

              longitude:
                obj.longitude ?? null,

              groundDistance_m:
                obj.groundDistance_m ?? null,

              bearing_deg:
                obj.bearing_deg ?? null,

              localizationError_m:
                obj.localizationError_m ?? null,
            })
          );

          useVisionStore
            .getState()
            .addDetections(detections);

          if (data.trackingStats) {
            useVisionStore
              .getState()
              .setTrackingStats({
                activeTracks:
                  data.trackingStats.activeTracks ?? 0,

                lostTracks:
                  data.trackingStats.lostTracks ?? 0,

                reidEnabled:
                  data.trackingStats.reidEnabled ?? false,

                detectionInterval:
                  data.trackingStats.detectionInterval ?? 1,
              });
          }

          useVisionStore
            .getState()
            .setInferenceTime(
              data.inference_ms ?? 0
            );

          useVisionStore
            .getState()
            .setFps(
              data.fps ?? 0
            );
        }
      } catch (err) {
        console.error("Vision parse error:", err);
      }
    };
    this.ws.onclose = () => {
      this.connected = false;
      useVisionStore.getState().setConnected(false);
      this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      this.connected = false;
      useVisionStore.getState().setConnected(false);
    };
  }

  disconnect() {
    if (this.mockTimer) { clearInterval(this.mockTimer); this.mockTimer = null; }
    if (this.frameTimer) { clearInterval(this.frameTimer); this.frameTimer = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) { this.ws.close(); this.ws = null; }
    const prev = useVisionStore.getState().frameUrl;
    if (prev) URL.revokeObjectURL(prev);
    this.connected = false;
    useVisionStore.getState().setConnected(false);
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
    useVisionStore.getState().setConnected(true);
    // Generate a dark placeholder frame
    this.frameTimer = setInterval(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dark background with grid
        ctx.fillStyle = '#0a0f1a';
        ctx.fillRect(0, 0, 640, 360);
        ctx.strokeStyle = 'rgba(34,197,94,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 640; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 360); ctx.stroke(); }
        for (let y = 0; y < 360; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke(); }
        // Random noise
        for (let i = 0; i < 200; i++) {
          ctx.fillStyle = `rgba(34,197,94,${Math.random() * 0.05})`;
          ctx.fillRect(Math.random() * 640, Math.random() * 360, 2, 2);
        }
        // Simulated objects
        const colors: Record<string, string> = { person: '#3B82F6', car: '#F59E0B', bicycle: '#EC4899' };
        const mockObjs = [
          { x: 340, y: 200, w: 60, h: 140, label: 'person', conf: 0.94 },
          { x: 520, y: 180, w: 120, h: 100, label: 'car', conf: 0.87 },
        ];
        mockObjs.forEach((obj) => {
          ctx.strokeStyle = colors[obj.label] || '#22C55E';
          ctx.lineWidth = 2;
          ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
          // Corner brackets
          const cs = 8;
          ctx.beginPath(); ctx.moveTo(obj.x, obj.y + cs); ctx.lineTo(obj.x, obj.y); ctx.lineTo(obj.x + cs, obj.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(obj.x + obj.w - cs, obj.y); ctx.lineTo(obj.x + obj.w, obj.y); ctx.lineTo(obj.x + obj.w, obj.y + cs); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(obj.x + obj.w, obj.y + obj.h - cs); ctx.lineTo(obj.x + obj.w, obj.y + obj.h); ctx.lineTo(obj.x + obj.w - cs, obj.y + obj.h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(obj.x + cs, obj.y + obj.h); ctx.lineTo(obj.x, obj.y + obj.h); ctx.lineTo(obj.x, obj.y + obj.h - cs); ctx.stroke();
          // Label
          ctx.fillStyle = colors[obj.label] || '#22C55E';
          ctx.fillRect(obj.x, obj.y - 18, obj.label.length * 8 + 40, 18);
          ctx.fillStyle = '#fff';
          ctx.font = '11px monospace';
          ctx.fillText(`${obj.label} ${Math.round(obj.conf * 100)}%`, obj.x + 4, obj.y - 5);
        });
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const prev = useVisionStore.getState().frameUrl;
          const url = URL.createObjectURL(blob);
          if (prev) URL.revokeObjectURL(prev);
          useVisionStore.getState().updateFrame(url);
        }
      }, 'image/jpeg', 0.7);
    }, 200);

    // Simulate detection updates
    this.mockTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        const classes: DetectionClass[] = ['person', 'car', 'motorcycle', 'bus', 'truck', 'bicycle'];
        const cls = classes[Math.floor(Math.random() * classes.length)];
        const newDet: VisionDetection = {
          id: `d-${Date.now()}`,
          trackId: `T-${4800 + Math.floor(Math.random() * 200)}`,
          class: cls,
          confidence: 0.6 + Math.random() * 0.35,
          bbox: [Math.floor(Math.random() * 400), Math.floor(Math.random() * 250), Math.floor(Math.random() * 200 + 50), Math.floor(Math.random() * 200 + 50)],
          timestamp: new Date().toISOString(),
        };
        useVisionStore.getState().addDetections([newDet]);
      }
    }, 3000);
  }

  isConnected() {
    return this.connected;
  }
}

export const visionService = new VisionService();

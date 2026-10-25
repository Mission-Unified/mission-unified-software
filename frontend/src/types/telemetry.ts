export interface TelemetryData {
  // Flight Controller (FC)
  latitude: number;
  longitude: number;

  gpsAltitude: number;
  barometerAltitude: number;

  speed: number;
  satellites: number;
  hdop: number;

  pitch: number;
  roll: number;
  yaw: number;

  pressure: number;

  distanceFront: number;
  distanceLeft: number;
  distanceRight: number;

  // Environment + IR + Battery (EIB)
  temperature: number;
  humidity: number;

  irLeft: number;
  irRight: number;

  batteryVoltage: number;
  batteryPercent: number;

  // Status + Encoders (SE)
  mode: 'UAV' | 'UGV';
  ugvMode: 'AUTO' | 'MANUAL';

  movement:
    | 'STOP'
    | 'FORWARD'
    | 'BACKWARD'
    | 'LEFT'
    | 'RIGHT';

  alert: boolean;

  command: string;

  leftEncoder: number;
  rightEncoder: number;

  // Link
  rssi: number;
  snr: number;

  timestamp: string;
}

export interface TelemetryAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  detail: string;
  timestamp: string;
  dismissed: boolean;
  autoDismiss?: number;
}

export interface HealthItem {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  uptime: number;
}

export interface VisionDetection {
  id: string;
  trackId: string;

  class: DetectionClass;
  confidence: number;

  bbox: [number, number, number, number];
  timestamp: string;

  location?: string;
  duration?: number;

  // Geolocation
  latitude?: number | null;
  longitude?: number | null;

  groundDistance_m?: number | null;
  bearing_deg?: number | null;
  localizationError_m?: number | null;

  // Tracking
  trackAge?: number;
  hits?: number;
  timeSinceUpdate?: number;

  // ReID
  reidConfidence?: number | null;
  embeddingDistance?: number | null;

  // Motion
  velocity?: number | null;
  velocityPxPerSec?: number | null;
  velocityUnit?: string;

  direction?: string;
}

export interface TrackingStats {
  activeTracks: number;
  lostTracks: number;
  reidEnabled: boolean;
  detectionInterval: number;

  // Advanced stats
  averageTrackAge?: number;
  averageHits?: number;
  averageVelocity?: number;
}

export type DetectionClass = 'person' | 'car' | 'motorcycle' | 'bus' | 'truck' | 'bicycle';

export const DETECTION_COLORS: Record<DetectionClass, string> = {
  person: '#3B82F6',
  car: '#F59E0B',
  motorcycle: '#8B5CF6',
  bus: '#06B6D4',
  truck: '#22C55E',
  bicycle: '#EC4899',
};

export const DETECTION_LABELS: Record<DetectionClass, string> = {
  person: 'Person',
  car: 'Car',
  motorcycle: 'Motorcycle',
  bus: 'Bus',
  truck: 'Truck',
  bicycle: 'Bicycle',
};

export interface Waypoint {
  id: number;
  lat: number;
  lon: number;
  action: 'MOVE' | 'HOLD' | 'CAPTURE' | 'LAND';
  actionValue?: number;
  completed: boolean;
  current: boolean;
  distance: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface CommandResult {
  success: boolean;
  command: string;
  responseTime: number;
  error?: string;
}

export type AccentColor = '#22C55E' | '#3B82F6' | '#06B6D4' | '#8B5CF6' | '#F59E0B' | '#EF4444' | '#EC4899' | '#F97316';

export const ACCENT_COLORS: AccentColor[] = [
  '#22C55E', '#3B82F6', '#06B6D4', '#8B5CF6',
  '#F59E0B', '#EF4444', '#EC4899', '#F97316',
];

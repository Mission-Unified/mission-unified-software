import { useCallback } from 'react';
import {
  Eye, Brain, Camera, Circle, BarChart3,
} from 'lucide-react';
import { useVisionStore } from '@/store/visionStore';
import { useDetectionStats } from '@/store/visionStore';
import { DETECTION_COLORS, DETECTION_LABELS } from '@/types/telemetry';
// import type { VisionDetection } from '@/types/telemetry';
import DataCard from '@/components/common/DataCard';
import { showToast } from '@/hooks/useToast';
import DetectionBarChart from './DetectionBarChart';

export default function VisionPage() {
  const frameUrl = useVisionStore((s) => s.frameUrl);
  const detections = useVisionStore((s) => s.detections);
  const trackingStats = useVisionStore((s) => s.trackingStats);
  const isRecording = useVisionStore((s) => s.isRecording);
  const recordingDuration = useVisionStore((s) => s.recordingDuration);
  const selectedId = useVisionStore((s) => s.selectedDetectionId);
  const activeCount = useVisionStore((s) => s.activeCount);
  const fps = useVisionStore((s) => s.fps);
  const inferenceTime = useVisionStore((s) => s.inferenceTime);
  const selectDetection = useVisionStore((s) => s.selectDetection);
  const startRecording = useVisionStore((s) => s.startRecording);
  const stopRecording = useVisionStore((s) => s.stopRecording);
  const stats = useDetectionStats();
  const selected = detections.find((d) => d.id === selectedId);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      showToast('Recording stopped', undefined, 'info');
    } else {
      startRecording();
      showToast('Recording started', undefined, 'success');
    }
  }, [isRecording, startRecording, stopRecording]);

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: '#E5E7EB' }}>
            VISION SYSTEM
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Live feed and AI detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRecording}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: isRecording ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'}`,
              color: isRecording ? '#EF4444' : '#E5E7EB',
            }}
          >
            <Circle
              size={12}
              fill={isRecording ? '#EF4444' : 'transparent'}
              className={isRecording ? 'animate-recording' : ''}
            />
            {isRecording ? 'STOP' : 'REC'}
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
            onClick={() => showToast('Snapshot saved', undefined, 'success')}
          >
            <Camera size={14} />
            SNAPSHOT
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4">
        {/* Video Feed */}
        <div
          className="rounded-lg overflow-hidden relative"
          style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '16/9' }}
        >
          {frameUrl ? (
            <img
              src={frameUrl}
              alt="Vision Feed"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <p className="text-lg font-semibold" style={{ color: '#64748B' }}>NO VIDEO SIGNAL</p>
              <p className="text-sm mt-2" style={{ color: '#64748B' }}>Waiting for vision stream...</p>
              <div className="flex gap-1 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#64748B] animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#64748B] animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#64748B] animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute top-3 left-3 px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span className="font-mono text-xs" style={{ color: '#22C55E' }}>{fps} FPS</span>
          </div>

          {isRecording && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <Circle size={8} fill="#EF4444" className="animate-recording" />
              <span className="font-mono text-xs" style={{ color: '#EF4444' }}>{formatDuration(recordingDuration)}</span>
            </div>
          )}

          <div className="absolute bottom-3 left-3 px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span className="font-mono text-xs" style={{ color: '#94A3B8' }}>
              {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
            </span>
          </div>

          <div className="absolute bottom-3 right-3 px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span className="font-mono text-xs" style={{ color: '#64748B' }}>640x360</span>
          </div>

          {/* Reticle overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative" style={{ width: 80, height: 80 }}>
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
              <div className="absolute inset-0 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' }} />
            </div>
          </div>

          {/* Bounding boxes (mock overlay) */}
          <div className="absolute inset-0 pointer-events-none">
            {detections.map((det) => {
              const [x1, y1, x2, y2] = det.bbox;

              return (
                <BoundingBox
                  key={det.id}
                  x={x1}
                  y={y1}
                  w={x2 - x1}
                  h={y2 - y1}
                  label={`${det.trackId} • ${det.class} • ${Math.round(det.confidence * 100)}%`}
                  color={
                    DETECTION_COLORS[
                      det.class as keyof typeof DETECTION_COLORS
                    ] || "#22C55E"
                  }
                />
              );
            })}
          </div>
        </div>
        
        {/* Detection Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Detection Counter */}
          <DataCard title="ACTIVE DETECTIONS" icon={<Brain size={16} style={{ color: '#94A3B8' }} />}>
            <div className="mt-2">
              <span className="font-mono text-2xl font-medium" style={{ color: '#E5E7EB' }}>{activeCount}</span>
              <p className="text-xs" style={{ color: '#64748B' }}>objects in frame</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {stats.slice(0, 4).map((s) => (
                  <span
                    key={s.class}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#94A3B8' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    {DETECTION_LABELS[s.class as keyof typeof DETECTION_LABELS] || s.class}: {s.count}
                  </span>
                ))}
              </div>
            </div>
          </DataCard>

          {/* Target Details */}
          <DataCard title="TARGET DETAILS">
            {selected ? (
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: `${DETECTION_COLORS[selected.class as keyof typeof DETECTION_COLORS] || '#94A3B8'}30` }}
                  >
                    <Eye size={16} style={{ color: DETECTION_COLORS[selected.class as keyof typeof DETECTION_COLORS] || '#94A3B8' }} />
                  </div>
                  <div>
                    <p className="text-base font-semibold uppercase" style={{ color: '#E5E7EB' }}>
                      {DETECTION_LABELS[selected.class as keyof typeof DETECTION_LABELS] || selected.class}
                    </p>
                    <p className="font-mono text-xs" style={{ color: '#64748B' }}>#{selected.trackId}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#94A3B8' }}>Confidence</span>
                    <span className="font-mono text-sm" style={{ color: '#E5E7EB' }}>
                      {Math.round(selected.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selected.confidence * 100}%`,
                        background: DETECTION_COLORS[selected.class as keyof typeof DETECTION_COLORS] || '#94A3B8',
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>BBox</p>
                    <p className="font-mono text-[11px]" style={{ color: '#E5E7EB' }}>
                      [{selected.bbox.join(', ')}]
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>First Seen</p>
                    <p className="font-mono text-[11px]" style={{ color: '#E5E7EB' }}>
                      {new Date(selected.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Track ID</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.trackId}
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Tracking Age</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.trackAge} frames
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Confidence</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {Math.round(selected.confidence * 100)}%
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Hits</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.hits}
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Object Velocity</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.velocity} {selected.velocityUnit}
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Object Direction</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.direction}°
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Longitude</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.longitude}
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Latitude</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.latitude}
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>ReID Confidence</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.reidConfidence}
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>Ground Distance</p>
                    <p className="font-mono text-[11px]" style={{ color: '#22C55E' }}>
                      {selected.groundDistance_m} m
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p className="text-sm" style={{ color: '#64748B' }}>Select a detection to view details</p>
              </div>
            )}
          </DataCard>

          {/* Detection List */}
          <DataCard title="DETECTION HISTORY" className="flex-1">
            <div className="max-h-[calc(100vh-620px)] overflow-y-auto -mx-5 -mb-4 px-5 pb-4">
              {detections.slice(0, 10).map((det) => (
                <div
                  key={det.id}
                  onClick={() => selectDetection(det.id === selectedId ? null : det.id)}
                  className="flex items-center gap-2.5 py-2.5 border-b cursor-pointer transition-colors hover:bg-white/[0.03]"
                  style={{
                    borderColor: 'rgba(255,255,255,0.04)',
                    borderLeft: det.id === selectedId ? `2px solid ${DETECTION_COLORS[det.class as keyof typeof DETECTION_COLORS] || '#94A3B8'}` : '2px solid transparent',
                    paddingLeft: det.id === selectedId ? 8 : 10,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${DETECTION_COLORS[det.class as keyof typeof DETECTION_COLORS] || '#94A3B8'}30` }}
                  >
                    <Eye size={12} style={{ color: DETECTION_COLORS[det.class as keyof typeof DETECTION_COLORS] || '#94A3B8' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#E5E7EB' }}>
                      {DETECTION_LABELS[det.class as keyof typeof DETECTION_LABELS] || det.class}
                    </p>
                    <p className="text-[11px]" style={{ color: '#94A3B8' }}>
                      {Math.round(det.confidence * 100)}% confidence
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-[11px]" style={{ color: '#64748B' }}>
                      {new Date(det.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-[10px]" style={{ color: '#64748B' }}>#{det.trackId}</p>
                  </div>
                </div>
              ))}
            </div>
          </DataCard>

          {/* Object Statistics */}
          <DataCard title="OBJECT STATISTICS" icon={<BarChart3 size={16} style={{ color: '#94A3B8' }} />}>
            <div className="h-[140px] mt-2">
              <DetectionBarChart data={stats} />
            </div>
          </DataCard>
        </div>
      </div>

      {/* AI Status Bar */}
      <DataCard noPadding>
        <div className="px-5 py-3 flex flex-wrap items-center gap-5">

          {/* Engine Status */}
          <div className="flex items-center gap-2">
            <Brain size={16} style={{ color: "#22C55E" }} />
            <span className="text-sm font-medium" style={{ color: "#22C55E" }}> AI ENGINE ACTIVE </span>
            <div className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: "#22C55E" }} />
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }} > | </span>
          {/* Metrics */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs" style={{ color: '#64748B' }}>YOLOv11n · 640x360 · COCO v8 Dataset </span>
            <span className="font-mono text-xs inline-block w-[120px]" style={{ color: "#94A3B8" }}> Inference: {inferenceTime.toFixed(1)}ms </span>
            <span className="font-mono text-xs" style={{ color: "#94A3B8" }}> FPS: {fps} </span>
            <span className="font-mono text-xs" style={{ color: "#94A3B8" }}> Tracks: {trackingStats.activeTracks} </span>
            <span className="font-mono text-xs" style={{ color: "#94A3B8" }}> Lost: {trackingStats.lostTracks} </span>
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }} > | </span>
          {/* Pipeline Status */}
          <div className="flex flex-wrap items-center gap-4">
            {[
              {
                label: "Detection",
                on: detections.length > 0,
              },
              {
                label: "Tracking",
                on: trackingStats.activeTracks > 0,
              },
              {
                label: "ReID",
                on: trackingStats.reidEnabled,
              },
              {
                label: "Geolocation",
                on: trackingStats.reidEnabled,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: item.on
                      ? "#22C55E"
                      : "#64748B",
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: item.on
                      ? "#22C55E"
                      : "#94A3B8",
                  }}
                >
                  {item.label}: {item.on ? "ON" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DataCard>
    </div>
  );
}

function BoundingBox({ x, y, w, h, label, color }: { x: number; y: number; w: number; h: number; label: string; color: string }) {
  const cs = 6; // corner size
  return (
    <div
      className="absolute"
      style={{
        left: `${(x / 640) * 100}%`,
        top: `${(y / 360) * 100}%`,
        width: `${(w / 640) * 100}%`,
        height: `${(h / 360) * 100}%`,
      }}
    >
      {/* Corner brackets */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <line x1={0} y1={cs} x2={0} y2={0} stroke={color} strokeWidth={2} />
        <line x1={0} y1={0} x2={cs} y2={0} stroke={color} strokeWidth={2} />
        <line x1={w - cs} y1={0} x2={w} y2={0} stroke={color} strokeWidth={2} />
        <line x1={w} y1={0} x2={w} y2={cs} stroke={color} strokeWidth={2} />
        <line x1={w} y1={h - cs} x2={w} y2={h} stroke={color} strokeWidth={2} />
        <line x1={w - cs} y1={h} x2={w} y2={h} stroke={color} strokeWidth={2} />
        <line x1={0} y1={h - cs} x2={0} y2={h} stroke={color} strokeWidth={2} />
        <line x1={0} y1={h} x2={cs} y2={h} stroke={color} strokeWidth={2} />
      </svg>
      {/* Label */}
      <div
        className="absolute -top-5 left-0 px-1.5 py-0.5 rounded-sm text-[10px] font-mono whitespace-nowrap"
        style={{ background: 'rgba(0,0,0,0.7)', color }}
      >
        {label}
      </div>
    </div>
  );
}

import React from 'react';
import { create } from 'zustand';
import type {
  VisionDetection,
  TrackingStats,
} from '@/types/telemetry';
import { DETECTION_COLORS } from '@/types/telemetry';

interface VisionState {
  connected: boolean;
  frameUrl: string | null;

  detections: VisionDetection[];

  trackingStats: TrackingStats;

  isRecording: boolean;
  recordingDuration: number;

  selectedDetectionId: string | null;

  activeCount: number;
  fps: number;
  inferenceTime: number;

  setConnected: (c: boolean) => void;
  updateFrame: (url: string) => void;

  setDetections: (d: VisionDetection[]) => void;
  addDetections: (d: VisionDetection[]) => void;

  setTrackingStats: (
    stats: TrackingStats
  ) => void;

  selectDetection: (id: string | null) => void;

  startRecording: () => void;
  stopRecording: () => void;

  setRecordingDuration: (d: number) => void;

  setFps: (f: number) => void;
  setInferenceTime: (t: number) => void;

  clearDetections: () => void;
}

export const useVisionStore = create<VisionState>((set) => ({
  connected: false,

  frameUrl: null,

  detections: [],

  trackingStats: {
    activeTracks: 0,
    lostTracks: 0,
    reidEnabled: false,
    detectionInterval: 1,
  },

  activeCount: 0,

  fps: 0,
  inferenceTime: 0,

  isRecording: false,
  recordingDuration: 0,

  selectedDetectionId: null,

  setConnected: (c) =>
    set({
      connected: c,
    }),

  updateFrame: (url) =>
    set({
      frameUrl: url,
    }),

  setTrackingStats: (stats) =>
    set({
      trackingStats: stats,
    }),

  setDetections: (detections) =>
    set({
      detections,
      activeCount: detections.length,
    }),

  addDetections: (incoming) =>
    set((state) => {
      const map = new Map<string, VisionDetection>();

      state.detections.forEach((d) => {
        map.set(d.trackId, d);
      });

      incoming.forEach((d) => {
        map.set(d.trackId, {
          ...map.get(d.trackId),
          ...d,
        });
      });

      const merged = Array.from(map.values())
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        )
        .slice(0, 500);

      return {
        detections: merged,
        activeCount: incoming.length,
      };
    }),

  selectDetection: (id) =>
    set({
      selectedDetectionId: id,
    }),

  startRecording: () =>
    set({
      isRecording: true,
      recordingDuration: 0,
    }),

  stopRecording: () =>
    set({
      isRecording: false,
    }),

  setRecordingDuration: (d) =>
    set({
      recordingDuration: d,
    }),

  setFps: (f) =>
    set({
      fps: f,
    }),

  setInferenceTime: (t) =>
    set({
      inferenceTime: t,
    }),

  clearDetections: () =>
    set({
      detections: [],
      activeCount: 0,
    }),
}));

export function useDetectionStats() {
  const detections = useVisionStore(
    (state) => state.detections
  );

  return React.useMemo(() => {
    const stats: Record<string, number> = {};

    detections.forEach((d) => {
      stats[d.class] = (stats[d.class] || 0) + 1;
    });

    return Object.entries(stats).map(
      ([className, count]) => ({
        class: className,
        count,
        color:
          DETECTION_COLORS[
            className as keyof typeof DETECTION_COLORS
          ] || '#94A3B8',
      })
    );
  }, [detections]);
}
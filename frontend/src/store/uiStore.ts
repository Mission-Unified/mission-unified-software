import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccentColor } from '@/types/telemetry';

interface UIState {
  accentColor: AccentColor;
  density: 'compact' | 'default' | 'comfortable';
  fontSize: number;
  animations: boolean;
  glassmorphism: number;
  units: 'metric' | 'imperial';
  timeFormat: 'utc' | 'local';
  operatorCallsign: string;
  toastPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  notifications: {
    critical: boolean;
    warning: boolean;
    info: boolean;
    success: boolean;
    telemetry: boolean;
  };
  setAccentColor: (c: AccentColor) => void;
  setDensity: (d: 'compact' | 'default' | 'comfortable') => void;
  setFontSize: (s: number) => void;
  setAnimations: (a: boolean) => void;
  setGlassmorphism: (g: number) => void;
  setUnits: (u: 'metric' | 'imperial') => void;
  setTimeFormat: (t: 'utc' | 'local') => void;
  setOperatorCallsign: (c: string) => void;
  setToastPosition: (p: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => void;
  setNotification: (key: keyof UIState['notifications'], value: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      accentColor: '#22C55E',
      density: 'default',
      fontSize: 14,
      animations: true,
      glassmorphism: 72,
      units: 'metric',
      timeFormat: 'utc',
      operatorCallsign: 'ALPHA-1',
      toastPosition: 'top-right',
      notifications: {
        critical: true,
        warning: true,
        info: true,
        success: false,
        telemetry: true,
      },
      setAccentColor: (c) => set({ accentColor: c }),
      setDensity: (d) => set({ density: d }),
      setFontSize: (s) => set({ fontSize: s }),
      setAnimations: (a) => set({ animations: a }),
      setGlassmorphism: (g) => set({ glassmorphism: g }),
      setUnits: (u) => set({ units: u }),
      setTimeFormat: (t) => set({ timeFormat: t }),
      setOperatorCallsign: (c) => set({ operatorCallsign: c }),
      setToastPosition: (p) => set({ toastPosition: p }),
      setNotification: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
    }),
    {
      name: 'tcs7-settings',
      partialize: (state) => ({
        accentColor: state.accentColor,
        density: state.density,
        fontSize: state.fontSize,
        animations: state.animations,
        glassmorphism: state.glassmorphism,
        units: state.units,
        timeFormat: state.timeFormat,
        operatorCallsign: state.operatorCallsign,
        toastPosition: state.toastPosition,
        notifications: state.notifications,
      }),
    }
  )
);

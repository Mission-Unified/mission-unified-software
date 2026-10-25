import { useState, useCallback, useEffect } from 'react';

interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration: number;
}

const toasts: ToastMessage[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function showToast(
  title: string,
  message?: string,
  type: ToastMessage['type'] = 'info',
  duration = 5000
) {
  const id = `toast-${Date.now()}-${Math.random()}`;
  toasts.unshift({ id, title, message, type, duration });
  if (toasts.length > 5) toasts.pop();
  notify();
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx >= 0) {
      toasts.splice(idx, 1);
      notify();
    }
  }, duration);
}

export function useToast() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx >= 0) {
      toasts.splice(idx, 1);
      notify();
    }
  }, []);

  return { toasts, dismiss };
}

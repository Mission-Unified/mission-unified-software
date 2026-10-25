import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCommandStore } from '@/store/commandStore';

const MODULES = ['/', '/telemetry', '/sensors', '/vision', '/mission', '/logs', '/settings'];

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Module navigation 1-7
      if (e.key >= '1' && e.key <= '7') {
        const idx = parseInt(e.key) - 1;
        if (MODULES[idx]) {
          navigate(MODULES[idx]);
          e.preventDefault();
        }
        return;
      }

      // Mission controls
      if (location.pathname === '/mission') {
        const speed = useCommandStore.getState().movementSpeed;
        const cmds: Record<string, string> = {
          w: 'CTRL:F', W: 'CTRL:F',
          a: 'CTRL:L', A: 'CTRL:L',
          s: 'CTRL:B', S: 'CTRL:B',
          d: 'CTRL:R', D: 'CTRL:R',
        };
        if (cmds[e.key]) {
          useCommandStore.getState().sendCommand(cmds[e.key]);
          e.preventDefault();
          return;
        }
        if (e.key === ' ') {
          useCommandStore.getState().sendCommand('CTRL:S');
          e.preventDefault();
          return;
        }
        if (e.key === '+' || e.key === '=') {
          useCommandStore.getState().setMovementSpeed(Math.min(100, speed + 5));
          e.preventDefault();
          return;
        }
        if (e.key === '-' || e.key === '_') {
          useCommandStore.getState().setMovementSpeed(Math.max(0, speed - 5));
          e.preventDefault();
          return;
        }
      }

      // Mode toggle (any page)
      if (e.key === 'm' || e.key === 'M') {
        const mode = useCommandStore.getState().controlMode;
        useCommandStore.getState().setControlMode(mode === 'MANUAL' ? 'AUTO' : 'MANUAL');
        e.preventDefault();
        return;
      }

      // Emergency stop (any page)
      if (e.key === ' ') {
        useCommandStore.getState().sendCommand('CTRL:S');
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, location.pathname]);
}

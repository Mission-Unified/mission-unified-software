import { create } from 'zustand';

interface CommandLog {
  id: string;
  timestamp: string;
  command: string;
  status: 'pending' | 'success' | 'failed';
  responseTime?: number;
  error?: string;
}

interface CommandState {
  pending: boolean;
  error: string | null;

  lastCommand: string | null;
  lastResponseTime: number | null;

  commandHistory: CommandLog[];

  movementSpeed: number;
  controlMode: 'MANUAL' | 'AUTO';

  sendCommand: (cmd: string) => Promise<void>;
  setMovementSpeed: (speed: number) => void;
  setControlMode: (mode: 'MANUAL' | 'AUTO') => void;
  clearHistory: () => void;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

export const useCommandStore = create<CommandState>((set) => ({
  pending: false,
  error: null,

  lastCommand: null,
  lastResponseTime: null,

  commandHistory: [],

  movementSpeed: 75,
  controlMode: 'MANUAL',

  sendCommand: async (cmd: string) => {
    const commandId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newLog: CommandLog = {
      id: commandId,
      timestamp,
      command: cmd,
      status: 'pending',
    };

    set((state) => ({
      pending: true,
      error: null,
      lastCommand: cmd,
      commandHistory: [
        newLog,
        ...state.commandHistory,
      ].slice(0, 200),
    }));

    const start = performance.now();

    try {
      const response = await fetch(`${API_URL}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cmd }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rt = Math.round(
        performance.now() - start
      );

      set((state) => ({
        pending: false,
        error: null,
        lastResponseTime: rt,
        commandHistory: state.commandHistory.map(
          (entry): CommandLog =>
            entry.id === commandId
              ? {
                  ...entry,
                  status: 'success',
                  responseTime: rt,
                }
              : entry
        ),
      }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Command failed';

      set((state) => ({
        pending: false,
        error: message,
        commandHistory: state.commandHistory.map(
          (entry): CommandLog =>
            entry.id === commandId
              ? {
                  ...entry,
                  status: 'failed',
                  error: message,
                }
              : entry
        ),
      }));

      throw err;
    }
  },

  setMovementSpeed: (speed: number) =>
    set({
      movementSpeed: speed,
    }),

  setControlMode: (mode: 'MANUAL' | 'AUTO') =>
    set({
      controlMode: mode,
    }),

  clearHistory: () =>
    set({
      commandHistory: [],
    }),
}));
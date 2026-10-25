import { useCallback } from 'react';
import { useCommandStore } from '@/store/commandStore';
import { sendCommand as sendCmd } from '@/services/command.service';

export function useCommand() {
  const store = useCommandStore();

  const sendCommand = useCallback(async (cmd: string) => {
    useCommandStore.setState({ pending: true, error: null, lastCommand: cmd });
    try {
      await sendCmd(cmd);
      useCommandStore.setState({ pending: false, lastResponseTime: 30 });
    } catch (err) {
      useCommandStore.setState({ pending: false, error: err instanceof Error ? err.message : 'Failed' });
      throw err;
    }
  }, []);

  return {
    sendCommand,
    pending: store.pending,
    error: store.error,
    lastCommand: store.lastCommand,
    lastResponseTime: store.lastResponseTime,
    movementSpeed: store.movementSpeed,
    controlMode: store.controlMode,
    setMovementSpeed: store.setMovementSpeed,
    setControlMode: store.setControlMode,
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function sendCommand(cmd: string): Promise<void> {
  const response = await fetch(`${API_URL}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd }),
  });
  if (!response.ok) throw new Error(`Command failed: HTTP ${response.status}`);
}

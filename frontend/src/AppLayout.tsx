import { useTelemetry } from '@/hooks/useTelemetry';
import { useVision } from '@/hooks/useVision';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import NavigationRail from '@/components/layout/NavigationRail';
import TopStatusBar from '@/components/layout/TopStatusBar';
import ToastContainer from '@/components/common/ToastContainer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useTelemetry();
  useVision();
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen" style={{ background: '#0B1220' }}>
      <TopStatusBar />
      <NavigationRail />
      <main
        className="overflow-y-auto overflow-x-hidden"
        style={{
          marginLeft: 64,
          marginTop: 48,
          height: 'calc(100vh - 48px)',
          width: 'calc(100vw - 64px)',
        }}
      >
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}

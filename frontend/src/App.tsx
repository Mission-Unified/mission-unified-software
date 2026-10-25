import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppLayout from './AppLayout';

const OverviewPage = lazy(() => import('./pages/Overview/OverviewPage'));
const TelemetryPage = lazy(() => import('./pages/Telemetry/TelemetryPage'));
const SensorsPage = lazy(() => import('./pages/Sensors/SensorsPage'));
const VisionPage = lazy(() => import('./pages/Vision/VisionPage'));
const MissionPage = lazy(() => import('./pages/Mission/MissionPage'));
const LogsPage = lazy(() => import('./pages/Logs/LogsPage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

export default function App() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[calc(100vh-48px)]">
            <div className="animate-shimmer w-48 h-6 rounded" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/telemetry" element={<TelemetryPage />} />
          <Route path="/sensors" element={<SensorsPage />} />
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/mission" element={<MissionPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

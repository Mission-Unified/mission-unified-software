import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Shield, Eye, Target,
  ScrollText, Settings,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MODULES = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/telemetry', icon: Activity, label: 'Telemetry' },
  { path: '/sensors', icon: Shield, label: 'Sensors' },
  { path: '/vision', icon: Eye, label: 'Vision' },
  { path: '/mission', icon: Target, label: 'Mission' },
  { path: '/logs', icon: ScrollText, label: 'Logs' },
];

export default function NavigationRail() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        className="fixed left-0 top-12 w-16 h-[calc(100vh-48px)] flex flex-col z-40"
        style={{
          background: "#111827",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Top items */}
        <div className="flex flex-col items-center pt-2 gap-1">
          {MODULES.map((mod) => {
            const isActive = location.pathname === mod.path;

            return (
              <Tooltip key={mod.path}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(mod.path)}
                    className={`nav-item relative ${
                      isActive ? "active" : ""
                    }`}
                  >
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                        style={{ background: "#22C55E" }}
                      />
                    )}

                    <mod.icon size={20} strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>

                <TooltipContent side="right" sideOffset={8}>
                  <p className="text-xs font-medium">{mod.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom item */}
        <div className="mt-auto flex justify-center pb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/settings")}
                className={`nav-item relative ${
                  location.pathname === "/settings" ? "active" : ""
                }`}
              >
                {location.pathname === "/settings" && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{ background: "#22C55E" }}
                  />
                )}

                <Settings size={20} strokeWidth={1.5} />
              </button>
            </TooltipTrigger>

            <TooltipContent side="right" sideOffset={8}>
              <p className="text-xs font-medium">Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
}

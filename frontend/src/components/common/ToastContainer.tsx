import { X, CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const typeConfig = {
  success: { icon: CheckCircle2, color: '#22C55E' },
  warning: { icon: AlertTriangle, color: '#F59E0B' },
  error: { icon: AlertOctagon, color: '#EF4444' },
  info: { icon: Info, color: '#3B82F6' },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[60px] right-5 z-[100] flex flex-col gap-2" style={{ width: 360 }}>
      {toasts.map((toast) => {
        const config = typeConfig[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className="animate-slide-in-right glass-card flex items-start gap-3 p-4"
            style={{ borderLeft: `3px solid ${config.color}` }}
          >
            <Icon size={18} style={{ color: config.color, flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                {toast.title}
              </p>
              {toast.message && (
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-white/5 transition-colors"
              style={{ color: '#64748B' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

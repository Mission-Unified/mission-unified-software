import type { ReactNode } from 'react';
import { useUIStore } from '@/store/uiStore';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendColor?: string;
  color?: string;
  washColor?: string;
  progress?: number;
  progressColor?: string;
  children?: ReactNode;
  delay?: number;
  compact?: boolean;
  className?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  trendColor = '#22C55E',
  color,
  washColor = 'green-wash',
  progress,
  progressColor = '#22C55E',
  children,
  delay = 0,
  compact = false,
  className = '',
}: StatCardProps) {
  const animations = useUIStore((s) => s.animations);

  return (
    <div
      className={`glass-card glass-card-hover ${washColor} ${className}`}
      style={{
        padding: compact ? '16px' : '20px',
        animation: animations ? `fade-in-up 400ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both` : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: color || '#22C55E' }}>{icon}</span>
          <span
            className="text-xs font-medium uppercase tracking-[0.05em]"
            style={{ color: '#94A3B8' }}
          >
            {label}
          </span>
        </div>
        {trend && (
          <span className="text-[11px] font-medium" style={{ color: trendColor }}>
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-2">
        <span
          className={`font-mono font-medium ${compact ? 'text-lg' : 'text-[32px]'} tracking-tight`}
          style={{ color: color || '#E5E7EB', lineHeight: 1 }}
        >
          {value}
        </span>
      </div>

      {/* Sub */}
      {sub && (
        <p className="text-xs mt-1" style={{ color: '#64748B' }}>
          {sub}
        </p>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-3 w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: progressColor }}
          />
        </div>
      )}

      {children}
    </div>
  );
}

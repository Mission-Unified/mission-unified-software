import type { ReactNode } from 'react';

interface DataCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
}

export default function DataCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = '',
  style,
  noPadding = false,
}: DataCardProps) {
  return (
    <div className={`glass-card ${className}`} style={style}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}
            <div>
              {title && (
                <h3 className="text-sm font-semibold" style={{ color: '#E5E7EB' }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-5 pb-4'}>{children}</div>
    </div>
  );
}

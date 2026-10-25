interface StatusBadgeProps {
  variant: 'online' | 'warning' | 'critical' | 'offline' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ variant, children, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase ${size === 'sm' ? 'px-2.5 py-0.5 text-[10px] tracking-[0.05em]' : 'px-3 py-1 text-xs tracking-[0.04em]'}`}
      style={{
        background:
          variant === 'online' ? 'rgba(34,197,94,0.12)' :
          variant === 'warning' ? 'rgba(245,158,11,0.12)' :
          variant === 'critical' ? 'rgba(239,68,68,0.12)' :
          variant === 'info' ? 'rgba(59,130,246,0.12)' :
          'rgba(100,116,139,0.12)',
        color:
          variant === 'online' ? '#22C55E' :
          variant === 'warning' ? '#F59E0B' :
          variant === 'critical' ? '#EF4444' :
          variant === 'info' ? '#3B82F6' :
          '#64748B',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background:
            variant === 'online' ? '#22C55E' :
            variant === 'warning' ? '#F59E0B' :
            variant === 'critical' ? '#EF4444' :
            variant === 'info' ? '#3B82F6' :
            '#64748B',
        }}
      />
      {children}
    </span>
  );
}

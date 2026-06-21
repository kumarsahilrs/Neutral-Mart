interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div
      className="flex items-center flex-shrink-0"
      style={{
        height: 76,
        borderBottom: '1px solid var(--nm-line)',
        padding: '0 32px',
        gap: 16,
        background: 'var(--nm-card)',
      }}
    >
      <div>
        <div className="disp" style={{ fontSize: 20, fontWeight: 700, color: 'var(--nm-ink)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: 'var(--nm-muted)' }}>{subtitle}</div>}
      </div>
      {actions && (
        <div className="flex items-center gap-3 ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
}

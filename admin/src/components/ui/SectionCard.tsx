interface SectionCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  pad?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function SectionCard({ title, action, children, pad = 22, className = '', style }: SectionCardProps) {
  return (
    <div className={`nm-card ${className}`} style={style}>
      {(title || action) && (
        <div
          className="flex justify-between items-center"
          style={{ padding: `18px ${pad}px 0` }}
        >
          {title && (
            <h3 className="disp" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--nm-ink)' }}>
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div style={{ padding: pad }}>
        {children}
      </div>
    </div>
  );
}

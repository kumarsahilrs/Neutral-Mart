import { type LucideIcon } from 'lucide-react';

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;   // true = green delta, false = red delta, undefined = muted
  icon?: LucideIcon;
}

export default function Kpi({ label, value, sub, positive, icon: Icon }: KpiProps) {
  const deltaColor =
    positive === true ? '#2f8049' :
    positive === false ? '#b6442a' :
    '#7a6f5d';

  return (
    <div className="nm-card" style={{ padding: '18px 20px' }}>
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontSize: 12.5, color: 'var(--nm-muted)', fontWeight: 600 }}>{label}</span>
        {Icon && (
          <span
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--nm-green-soft)', color: 'var(--nm-green)' }}
          >
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="num" style={{ fontSize: 28, fontWeight: 800, color: 'var(--nm-ink)', fontFamily: '"Bricolage Grotesque", sans-serif' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: deltaColor, fontWeight: positive != null ? 700 : 600, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

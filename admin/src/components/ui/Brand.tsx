import { Package } from 'lucide-react';

interface BrandProps {
  light?: boolean;
  sub?: string;
  size?: number;
}

export default function Brand({ light, sub, size = 20 }: BrandProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: size + 18,
          height: size + 18,
          borderRadius: 12,
          background: 'var(--nm-gold)',
          color: 'var(--nm-deep)',
          boxShadow: '0 2px 0 rgba(0,0,0,.12)',
        }}
      >
        <Package size={size - 1} strokeWidth={2} />
      </span>
      <div style={{ lineHeight: 1.05 }}>
        <span
          className="disp font-display"
          style={{ fontSize: size, fontWeight: 800, color: light ? '#fff' : 'var(--nm-ink)' }}
        >
          Nirmal<span style={{ color: light ? 'var(--nm-gold2)' : 'var(--nm-green)' }}>Mandi</span>
        </span>
        {sub && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: light ? 'rgba(255,255,255,.6)' : 'var(--nm-faint)',
              letterSpacing: '.03em',
              marginTop: 2,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

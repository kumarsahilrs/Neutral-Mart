'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';
import Brand from './Brand';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  sub?: string;
  footer?: React.ReactNode;
  width?: number;
}

export default function Sidebar({ items, sub, footer, width = 236 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{ width, background: 'var(--nm-deep)', color: '#fff', padding: '22px 16px', position: 'relative', minHeight: '100vh' }}
    >
      <div style={{ padding: '0 8px 24px' }}>
        <Brand light sub={sub} />
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 no-underline transition-colors"
              style={{
                padding: '11px 14px',
                borderRadius: 12,
                fontSize: 14,
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: active ? 700 : 500,
                background: active ? 'var(--nm-gold)' : 'transparent',
                color: active ? 'var(--nm-deep)' : 'rgba(255,255,255,.82)',
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {footer && (
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          {footer}
        </div>
      )}
    </aside>
  );
}

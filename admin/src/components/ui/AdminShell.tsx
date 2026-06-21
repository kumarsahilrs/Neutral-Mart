'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, LogOut,
  LayoutDashboard, ShieldCheck, AlertTriangle, BarChart2, CreditCard,
  Package, Grid3x3, Users, Wallet, Settings, ClipboardList, Bell,
  type LucideIcon,
} from 'lucide-react';
import Brand from './Brand';
import Topbar from './Topbar';
import api from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: 'kyc';
}

const NAV: NavItem[] = [
  { label: 'Dashboard',     href: '/',              icon: LayoutDashboard },
  { label: 'KYC',           href: '/kyc',           icon: ShieldCheck, badgeKey: 'kyc' },
  { label: 'Disputes',      href: '/disputes',      icon: AlertTriangle },
  { label: 'Analytics',     href: '/analytics',     icon: BarChart2 },
  { label: 'Transactions',  href: '/transactions',  icon: CreditCard },
  { label: 'Inventory',     href: '/inventory',     icon: Package },
  { label: 'Categories',    href: '/categories',    icon: Grid3x3 },
  { label: 'Users',         href: '/users',         icon: Users },
  { label: 'Payouts',       href: '/payouts',       icon: Wallet },
  { label: 'Settings',      href: '/settings',      icon: Settings },
  { label: 'Audit',         href: '/audit',         icon: ClipboardList },
  { label: 'Notifications', href: '/notifications',  icon: Bell },
];

function SidebarNav({ kycCount, onNavigate }: { kycCount: number; onNavigate?: () => void }) {
  const pathname = usePathname();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nm_admin_token');
      localStorage.removeItem('nm_admin_user');
      window.location.href = '/login';
    }
  };

  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{ width: 236, background: 'var(--nm-deep)', color: '#fff', padding: '22px 16px', minHeight: '100vh' }}
    >
      <div style={{ padding: '0 8px 24px' }}>
        <Brand light sub="Admin Console" />
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const showBadge = item.badgeKey === 'kyc' && kycCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span
                  className="num"
                  style={{
                    minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999,
                    background: active ? 'var(--nm-deep)' : 'var(--nm-gold)',
                    color: active ? '#fff' : 'var(--nm-deep)',
                    fontSize: 11, fontWeight: 800,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {kycCount > 99 ? '99+' : kycCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 transition-colors"
        style={{
          marginTop: 'auto', padding: '11px 14px', borderRadius: 12,
          fontSize: 14, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 600,
          background: 'transparent', color: 'rgba(255,255,255,.7)', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <LogOut size={18} strokeWidth={1.8} />
        Logout
      </button>
    </aside>
  );
}

interface AdminShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  noPad?: boolean;
}

export default function AdminShell({ title, subtitle, actions, children, noPad }: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kycCount, setKycCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/admin/kyc/pending-count');
        const count = res.data?.data?.count ?? res.data?.count ?? 0;
        if (!cancelled) setKycCount(count);
      } catch {
        /* badge is non-critical */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--nm-paper)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <SidebarNav kycCount={kycCount} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <SidebarNav kycCount={kycCount} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center">
          <button
            className="lg:hidden p-4"
            style={{ color: 'var(--nm-muted)' }}
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Toggle navigation"
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex-1">
            <Topbar title={title} subtitle={subtitle} actions={actions} />
          </div>
        </div>

        <main style={{ flex: 1, padding: noPad ? 0 : '24px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

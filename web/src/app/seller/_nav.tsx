'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, PlusCircle, ShoppingBag,
  BarChart2, Wallet, ShieldCheck, Bell, Settings, User, TrendingUp,
} from 'lucide-react';
import { type NavItem } from '@/components/ui/Sidebar';
import { notificationsApi } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

const BASE_NAV: NavItem[] = [
  { label: 'Dashboard',     href: '/seller/dashboard',     icon: LayoutDashboard },
  { label: 'My Listings',   href: '/seller/listings',      icon: Package },
  { label: 'New Listing',   href: '/seller/listings/new',  icon: PlusCircle },
  { label: 'Orders',        href: '/seller/orders',        icon: ShoppingBag },
  { label: 'Payouts',       href: '/seller/payouts',       icon: Wallet },
  { label: 'Analytics',     href: '/seller/analytics',     icon: BarChart2 },
  { label: 'KYC',           href: '/seller/kyc',           icon: ShieldCheck },
  { label: 'Notifications', href: '/seller/notifications', icon: Bell },
  { label: 'Profile',       href: '/seller/profile',       icon: User },
  { label: 'Settings',      href: '/seller/settings',      icon: Settings },
];

// Hook to get nav with live unread notification badge
export function useSellerNav(): NavItem[] {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    async function fetchUnread() {
      try {
        const res = await notificationsApi.getUnreadCount();
        const count = (res.data as unknown as { data?: { count?: number } })?.data?.count ?? 0;
        if (!cancelled) setUnread(count);
      } catch { /* silent */ }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000); // poll every minute
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return BASE_NAV.map(item =>
    item.href === '/seller/notifications' && unread > 0
      ? { ...item, badge: unread }
      : item
  );
}

// Static export for pages that don't need dynamic badge (SSR-safe)
export const SELLER_NAV = BASE_NAV;
export const SELLER_BRAND_SUB = 'Seller Portal';

export function SellerSidebarFooter() {
  return (
    <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
      <div className="flex items-start gap-2.5">
        <span className="flex items-center justify-center flex-shrink-0"
          style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--nm-green-soft)', color: 'var(--nm-green)' }}>
          <TrendingUp size={14} strokeWidth={2.2} />
        </span>
        <p style={{ fontSize: 12, color: '#8fd6a4', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
          Capital recovery — 78% of dead-stock value recovered.
        </p>
      </div>
    </div>
  );
}

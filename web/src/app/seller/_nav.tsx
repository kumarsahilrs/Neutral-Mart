import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  Wallet,
  User,
  TrendingUp,
} from 'lucide-react';
import { type NavItem } from '@/components/ui/Sidebar';

export const SELLER_NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/seller/dashboard', icon: LayoutDashboard },
  { label: 'My Listings', href: '/seller/listings',  icon: Package },
  { label: 'Orders',      href: '/seller/orders',    icon: ShoppingBag },
  { label: 'Analytics',   href: '/seller/analytics', icon: BarChart2 },
  { label: 'Payouts',     href: '/seller/payouts',   icon: Wallet },
  { label: 'Profile',     href: '/seller/profile',   icon: User },
];

export const SELLER_BRAND_SUB = 'Seller Portal';

export function SellerSidebarFooter() {
  return (
    <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
      <div className="flex items-start gap-2.5">
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--nm-green-soft)', color: 'var(--nm-green)' }}
        >
          <TrendingUp size={14} strokeWidth={2.2} />
        </span>
        <p style={{ fontSize: 12, color: '#8fd6a4', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
          Capital recovery — 78% of dead-stock value recovered.
        </p>
      </div>
    </div>
  );
}

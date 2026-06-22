'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, Search, LayoutDashboard, ShoppingBag, Heart, Gift, User, Loader2 } from 'lucide-react';
import { AppShell, Badge, inr } from '@/components/ui';
import { type NavItem } from '@/components/ui/Sidebar';
import { ordersApi, type Order } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

const NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard', icon: LayoutDashboard },
  { label: 'Browse lots', href: '/listings',  icon: ShoppingBag },
  { label: 'Orders',      href: '/orders',    icon: Package },
  { label: 'Watchlist',   href: '/watchlist', icon: Heart },
  { label: 'Referral',    href: '/referral',  icon: Gift },
  { label: 'Profile',     href: '/profile',   icon: User },
];

const TABS = [
  { label: 'All', value: '' },
  { label: 'Pending payment', value: 'pending_payment' },
  { label: 'Paid', value: 'paid' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Disputed', value: 'disputed' },
];

const PAGE_SIZE = 15;

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { if (!isAuthenticated()) router.replace('/login'); }, [router]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeTab, appliedSearch, page],
    queryFn: () => ordersApi.getMyOrders({ status: activeTab || undefined, search: appliedSearch || undefined, page, limit: PAGE_SIZE } as Parameters<typeof ordersApi.getMyOrders>[0]),
    select: (res) => {
      const payload = res.data as unknown as { data: Order[] | { rows: Order[]; total: number }; total?: number } | Order[];
      if (Array.isArray(payload)) return { orders: payload, total: payload.length };
      const d = (payload as { data: unknown })?.data;
      if (Array.isArray(d)) return { orders: d as Order[], total: (payload as { total?: number }).total ?? (d as Order[]).length };
      if (d && typeof d === 'object' && 'rows' in d) return { orders: (d as { rows: Order[] }).rows, total: (d as { total: number }).total };
      return { orders: [], total: 0 };
    },
    enabled: isAuthenticated(),
  });

  const orders: Order[] = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const sidebarFooter = (
    <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.65)', margin: 0, lineHeight: 1.4 }}>🛡 Escrow protected — every order is held safe until you confirm delivery.</p>
    </div>
  );

  return (
    <AppShell
      navItems={NAV} brandSub="Buyer Portal" sidebarFooter={sidebarFooter}
      title="Orders"
      actions={
        <div className="flex items-center gap-3">
          <form onSubmit={e => { e.preventDefault(); setAppliedSearch(search); setPage(1); }} className="relative">
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--nm-faint)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…" className="nm-input"
              style={{ paddingLeft: 34, width: 220, borderRadius: 999, padding: '9px 14px 9px 34px', fontSize: 13.5 }} />
          </form>
          <button className="nm-btn-secondary" style={{ fontSize: 13, padding: '9px 14px' }}>Export CSV</button>
        </div>
      }
    >
      {/* Status tabs */}
      <div className="nm-tabbar mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => { setActiveTab(t.value); setPage(1); }}
            className={`nm-tab${activeTab === t.value ? ' active' : ''}`}>{t.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={28} style={{ color: 'var(--nm-green)' }} className="animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} style={{ color: 'var(--nm-faint)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--nm-muted)', fontSize: 14 }}>No {activeTab ? activeTab.replace(/_/g, ' ') : ''} orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(o => {
            const inEscrow = ['paid','confirmed','shipped','in_transit'].includes(o.status ?? '');
            const img = Array.isArray((o as unknown as Record<string,unknown>).images) ? ((o as unknown as Record<string,unknown>).images as string[])[0] : null;
            return (
              <div key={o.id} onClick={() => router.push(`/orders/${o.id}`)}
                className="nm-card flex items-center gap-4 cursor-pointer" style={{ padding: '16px 20px' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(40,31,18,.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
                {/* Thumbnail */}
                <div className="flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--nm-panel)' }}>
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package size={22} style={{ color: 'var(--nm-faint)' }} />}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="disp" style={{ fontSize: 14, fontWeight: 700, color: 'var(--nm-ink)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {String((o as unknown as Record<string,unknown>).listing_title ?? `Order ${o.order_number ?? o.id?.slice(0,8)}`)}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--nm-muted)', margin: 0 }}>
                    #{o.order_number ?? o.id?.slice(0,8)} · Qty {o.quantity} · ordered {timeAgo(o.created_at ?? '')}
                  </p>
                </div>
                {/* Escrow chip */}
                {inEscrow && <span className="nm-pill flex-shrink-0" style={{ color: 'var(--nm-info)', background: 'var(--nm-info-soft)', fontSize: 11 }}>In escrow</span>}
                {/* Amount */}
                <div className="flex-shrink-0 text-right">
                  <p className="num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--nm-ink)', margin: 0 }}>{inr(Number(o.total_amount ?? 0))}</p>
                  <Badge status={o.status ?? 'Pending'} />
                </div>
                <ChevronRight size={18} style={{ color: 'var(--nm-faint)', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="nm-btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>‹</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className="num flex items-center justify-center"
              style={{ width: 38, height: 38, borderRadius: 10, fontSize: 13.5, fontWeight: 600, background: page === p ? 'var(--nm-green)' : 'var(--nm-card)', color: page === p ? '#fff' : 'var(--nm-ink)', border: `1px solid ${page === p ? 'var(--nm-green)' : 'var(--nm-line)'}`, cursor: 'pointer' }}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="nm-btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>›</button>
        </div>
      )}
    </AppShell>
  );
}

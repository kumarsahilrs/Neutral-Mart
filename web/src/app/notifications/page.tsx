'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, Loader2, CheckCheck, Package, AlertTriangle, Wallet,
  LayoutDashboard, ShoppingBag, Heart, Gift, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/ui';
import { type NavItem } from '@/components/ui/Sidebar';
import { notificationsApi, type Notification } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

const NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard', icon: LayoutDashboard },
  { label: 'Browse lots', href: '/listings',  icon: ShoppingBag },
  { label: 'Orders',      href: '/orders',    icon: Package },
  { label: 'Watchlist',   href: '/watchlist', icon: Heart },
  { label: 'Referral',    href: '/referral',  icon: Gift },
  { label: 'Profile',     href: '/profile',   icon: User },
];

const sidebarFooter = (
  <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
    <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.65)', margin: 0, lineHeight: 1.4 }}>🛡 Escrow protected — every order is held safe until you confirm delivery.</p>
  </div>
);

const PAGE_SIZE = 50;

const TYPE_TABS = [
  { key: '', label: 'All' },
  { key: 'order', label: 'Orders' },
  { key: 'payment', label: 'Payments' },
  { key: 'dispute', label: 'Disputes' },
  { key: 'system', label: 'System' },
];

const TYPE_CONFIG: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  order:   { icon: Package,        bg: 'var(--nm-green-soft)', color: 'var(--nm-green)' },
  payment: { icon: Wallet,         bg: 'var(--nm-gold-soft)',  color: 'var(--nm-gold-ink)' },
  dispute: { icon: AlertTriangle,  bg: 'var(--nm-red-soft)',   color: 'var(--nm-red)' },
  listing: { icon: Package,        bg: 'var(--nm-gold-soft)',  color: 'var(--nm-gold-ink)' },
  system:  { icon: Bell,           bg: 'var(--nm-info-soft)',  color: 'var(--nm-info)' },
};

function timeAgo(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => { if (!isAuthenticated()) router.replace('/login'); }, [router]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', activeType, page],
    queryFn: () => notificationsApi.getNotifications({ type: activeType || undefined, page, limit: PAGE_SIZE }),
    select: (res) => {
      const payload = res.data as unknown as
        | { data: Notification[] | { rows: Notification[]; total: number }; total?: number }
        | Notification[];
      if (Array.isArray(payload)) return { notifications: payload, total: payload.length };
      const d = (payload as { data: Notification[] | { rows: Notification[]; total: number }; total?: number }).data;
      if (Array.isArray(d)) return { notifications: d, total: (payload as { total?: number }).total ?? d.length };
      if (d && 'rows' in d) return { notifications: d.rows, total: d.total };
      return { notifications: [], total: 0 };
    },
    enabled: isAuthenticated(),
    refetchOnWindowFocus: false,
  });

  const allNotifications: Notification[] = data?.notifications ?? [];

  const sorted = [...allNotifications].sort((a, b) => {
    const aRead = a.is_read || readIds.has(a.id);
    const bRead = b.is_read || readIds.has(b.id);
    if (aRead !== bRead) return aRead ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const unreadCount = sorted.filter((n) => !n.is_read && !readIds.has(n.id)).length;

  async function handleMarkRead(notification: Notification) {
    if (notification.is_read || readIds.has(notification.id)) {
      const link = notification.data?.link;
      if (link) router.push(link);
      return;
    }
    setReadIds((prev) => new Set([...prev, notification.id]));
    try {
      await notificationsApi.markRead(notification.id);
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    } catch {
      setReadIds((prev) => { const next = new Set(prev); next.delete(notification.id); return next; });
    }
    const link = notification.data?.link;
    if (link) router.push(link);
  }

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    try {
      await notificationsApi.markAllRead();
      setReadIds((prev) => new Set([...prev, ...allNotifications.map((n) => n.id)]));
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success('All notifications marked as read');
      refetch();
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAllRead(false);
    }
  }

  return (
    <AppShell
      navItems={NAV} brandSub="Buyer Portal" sidebarFooter={sidebarFooter}
      title={unreadCount > 0 ? `${unreadCount} unread` : 'Notifications'}
      subtitle="platform alerts"
      actions={
        unreadCount > 0 ? (
          <button onClick={handleMarkAllRead} disabled={markingAllRead} className="nm-btn-secondary" style={{ fontSize: 13, padding: '9px 14px' }}>
            {markingAllRead ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />} Mark all read
          </button>
        ) : undefined
      }
    >
      <div style={{ maxWidth: 760 }}>
        {/* Tabs */}
        <div className="nm-tabbar mb-5 overflow-x-auto pb-1">
          {TYPE_TABS.map((tab) => (
            <button key={tab.key} onClick={() => { setActiveType(tab.key); setPage(1); }}
              className={`nm-tab${activeType === tab.key ? ' active' : ''}`}>{tab.label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--nm-green)' }} /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={48} style={{ color: 'var(--nm-faint)', margin: '0 auto 12px' }} />
            <h3 className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--nm-ink)', marginBottom: 4 }}>
              {activeType ? `No ${activeType} notifications` : 'No notifications yet'}
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--nm-muted)' }}>{activeType ? 'Try a different filter' : "You're all caught up!"}</p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 10 }}>
            {sorted.map((notification) => {
              const isRead = notification.is_read || readIds.has(notification.id);
              const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <div key={notification.id} onClick={() => handleMarkRead(notification)}
                  className="nm-card relative flex items-start gap-3.5 cursor-pointer"
                  style={{ padding: 16, background: isRead ? 'var(--nm-card)' : 'var(--nm-gold-soft)' }}>
                  {!isRead && <span className="absolute" style={{ top: 12, right: 12, width: 8, height: 8, borderRadius: 999, background: 'var(--nm-gold)' }} />}
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 11, background: cfg.bg }}>
                    <Icon size={19} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="disp" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>{notification.title}</p>
                      <span style={{ fontSize: 12, color: 'var(--nm-faint)', flexShrink: 0, whiteSpace: 'nowrap', marginRight: !isRead ? 14 : 0 }}>{timeAgo(notification.created_at)}</span>
                    </div>
                    <p className="line-clamp-2" style={{ fontSize: 13, color: 'var(--nm-muted)', margin: '4px 0 0', lineHeight: 1.45 }}>{notification.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && (data?.total ?? 0) > page * PAGE_SIZE && (
          <div className="text-center mt-6">
            <button onClick={() => setPage((p) => p + 1)} className="nm-btn-secondary">Load more</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

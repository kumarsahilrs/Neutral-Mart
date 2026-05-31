'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, Loader2, CheckCheck, Package, AlertTriangle, Tag, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { notificationsApi, type Notification } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

const PAGE_SIZE = 50;

const TYPE_TABS = [
  { key: '', label: 'All' },
  { key: 'order', label: 'Orders' },
  { key: 'dispute', label: 'Disputes' },
  { key: 'listing', label: 'Listings' },
  { key: 'system', label: 'System' },
];

const TYPE_CONFIG: Record<string, { icon: typeof Bell; bgColor: string; iconColor: string }> = {
  order: { icon: Package, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  dispute: { icon: AlertTriangle, bgColor: 'bg-red-100', iconColor: 'text-red-600' },
  listing: { icon: Tag, bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
  system: { icon: Settings, bgColor: 'bg-gray-100', iconColor: 'text-gray-500' },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', activeType, page],
    queryFn: () => notificationsApi.getNotifications({
      type: activeType || undefined,
      page,
      limit: PAGE_SIZE,
    }),
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

  // Sort: unread first, then by date desc
  const sorted = [...allNotifications].sort((a, b) => {
    const aRead = a.is_read || readIds.has(a.id);
    const bRead = b.is_read || readIds.has(b.id);
    if (aRead !== bRead) return aRead ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const unreadCount = sorted.filter((n) => !n.is_read && !readIds.has(n.id)).length;

  async function handleMarkRead(notification: Notification) {
    if (notification.is_read || readIds.has(notification.id)) {
      // Just navigate
      const link = notification.data?.link;
      if (link) router.push(link);
      return;
    }

    // Optimistically mark read
    setReadIds((prev) => new Set([...prev, notification.id]));

    try {
      await notificationsApi.markRead(notification.id);
      // Invalidate unread count badge in header
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    } catch {
      // Revert on error
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }

    const link = notification.data?.link;
    if (link) router.push(link);
  }

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    try {
      await notificationsApi.markAllRead();
      // Mark all in local state
      const allIds = allNotifications.map((n) => n.id);
      setReadIds((prev) => new Set([...prev, ...allIds]));
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-60 transition-colors"
            >
              {markingAllRead ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveType(tab.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeType === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {isLoading ? (
          <div className="card divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="card text-center py-16">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-600 mb-1">
              {activeType ? `No ${activeType} notifications` : 'No notifications yet'}
            </h3>
            <p className="text-sm text-gray-400">
              {activeType ? 'Try a different filter' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100 overflow-hidden">
            {sorted.map((notification) => {
              const isRead = notification.is_read || readIds.has(notification.id);
              const typeCfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;
              const TypeIcon = typeCfg.icon;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleMarkRead(notification)}
                  className={`flex items-start gap-4 px-4 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeCfg.bgColor}`}>
                    <TypeIcon className={`w-5 h-5 ${typeCfg.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    {!isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {!isLoading && (data?.total ?? 0) > page * PAGE_SIZE && (
          <div className="text-center mt-6">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary text-sm"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

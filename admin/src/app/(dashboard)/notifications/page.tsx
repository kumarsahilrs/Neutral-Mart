'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Megaphone, Search, Loader2, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/ui/AdminShell';
import { notificationsAdminApi } from '@/lib/api';

interface NotificationLog { id: string; type?: string; title: string; body: string; channel?: string; isRead?: boolean; sentAt?: string; userName?: string; userPhone?: string; }

const CHANNELS = ['', 'whatsapp', 'push', 'sms'];
const CH_LABELS: Record<string, string> = { '': 'All', whatsapp: 'WhatsApp', push: 'Push', sms: 'SMS' };
const TYPE_COLORS: Record<string, [string, string]> = {
  order: ['var(--nm-green)', 'var(--nm-green-soft)'],
  payment: ['var(--nm-gold-ink)', 'var(--nm-gold-soft)'],
  dispute: ['var(--nm-red)', 'var(--nm-red-soft)'],
  system: ['var(--nm-info)', 'var(--nm-info-soft)'],
  kyc: ['var(--nm-green)', 'var(--nm-green-soft)'],
};

function fmtDateTime(d: string) { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }

function BroadcastPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', message: '', channel: 'push', targetRole: '' });
  const [sent, setSent] = useState<{ queued: number; targetRole: string } | null>(null);

  const mut = useMutation({
    mutationFn: () => notificationsAdminApi.broadcast(form),
    onSuccess: (res) => { setSent((res.data as { data: typeof sent }).data); qc.invalidateQueries({ queryKey: ['admin-notification-logs'] }); },
    onError: () => toast.error('Broadcast failed'),
  });

  if (sent) return (
    <div className="text-center py-6">
      <CheckCircle2 size={40} style={{ color: 'var(--nm-green)', margin: '0 auto 12px' }} />
      <p className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--nm-ink)' }}>Broadcast queued!</p>
      <p style={{ fontSize: 13.5, color: 'var(--nm-muted)', marginTop: 4 }}>{sent.queued} notifications queued for {sent.targetRole === 'all' ? 'all users' : sent.targetRole + 's'}</p>
      <button onClick={onClose} className="nm-btn-secondary mt-4">Done</button>
    </div>
  );

  return (
    <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="flex flex-col gap-4">
      <div>
        <label className="nm-label">Title *</label>
        <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="nm-input" placeholder="e.g. Weekend Flash Sale" />
      </div>
      <div>
        <label className="nm-label">Message *</label>
        <textarea required rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          className="nm-input resize-none" placeholder="Enter broadcast message…" />
        <p style={{ fontSize: 11.5, color: 'var(--nm-faint)', textAlign: 'right', marginTop: 3 }}>{form.message.length}/500</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="nm-label">Channel</label>
          <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="nm-select">
            <option value="push">Push</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="all">All channels</option>
          </select>
        </div>
        <div>
          <label className="nm-label">Target</label>
          <select value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} className="nm-select">
            <option value="">All users</option><option value="buyer">Buyers only</option><option value="seller">Sellers only</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="nm-btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={!form.title || !form.message || mut.isPending} className="nm-btn-primary flex-1">
          {mut.isPending && <Loader2 size={14} className="animate-spin" />}
          <Megaphone size={14} /> Send broadcast
        </button>
      </div>
    </form>
  );
}

export default function NotificationsPage() {
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [channel, setChannel] = useState('');
  const [page, setPage] = useState(1);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notification-logs', channel, applied, page],
    queryFn: async () => {
      const p: Record<string, string | number> = { page, limit: 30 };
      if (channel) p.channel = channel;
      if (applied) p.search = applied;
      const res = await notificationsAdminApi.getLogs(p);
      const d = (res.data as { data?: { rows?: NotificationLog[]; total?: number } })?.data;
      return { rows: d?.rows ?? [], total: d?.total ?? 0 };
    },
  });

  const logs = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <AdminShell
      title={`${total > 0 ? `${total.toLocaleString('en-IN')} notifications` : 'Notifications'}`}
      subtitle="System notification centre"
      actions={
        <button onClick={() => setShowBroadcast(b => !b)} className="nm-btn-primary flex items-center gap-2" style={{ fontSize: 13 }}>
          <Megaphone size={14} /> Broadcast
        </button>
      }
    >
      {showBroadcast && (
        <div className="nm-card mb-5" style={{ padding: 24 }}>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={16} style={{ color: 'var(--nm-green)' }} />
            <h2 className="disp" style={{ fontSize: 15, fontWeight: 700, color: 'var(--nm-ink)' }}>Send Broadcast</h2>
            <button onClick={() => setShowBroadcast(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nm-muted)' }}><X size={16} /></button>
          </div>
          <BroadcastPanel onClose={() => setShowBroadcast(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); setApplied(search); setPage(1); }} className="relative">
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--nm-faint)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or message…"
            className="nm-input" style={{ paddingLeft: 30, width: 220, borderRadius: 999, padding: '8px 12px 8px 30px', fontSize: 13 }} />
        </form>
        <div className="nm-tabbar">
          {CHANNELS.map(c => (
            <button key={c} onClick={() => { setChannel(c); setPage(1); }}
              className={`nm-tab${channel === c ? ' active' : ''}`}>{CH_LABELS[c]}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--nm-green)' }} /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Bell size={40} style={{ color: 'var(--nm-faint)', margin: '0 auto 10px' }} />
          <p style={{ color: 'var(--nm-muted)', fontSize: 14 }}>No notifications found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map(log => {
            const [color, bg] = TYPE_COLORS[log.type ?? 'system'] ?? TYPE_COLORS.system;
            return (
              <div key={log.id} className="nm-card flex items-start gap-3" style={{ padding: '14px 18px' }}>
                <span className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 10, background: bg, color }}>
                  <Bell size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="disp" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>{log.title}</p>
                    {log.channel && <span className="nm-pill" style={{ fontSize: 10, color: 'var(--nm-muted)', background: 'var(--nm-panel)' }}>{log.channel}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--nm-muted)', margin: '3px 0 0', lineHeight: 1.4 }}>{log.body}</p>
                  {(log.userName || log.userPhone) && (
                    <p style={{ fontSize: 11.5, color: 'var(--nm-faint)', margin: '4px 0 0' }}>{log.userName} {log.userPhone}</p>
                  )}
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--nm-faint)', flexShrink: 0 }}>{fmtDateTime(log.sentAt ?? '')}</span>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="nm-btn-secondary" style={{ padding: '7px 12px', fontSize: 13 }}>‹</button>
          <span style={{ fontSize: 13, color: 'var(--nm-muted)' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="nm-btn-secondary" style={{ padding: '7px 12px', fontSize: 13 }}>›</button>
        </div>
      )}
    </AdminShell>
  );
}

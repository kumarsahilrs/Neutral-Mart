'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/ui/AdminShell';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { usersApi } from '@/lib/api';

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function initials(name: string) { return (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'; }

const TABS = [
  { label: 'All users', value: '' },
  { label: 'Buyers', value: 'buyer' },
  { label: 'Sellers', value: 'seller' },
];

const PAGE_SIZE = 20;

export default function UsersPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', role, applied, page],
    queryFn: async () => {
      const p: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (role) p.role = role;
      if (applied) p.search = applied;
      const res = await usersApi.getUsers(p);
      const d = (res.data as { data?: { rows?: unknown[]; total?: number } | unknown[] })?.data;
      if (Array.isArray(d)) return { rows: d, total: d.length };
      return { rows: (d as { rows?: unknown[] })?.rows ?? [], total: (d as { total?: number })?.total ?? 0 };
    },
  });

  const users = (data?.rows ?? []) as Record<string, unknown>[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleSuspend(id: string, name: string) {
    const reason = window.prompt(`Reason for suspending ${name}:`);
    if (!reason) return;
    setActionLoading(id);
    try {
      await usersApi.suspendUser(id, reason);
      toast.success(`${name} suspended`);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch { toast.error('Failed to suspend user'); } finally { setActionLoading(null); }
  }

  async function handleActivate(id: string, name: string) {
    setActionLoading(id);
    try {
      await usersApi.activateUser(id);
      toast.success(`${name} activated`);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch { toast.error('Failed to activate user'); } finally { setActionLoading(null); }
  }

  return (
    <AdminShell
      title={`${total.toLocaleString('en-IN')} users`}
      actions={
        <form onSubmit={e => { e.preventDefault(); setApplied(search); setPage(1); }} className="relative">
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--nm-faint)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone…"
            className="nm-input" style={{ paddingLeft: 32, width: 240, borderRadius: 999, padding: '9px 14px 9px 32px', fontSize: 13 }} />
        </form>
      }
    >
      <div className="nm-tabbar mb-5">
        {TABS.map(t => (
          <button key={t.value} onClick={() => { setRole(t.value); setPage(1); }}
            className={`nm-tab${role === t.value ? ' active' : ''}`}>{t.label}</button>
        ))}
      </div>

      <div className="nm-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--nm-green)' }} /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} style={{ color: 'var(--nm-faint)', margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--nm-muted)', fontSize: 14 }}>No users found</p>
          </div>
        ) : (
          <table className="nm-table">
            <thead><tr>
              <th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => {
                const name = String(u.full_name ?? u.fullName ?? u.name ?? '—');
                const isSeller = String(u.role) === 'seller';
                const suspended = String(u.status) === 'suspended';
                return (
                  <tr key={String(u.id)}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={initials(name)} size={32} />
                        <span className="disp" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--nm-ink)' }}>{name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--nm-muted)', fontFamily: 'monospace' }}>{String(u.phone ?? '—')}</td>
                    <td>
                      <span className="nm-pill" style={{
                        color: isSeller ? 'var(--nm-green)' : 'var(--nm-info)',
                        background: isSeller ? 'var(--nm-green-soft)' : 'var(--nm-info-soft)',
                        fontWeight: 700, fontSize: 11, textTransform: 'capitalize',
                      }}>{String(u.role ?? 'buyer')}</span>
                    </td>
                    <td><Badge status={String(u.status ?? 'Active')} /></td>
                    <td style={{ fontSize: 12.5, color: 'var(--nm-muted)' }}>{fmtDate(String(u.created_at ?? u.createdAt ?? ''))}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {suspended ? (
                          <button onClick={() => handleActivate(String(u.id), name)} disabled={actionLoading === String(u.id)}
                            className="nm-btn-soft" style={{ padding: '5px 10px', fontSize: 12 }}>Activate</button>
                        ) : (
                          <button onClick={() => handleSuspend(String(u.id), name)} disabled={actionLoading === String(u.id)}
                            className="nm-btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Suspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, X, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/ui/AdminShell';
import { auditLogApi } from '@/lib/api';

interface AuditEntry { id: string; timestamp: string; adminId: string; adminName: string; action: string; entityType: string; entityId: string; ipAddress: string; }

const ENTITY_TYPES = [
  { value: '', label: 'All types' },
  { value: 'listing', label: 'Listing' },
  { value: 'user', label: 'User' },
  { value: 'order', label: 'Order' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'category', label: 'Category' },
  { value: 'payout', label: 'Payout' },
];

const ENTITY_COLORS: Record<string, [string, string]> = {
  listing: ['var(--nm-info)', 'var(--nm-info-soft)'],
  user: ['#6d28d9', '#ede9fe'],
  order: ['var(--nm-green)', 'var(--nm-green-soft)'],
  dispute: ['var(--nm-red)', 'var(--nm-red-soft)'],
  category: ['var(--nm-gold-ink)', 'var(--nm-gold-soft)'],
  payout: ['var(--nm-green)', 'var(--nm-green-soft)'],
};

function fmtDateTime(d: string) { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

export default function AuditLogPage() {
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', entityType, dateFrom, dateTo, applied, page],
    queryFn: async () => {
      const p: Record<string, string | number> = { page, limit: 50 };
      if (entityType) p.entity_type = entityType;
      if (dateFrom) p.from = dateFrom;
      if (dateTo) p.to = dateTo;
      if (applied) p.search = applied;
      const res = await auditLogApi.getLog(p);
      const d = (res.data as { data?: { rows?: AuditEntry[]; total?: number } })?.data;
      return { rows: d?.rows ?? [], total: d?.total ?? 0 };
    },
  });

  const entries = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 50));

  async function handleExport() {
    setExportLoading(true);
    try {
      const p: Record<string, string> = {};
      if (entityType) p.entity_type = entityType;
      if (dateFrom) p.from = dateFrom;
      if (dateTo) p.to = dateTo;
      if (applied) p.search = applied;
      const res = await auditLogApi.exportCsv(p);
      const blob = new Blob([res.data as BlobPart], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `audit-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); } finally { setExportLoading(false); }
  }

  const hasFilters = entityType || dateFrom || dateTo || applied;

  return (
    <AdminShell title="Audit log" subtitle="Immutable record of all admin actions" actions={
      <div className="flex items-center gap-3">
        {hasFilters && (
          <button onClick={() => { setEntityType(''); setDateFrom(''); setDateTo(''); setApplied(''); setSearch(''); setPage(1); }}
            className="nm-btn-secondary flex items-center gap-1.5" style={{ fontSize: 13, padding: '8px 12px' }}>
            <X size={13} /> Clear filters
          </button>
        )}
        <button onClick={handleExport} disabled={exportLoading} className="nm-btn-secondary flex items-center gap-2" style={{ fontSize: 13 }}>
          {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export CSV
        </button>
      </div>
    }>
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <form onSubmit={e => { e.preventDefault(); setApplied(search); setPage(1); }} className="relative">
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--nm-faint)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search action or admin…"
            className="nm-input" style={{ paddingLeft: 30, width: 220, borderRadius: 999, padding: '8px 12px 8px 30px', fontSize: 13 }} />
        </form>
        <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}
          className="nm-select" style={{ width: 140, fontSize: 13 }}>
          {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="nm-input" style={{ width: 150, fontSize: 13 }} />
        <span style={{ fontSize: 12, color: 'var(--nm-muted)' }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="nm-input" style={{ width: 150, fontSize: 13 }} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--nm-green)' }} /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={40} style={{ color: 'var(--nm-faint)', margin: '0 auto 10px' }} />
          <p style={{ color: 'var(--nm-muted)', fontSize: 14 }}>No audit entries found</p>
        </div>
      ) : (
        <div className="nm-card overflow-hidden">
          {entries.map((e, i) => {
            const [color, bg] = ENTITY_COLORS[e.entityType] ?? ['var(--nm-muted)', 'var(--nm-panel)'];
            return (
              <div key={e.id} className="flex items-center gap-4" style={{ padding: '13px 20px', borderBottom: i < entries.length - 1 ? '1px solid var(--nm-line-soft)' : 'none' }}>
                {/* Icon tile */}
                <span className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, borderRadius: 8, background: bg, color, fontSize: 14 }}>
                  {(e.entityType ?? '?').charAt(0).toUpperCase()}
                </span>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13.5, color: 'var(--nm-ink)', margin: 0 }}>
                    <strong className="disp" style={{ fontWeight: 700 }}>{e.adminName ?? 'Admin'}</strong>
                    {' · '}{String(e.action ?? '').replace(/_/g, ' ')}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--nm-muted)', margin: '2px 0 0' }}>
                    {e.entityType} · ID {String(e.entityId ?? '').slice(0, 8)}
                    {e.ipAddress ? ` · ${e.ipAddress}` : ''}
                  </p>
                </div>
                <span style={{ fontSize: 12, color: 'var(--nm-faint)', flexShrink: 0 }}>{fmtDateTime(e.timestamp ?? '')}</span>
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

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  RefreshCw,
  Search,
  Download,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminOption {
  id: string;
  name: string;
}

interface AuditEntry extends Record<string, unknown> {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string;
}

interface AuditLogResponse {
  rows: AuditEntry[];
  total: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const auditApi = {
  getLog: (params: Record<string, string | number>) =>
    api.get('/admin/audit-log', { params }),
  getAdmins: () => api.get('/admin/audit-log/admins'),
  exportCsv: (params: Record<string, string>) =>
    api.get('/admin/audit-log/export-csv', { params, responseType: 'blob' }),
};

// ─── Entity type options ──────────────────────────────────────────────────────

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'listing', label: 'Listing' },
  { value: 'user', label: 'User' },
  { value: 'order', label: 'Order' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'category', label: 'Category' },
  { value: 'payout', label: 'Payout' },
];

const ENTITY_TYPE_COLORS: Record<string, string> = {
  listing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  user: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  order: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  dispute: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  category: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  payout: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
};

function entityLink(type: string, id: string): string {
  const map: Record<string, string> = {
    listing: `/inventory`,
    user: `/users`,
    order: `/transactions`,
    dispute: `/disputes`,
    category: `/categories`,
    payout: `/payouts`,
  };
  const base = map[type] ?? '/';
  return `${base}?id=${id}`;
}

// ─── JSON Diff Toggle ─────────────────────────────────────────────────────────

function JsonDiff({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);

  if (!before && !after) {
    return <span className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">—</span>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-nm-primary font-medium hover:underline"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        View
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {before !== null && (
            <div>
              <p className="text-[10px] font-semibold text-nm-text-muted dark:text-nm-text-dark-muted mb-1 uppercase tracking-wide">Before</p>
              <pre className="text-[10px] bg-gray-50 dark:bg-gray-800 border border-nm-border dark:border-nm-border-dark rounded p-2 overflow-x-auto max-h-36 scrollbar-thin text-nm-text dark:text-nm-text-dark whitespace-pre-wrap break-words">
                {JSON.stringify(before, null, 2)}
              </pre>
            </div>
          )}
          {after !== null && (
            <div>
              <p className="text-[10px] font-semibold text-nm-text-muted dark:text-nm-text-dark-muted mb-1 uppercase tracking-wide">After</p>
              <pre className="text-[10px] bg-gray-50 dark:bg-gray-800 border border-nm-border dark:border-nm-border-dark rounded p-2 overflow-x-auto max-h-36 scrollbar-thin text-nm-text dark:text-nm-text-dark whitespace-pre-wrap break-words">
                {JSON.stringify(after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const [adminFilter, setAdminFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  const queryParams: Record<string, string | number> = { page, limit: PAGE_SIZE };
  if (adminFilter) queryParams.admin_id = adminFilter;
  if (entityTypeFilter) queryParams.entity_type = entityTypeFilter;
  if (dateFrom) queryParams.from = dateFrom;
  if (dateTo) queryParams.to = dateTo;
  if (search) queryParams.search = search;

  const { data, isLoading, refetch } = useQuery<AuditLogResponse>({
    queryKey: ['audit-log', page, adminFilter, entityTypeFilter, dateFrom, dateTo, search],
    queryFn: async () => {
      const res = await auditApi.getLog(queryParams);
      return res.data?.data ?? { rows: [], total: 0 };
    },
    retry: 1,
  });

  const { data: adminsData } = useQuery<AdminOption[]>({
    queryKey: ['audit-admins'],
    queryFn: async () => {
      const res = await auditApi.getAdmins();
      return res.data?.data ?? [];
    },
    retry: 1,
  });

  const entries = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const admins = adminsData ?? [];

  async function handleExportCsv() {
    setExportLoading(true);
    try {
      const params: Record<string, string> = {};
      if (adminFilter) params.admin_id = adminFilter;
      if (entityTypeFilter) params.entity_type = entityTypeFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (search) params.search = search;

      const res = await auditApi.exportCsv(params);
      const blob = new Blob([res.data as BlobPart], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Export failed — please try again');
    } finally {
      setExportLoading(false);
    }
  }

  function clearFilters() {
    setAdminFilter('');
    setEntityTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setSearchInput('');
    setPage(1);
  }

  const hasFilters = adminFilter || entityTypeFilter || dateFrom || dateTo || search;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nm-text dark:text-nm-text-dark">Audit Log</h1>
          <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted mt-0.5">
            Immutable record of all admin actions — read only
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={exportLoading}
            className="nm-btn-secondary flex items-center gap-2 text-sm"
          >
            {exportLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-nm-text-muted border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Export CSV
          </button>
          <button onClick={() => refetch()} className="nm-btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Admin filter */}
        <div className="relative">
          <select
            value={adminFilter}
            onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
            className="appearance-none border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg pl-4 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark min-w-[160px]"
          >
            <option value="">All Admins</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nm-text-muted pointer-events-none" />
        </div>

        {/* Entity type filter */}
        <div className="relative">
          <select
            value={entityTypeFilter}
            onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
            className="appearance-none border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg pl-4 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark"
          >
            {ENTITY_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nm-text-muted pointer-events-none" />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark"
          />
          <span className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark"
          />
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1); }}
          className="flex gap-2 flex-1 min-w-[180px]"
        >
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nm-text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search actions, entities..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark placeholder:text-nm-text-muted"
            />
          </div>
          <button type="submit" className="nm-btn-primary text-sm px-4">Search</button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="nm-btn-secondary text-sm px-3"
            >
              <X size={13} />
            </button>
          )}
        </form>

        {hasFilters && (
          <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium">
            Clear all filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="nm-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-nm-border dark:border-nm-border-dark">
                {[
                  'Timestamp', 'Admin', 'Action', 'Entity Type',
                  'Entity ID', 'Before / After', 'IP Address',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-nm-border dark:divide-nm-border-dark">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <ClipboardList size={36} className="mx-auto text-nm-text-muted dark:text-nm-text-dark-muted mb-3" />
                    <p className="text-nm-text-muted dark:text-nm-text-dark-muted text-sm">
                      {hasFilters ? 'No audit entries match your filters.' : 'No audit log entries found.'}
                    </p>
                    {hasFilters && (
                      <button onClick={clearFilters} className="mt-3 nm-btn-secondary text-sm">
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-nm-text-muted dark:text-nm-text-dark-muted whitespace-nowrap font-mono">
                      {new Date(entry.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      {new Date(entry.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-nm-text dark:text-nm-text-dark">{entry.adminName}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <span className="text-sm text-nm-text dark:text-nm-text-dark">{entry.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          ENTITY_TYPE_COLORS[entry.entityType] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {entry.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={entityLink(entry.entityType, entry.entityId)}
                        className="font-mono text-xs text-nm-primary hover:underline"
                      >
                        {entry.entityId}
                      </a>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <JsonDiff before={entry.before} after={entry.after} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-nm-text-muted dark:text-nm-text-dark-muted whitespace-nowrap">
                      {entry.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-nm-border dark:border-nm-border-dark">
            <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
              Showing{' '}
              <span className="font-semibold text-nm-text dark:text-nm-text-dark">
                {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}
              </span>{' '}
              of <span className="font-semibold text-nm-text dark:text-nm-text-dark">{total}</span> entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-nm-border dark:border-nm-border-dark disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-nm-text dark:text-nm-text-dark"
              >
                Previous
              </button>
              <span className="px-3 text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-nm-border dark:border-nm-border-dark disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-nm-text dark:text-nm-text-dark"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

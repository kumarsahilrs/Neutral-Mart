'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  IndianRupee,
  RefreshCw,
  Search,
  Loader2,
  Banknote,
  Clock,
  CheckCircle,
  X,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payout extends Record<string, unknown> {
  id: string;
  payoutId: string;
  sellerName: string;
  orderNumber: string;
  grossAmount: number;
  commission: number;
  gstOnCommission: number;
  tcs: number;
  netPayout: number;
  scheduledDate: string | null;
  status: 'pending' | 'scheduled' | 'on_hold' | 'processed' | 'failed';
}

interface PayoutsResponse {
  rows: Payout[];
  total: number;
  totalNetPayout: number;
}

interface PayoutStatsData {
  totalPending: number;
  payoutsThisWeek: number;
  onHoldCount: number;
  processedTodayCount: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const payoutsApi = {
  getPayouts: (params: Record<string, string | number>) =>
    api.get('/admin/payouts', { params }),
  getStats: () => api.get('/admin/payouts/stats'),
  approve: (id: string) => api.post(`/admin/payouts/${id}/approve`),
  hold: (id: string, reason: string) => api.post(`/admin/payouts/${id}/hold`, { reason }),
  release: (id: string) => api.post(`/admin/payouts/${id}/release`),
  process: (id: string) => api.post(`/admin/payouts/${id}/process`),
  bulkApprove: (ids: string[]) => api.post('/admin/payouts/bulk-approve', { ids }),
  bulkHold: (ids: string[], reason: string) => api.post('/admin/payouts/bulk-hold', { ids, reason }),
};

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Failed' },
];

// ─── Hold Modal ───────────────────────────────────────────────────────────────

interface HoldModalProps {
  mode: 'single' | 'bulk';
  count: number;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}

function HoldModal({ mode, count, onConfirm, onClose, loading }: HoldModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[440px] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nm-border dark:border-nm-border-dark">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <h2 className="text-base font-bold text-nm-text dark:text-nm-text-dark">
              Hold {mode === 'bulk' ? `${count} Payouts` : 'Payout'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted">
            Provide a reason for placing {mode === 'bulk' ? 'these payouts' : 'this payout'} on hold.
            The seller will be notified.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for hold..."
            rows={3}
            className="w-full border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark placeholder:text-nm-text-muted resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-nm-border dark:border-nm-border-dark">
          <button onClick={onClose} className="nm-btn-secondary text-sm px-4">Cancel</button>
          <button
            onClick={() => {
              if (!reason.trim()) { toast.error('Please provide a reason'); return; }
              onConfirm(reason);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Confirm Hold
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Currency formatter ───────────────────────────────────────────────────────

function fmtINR(val: number): string {
  return val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function PayoutsPage() {
  const queryClient = useQueryClient();

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Hold modal
  const [holdModal, setHoldModal] = useState<{ mode: 'single'; id: string } | { mode: 'bulk' } | null>(null);

  const queryParams: Record<string, string | number> = { page, limit: PAGE_SIZE };
  if (statusFilter) queryParams.status = statusFilter;
  if (search) queryParams.search = search;
  if (dateFrom) queryParams.from = dateFrom;
  if (dateTo) queryParams.to = dateTo;

  const { data, isLoading, refetch } = useQuery<PayoutsResponse>({
    queryKey: ['payouts', page, statusFilter, search, dateFrom, dateTo],
    queryFn: async () => {
      const res = await payoutsApi.getPayouts(queryParams);
      return res.data?.data ?? { rows: [], total: 0, totalNetPayout: 0 };
    },
    retry: 1,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<PayoutStatsData>({
    queryKey: ['payout-stats'],
    queryFn: async () => {
      const res = await payoutsApi.getStats();
      return res.data?.data ?? { totalPending: 0, payoutsThisWeek: 0, onHoldCount: 0, processedTodayCount: 0 };
    },
    retry: 1,
  });

  const payouts = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalNetPayout = data?.totalNetPayout ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const allPageIds = payouts.map((p) => p.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));
  const someSelected = allPageIds.some((id) => selectedIds.includes(id)) && !allSelected;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allPageIds])));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ['payouts'] });
    queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
    setSelectedIds([]);
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await payoutsApi.approve(id);
      toast.success('Payout approved');
      refreshAll();
    } catch {
      toast.error('Failed to approve payout');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRelease(id: string) {
    setActionLoading(id);
    try {
      await payoutsApi.release(id);
      toast.success('Payout released');
      refreshAll();
    } catch {
      toast.error('Failed to release payout');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleProcess(id: string) {
    if (!confirm('Process this payout now? This will initiate the bank transfer.')) return;
    setActionLoading(id);
    try {
      await payoutsApi.process(id);
      toast.success('Payout processed');
      refreshAll();
    } catch {
      toast.error('Failed to process payout');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleHoldConfirm(reason: string) {
    if (!holdModal) return;
    const key = 'hold_action';
    setActionLoading(key);
    try {
      if (holdModal.mode === 'single') {
        await payoutsApi.hold(holdModal.id, reason);
        toast.success('Payout placed on hold');
      } else {
        await payoutsApi.bulkHold(selectedIds, reason);
        toast.success(`${selectedIds.length} payouts placed on hold`);
      }
      setHoldModal(null);
      refreshAll();
    } catch {
      toast.error('Hold action failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkApprove() {
    if (!confirm(`Approve ${selectedIds.length} selected payouts?`)) return;
    setActionLoading('bulk_approve');
    try {
      await payoutsApi.bulkApprove(selectedIds);
      toast.success(`${selectedIds.length} payouts approved`);
      refreshAll();
    } catch {
      toast.error('Bulk approve failed');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nm-text dark:text-nm-text-dark">Seller Payouts</h1>
          <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted mt-0.5">
            Review, approve, and manage seller payout disbursements
          </p>
        </div>
        <button onClick={() => refetch()} className="nm-btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Pending"
          value={`₹${fmtINR(statsData?.totalPending ?? 0)}`}
          loading={statsLoading}
          icon={<IndianRupee size={16} className="text-yellow-600" />}
          iconBg="bg-yellow-100 dark:bg-yellow-900/20"
        />
        <StatsCard
          title="Payouts This Week"
          value={`₹${fmtINR(statsData?.payoutsThisWeek ?? 0)}`}
          loading={statsLoading}
          icon={<Banknote size={16} className="text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
        />
        <StatsCard
          title="On Hold"
          value={statsData?.onHoldCount ?? '—'}
          loading={statsLoading}
          icon={<Clock size={16} className="text-orange-500" />}
          iconBg="bg-orange-100 dark:bg-orange-900/20"
        />
        <StatsCard
          title="Processed Today"
          value={statsData?.processedTodayCount ?? '—'}
          loading={statsLoading}
          icon={<CheckCircle size={16} className="text-green-600" />}
          iconBg="bg-green-100 dark:bg-green-900/20"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg pl-4 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nm-text-muted pointer-events-none" />
        </div>

        <form
          className="flex gap-2 flex-1 min-w-[180px]"
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1); }}
        >
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nm-text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Seller name or order #..."
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
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="nm-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-nm-border dark:border-nm-border-dark">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-nm-primary focus:ring-nm-primary"
                  />
                </th>
                {[
                  'Payout ID', 'Seller Name', 'Order #', 'Gross Amount',
                  'Commission', 'GST on Comm.', 'TCS', 'Net Payout (₹)',
                  'Scheduled Date', 'Status', 'Actions',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-nm-border dark:divide-nm-border-dark">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 12 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <Banknote size={36} className="mx-auto text-nm-text-muted dark:text-nm-text-dark-muted mb-3" />
                    <p className="text-nm-text-muted dark:text-nm-text-dark-muted text-sm">No payouts found</p>
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isActing = actionLoading === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(p.id)}
                          className="rounded border-gray-300 text-nm-primary focus:ring-nm-primary"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-nm-primary">{p.payoutId}</td>
                      <td className="px-4 py-3 text-nm-text dark:text-nm-text-dark font-medium">{p.sellerName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-nm-text dark:text-nm-text-dark">{p.orderNumber}</td>
                      <td className="px-4 py-3 text-nm-text dark:text-nm-text-dark">₹{fmtINR(p.grossAmount)}</td>
                      <td className="px-4 py-3 text-orange-600 dark:text-orange-400">-₹{fmtINR(p.commission)}</td>
                      <td className="px-4 py-3 text-orange-500 dark:text-orange-400">-₹{fmtINR(p.gstOnCommission)}</td>
                      <td className="px-4 py-3 text-orange-500 dark:text-orange-400">-₹{fmtINR(p.tcs)}</td>
                      <td className="px-4 py-3 font-bold text-nm-text dark:text-nm-text-dark">₹{fmtINR(p.netPayout)}</td>
                      <td className="px-4 py-3 text-xs text-nm-text-muted dark:text-nm-text-dark-muted whitespace-nowrap">
                        {p.scheduledDate
                          ? new Date(p.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {p.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(p.id)}
                                disabled={isActing}
                                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 disabled:opacity-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                              >
                                {isActing && actionLoading === p.id ? <Loader2 size={10} className="animate-spin" /> : null}
                                Approve
                              </button>
                              <button
                                onClick={() => setHoldModal({ mode: 'single', id: p.id })}
                                disabled={isActing}
                                className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 disabled:opacity-50 transition-colors whitespace-nowrap"
                              >
                                Hold
                              </button>
                            </>
                          )}
                          {p.status === 'on_hold' && (
                            <button
                              onClick={() => handleRelease(p.id)}
                              disabled={isActing}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              Release
                            </button>
                          )}
                          {(p.status === 'scheduled' || p.status === 'on_hold') && (
                            <button
                              onClick={() => handleProcess(p.id)}
                              disabled={isActing}
                              className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              Process Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {payouts.length > 0 && (
          <div className="px-4 py-3 border-t border-nm-border dark:border-nm-border-dark bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <span className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted">
              {total.toLocaleString('en-IN')} payout{total !== 1 ? 's' : ''} in view
            </span>
            <span className="text-sm font-bold text-nm-text dark:text-nm-text-dark">
              Total Net Payout: <span className="text-nm-primary">₹{fmtINR(totalNetPayout)}</span>
            </span>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-nm-border dark:border-nm-border-dark">
            <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
              Showing{' '}
              <span className="font-semibold text-nm-text dark:text-nm-text-dark">
                {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}
              </span>{' '}
              of <span className="font-semibold text-nm-text dark:text-nm-text-dark">{total}</span>
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

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-nm-border dark:border-nm-border-dark shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3 px-6 flex items-center gap-4">
          <span className="text-sm font-semibold text-nm-text dark:text-nm-text-dark shrink-0">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading === 'bulk_approve'}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'bulk_approve' && <Loader2 size={13} className="animate-spin" />}
              Approve {selectedIds.length} Selected
            </button>
            <button
              onClick={() => setHoldModal({ mode: 'bulk' })}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-sm font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30 disabled:opacity-50 transition-colors border border-orange-300 dark:border-orange-700"
            >
              Hold {selectedIds.length} Selected
            </button>
          </div>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hold Modal */}
      {holdModal && (
        <HoldModal
          mode={holdModal.mode}
          count={selectedIds.length}
          onConfirm={handleHoldConfirm}
          onClose={() => setHoldModal(null)}
          loading={actionLoading === 'hold_action'}
        />
      )}
    </div>
  );
}

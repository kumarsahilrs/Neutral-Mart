'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { RefreshCw, Package, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Column } from '@/components/ui/DataTable';
import DataTable from '@/components/ui/DataTable';

interface Listing extends Record<string, unknown> {
  id: string;
  title: string;
  sellerName: string;
  sector: string;
  askingPrice: number;
  status: string;
  viewsCount: number;
  daysListed: number;
  createdAt: string;
}

interface ListingsResponse {
  rows: Listing[];
  total: number;
  page: number;
  limit: number;
}

// ─── Age colour helper ────────────────────────────────────────────────────────

function AgeCell({ days }: { days: number }) {
  let cls = 'text-green-600 dark:text-green-400';
  if (days > 30) cls = 'text-red-600 dark:text-red-400';
  else if (days >= 15) cls = 'text-orange-500 dark:text-orange-400';
  return <span className={`text-sm font-medium ${cls}`}>{days}d</span>;
}

// ─── Change Price Modal ───────────────────────────────────────────────────────

interface ChangePriceModalProps {
  count: number;
  onConfirm: (price: number) => void;
  onClose: () => void;
  loading: boolean;
}

function ChangePriceModal({ count, onConfirm, onClose, loading }: ChangePriceModalProps) {
  const [priceInput, setPriceInput] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[380px] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nm-border dark:border-nm-border-dark">
          <h2 className="text-base font-bold text-nm-text dark:text-nm-text-dark">
            Change Price for {count} Listing{count !== 1 ? 's' : ''}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted">
            Enter the new asking price (₹) to apply to all selected listings.
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nm-text-muted text-sm font-medium">₹</span>
            <input
              type="number"
              min="1"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="0"
              className="w-full pl-7 pr-4 py-2.5 border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-nm-border dark:border-nm-border-dark">
          <button onClick={onClose} className="nm-btn-secondary text-sm px-4">Cancel</button>
          <button
            onClick={() => {
              const val = parseFloat(priceInput);
              if (!val || val <= 0) { toast.error('Enter a valid price greater than 0'); return; }
              onConfirm(val);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-nm-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Update Price
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk action modals
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const queryParams: Record<string, string | number> = { page, limit: PAGE_SIZE };
  if (search) queryParams.search = search;
  if (statusFilter) queryParams.status = statusFilter;

  const { data, isLoading, refetch } = useQuery<ListingsResponse>({
    queryKey: ['inventory-listings', page, search, statusFilter],
    queryFn: async () => {
      const res = await inventoryApi.getListings(queryParams);
      return res.data?.data ?? { rows: [], total: 0 };
    },
    retry: 1,
  });

  const listings = data?.rows ?? [];
  const total = data?.total ?? 0;

  function refreshAndClearSelection() {
    queryClient.invalidateQueries({ queryKey: ['inventory-listings'] });
    setSelectedIds([]);
  }

  async function handleFeature(id: string) {
    setActionLoading(id);
    try {
      await inventoryApi.featureListing(id);
      toast.success('Listing featured');
      queryClient.invalidateQueries({ queryKey: ['inventory-listings'] });
    } catch {
      toast.error('Failed to feature listing');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePause(id: string) {
    setActionLoading(id);
    try {
      await inventoryApi.pauseListing(id);
      toast.success('Listing paused');
      queryClient.invalidateQueries({ queryKey: ['inventory-listings'] });
    } catch {
      toast.error('Failed to pause listing');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelist(id: string) {
    if (!confirm('Delist this listing? This action is significant.')) return;
    setActionLoading(id);
    try {
      await inventoryApi.delistListing(id);
      toast.success('Listing delisted');
      queryClient.invalidateQueries({ queryKey: ['inventory-listings'] });
    } catch {
      toast.error('Failed to delist listing');
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Bulk actions ───────────────────────────────────────────────────────────

  async function handleBulkAction(action: 'feature' | 'pause' | 'delist') {
    if (action === 'delist') {
      if (!confirm(`Delist ${selectedIds.length} listings? This action is significant.`)) return;
    }
    setBulkActionLoading(true);
    try {
      await inventoryApi.bulkAction(selectedIds, action);
      toast.success(`${selectedIds.length} listings ${action}d`);
      refreshAndClearSelection();
    } catch {
      toast.error(`Bulk ${action} failed`);
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkChangePrice(newPrice: number) {
    setBulkActionLoading(true);
    try {
      await inventoryApi.bulkAction(selectedIds, 'change_price', { new_price: newPrice });
      toast.success(`Price updated for ${selectedIds.length} listings`);
      setShowPriceModal(false);
      refreshAndClearSelection();
    } catch {
      toast.error('Bulk price change failed');
    } finally {
      setBulkActionLoading(false);
    }
  }

  // ─── Columns ─────────────────────────────────────────────────────────────────

  const columns: Column<Listing>[] = [
    {
      key: 'title',
      header: 'Listing',
      render: (l) => (
        <div>
          <div className="font-medium text-nm-text dark:text-nm-text-dark text-sm">{l.title}</div>
          <div className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
            {l.sellerName} · {l.sector}
          </div>
        </div>
      ),
    },
    {
      key: 'askingPrice',
      header: 'Price',
      sortable: true,
      render: (l) => (
        <span className="font-semibold text-nm-primary">
          ₹{l.askingPrice.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: 'viewsCount',
      header: 'Views',
      sortable: true,
      render: (l) => (
        <span className="text-sm text-nm-text dark:text-nm-text-dark">{(l.viewsCount ?? 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'daysListed',
      header: 'Days Listed',
      sortable: true,
    },
    {
      key: 'age',
      header: 'Age',
      render: (l) => <AgeCell days={l.daysListed} />,
    },
    {
      key: 'actions',
      header: '',
      render: (l) => (
        <div className="flex gap-2 flex-wrap">
          {l.status !== 'featured' && l.status !== 'delisted' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleFeature(l.id); }}
              disabled={actionLoading === l.id}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 disabled:opacity-50 transition-colors"
            >
              Feature
            </button>
          )}
          {l.status !== 'paused' && l.status !== 'delisted' && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePause(l.id); }}
              disabled={actionLoading === l.id}
              className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 disabled:opacity-50 transition-colors"
            >
              Pause
            </button>
          )}
          {l.status !== 'delisted' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelist(l.id); }}
              disabled={actionLoading === l.id}
              className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50 transition-colors"
            >
              Delist
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={`p-6 space-y-6 ${selectedIds.length > 0 ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nm-text dark:text-nm-text-dark">Inventory</h1>
          <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted mt-0.5">
            Manage listings — feature, pause, or delist
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="nm-btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search listings or seller..."
          className="border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark placeholder:text-nm-text-muted"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="featured">Featured</option>
          <option value="paused">Paused</option>
          <option value="pending">Pending</option>
          <option value="delisted">Delisted</option>
        </select>
      </div>

      {/* Table */}
      {!isLoading && listings.length === 0 ? (
        <div className="nm-card p-16 text-center">
          <Package size={40} className="mx-auto text-nm-text-muted dark:text-nm-text-dark-muted mb-3" />
          <p className="text-nm-text-muted dark:text-nm-text-dark-muted text-sm">
            {search || statusFilter ? 'No listings match your filters.' : 'No listings found.'}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={listings}
          keyField="id"
          loading={isLoading}
          selectable
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          emptyMessage="No listings found."
          pagination={
            total > PAGE_SIZE
              ? { page, pageSize: PAGE_SIZE, total, onPageChange: setPage }
              : undefined
          }
        />
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-nm-border dark:border-nm-border-dark shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3 px-6 flex items-center gap-4">
          <span className="text-sm font-semibold text-nm-text dark:text-nm-text-dark shrink-0">
            {selectedIds.length} listing{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleBulkAction('feature')}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {bulkActionLoading && <Loader2 size={13} className="animate-spin" />}
              Feature All
            </button>
            <button
              onClick={() => handleBulkAction('pause')}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 text-sm font-medium rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 disabled:opacity-50 transition-colors border border-yellow-300 dark:border-yellow-700"
            >
              Pause All
            </button>
            <button
              onClick={() => handleBulkAction('delist')}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors border border-red-200 dark:border-red-800"
            >
              Delist All
            </button>
            <button
              onClick={() => setShowPriceModal(true)}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 text-sm font-medium rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50 transition-colors border border-purple-200 dark:border-purple-800"
            >
              Change Price
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

      {/* Change Price Modal */}
      {showPriceModal && (
        <ChangePriceModal
          count={selectedIds.length}
          onConfirm={handleBulkChangePrice}
          onClose={() => setShowPriceModal(false)}
          loading={bulkActionLoading}
        />
      )}
    </div>
  );
}

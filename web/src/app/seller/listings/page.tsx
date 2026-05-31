'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  MoreVertical,
  Edit,
  Pause,
  Play,
  Trash2,
  BarChart2,
  X,
  AlertTriangle,
  Eye,
  Bookmark,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────────────────
interface SellerListing {
  id: string;
  title: string;
  asking_price: number;
  status: string;
  images: string[];
  view_count: number;
  watchlist_count: number;
  created_at: string;
}

interface ListingPerformance {
  views_per_day: number;
  inquiries_count: number;
  conversion_pct: number;
  trend: number[];
}

interface ListingsResponse {
  data: SellerListing[];
  total: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'paused', label: 'Paused' },
  { value: 'sold', label: 'Sold' },
  { value: 'expired', label: 'Expired' },
  { value: 'flagged', label: 'Flagged' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_desc', label: 'Price High-Low' },
  { value: 'views_desc', label: 'Most Views' },
  { value: 'aging', label: 'Aging' },
];

const STATUS_BADGE: Record<string, string> = {
  live: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-blue-100 text-blue-700',
  expired: 'bg-gray-100 text-gray-600',
  flagged: 'bg-red-100 text-red-700',
  delisted: 'bg-gray-100 text-gray-500',
};

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ── Confirm Delist Modal ───────────────────────────────────────────────────────
function DelistModal({
  listing,
  onConfirm,
  onCancel,
  loading,
}: {
  listing: SellerListing;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Delist Listing?</h3>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delist <span className="font-semibold">"{listing.title}"</span>? This will remove it from the marketplace.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delist
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Price Modal ────────────────────────────────────────────────────────
function ChangePriceModal({
  count,
  onConfirm,
  onCancel,
  loading,
}: {
  count: number;
  onConfirm: (price: number) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [price, setPrice] = useState('');
  const [err, setErr] = useState('');

  function handleSubmit() {
    const n = Number(price);
    if (!price || isNaN(n) || n <= 0) {
      setErr('Enter a valid price greater than 0');
      return;
    }
    setErr('');
    onConfirm(n);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Change Price for {count} listing{count > 1 ? 's' : ''}
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Asking Price (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="1"
              className="input-field pl-7"
            />
          </div>
          {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Update Price
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Performance Row ────────────────────────────────────────────────────────────
function PerformanceRow({ listingId }: { listingId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['listing-performance', listingId],
    queryFn: () =>
      api.get<{ data: ListingPerformance }>(`/seller/listings/${listingId}/performance`),
    select: (res) => (res.data as unknown as { data: ListingPerformance })?.data ?? res.data,
    retry: 1,
  });

  if (isLoading) {
    return (
      <td colSpan={9} className="px-6 py-4 bg-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading performance data…
        </div>
      </td>
    );
  }

  const d: ListingPerformance = data ?? { views_per_day: 0, inquiries_count: 0, conversion_pct: 0, trend: [] };

  // Simple text-based sparkline
  const trend = d.trend ?? [];
  const maxVal = Math.max(...trend, 1);
  const bars = trend.slice(-10).map((v) => {
    const h = Math.round((v / maxVal) * 6);
    return '▁▂▃▄▅▆▇█'.charAt(Math.min(h, 7));
  });

  return (
    <td colSpan={9} className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
      <div className="flex flex-wrap items-center gap-8 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Views / Day</p>
          <p className="font-semibold text-gray-900">{d.views_per_day.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Inquiries</p>
          <p className="font-semibold text-gray-900">{d.inquiries_count}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Conversion</p>
          <p className="font-semibold text-gray-900">{d.conversion_pct.toFixed(1)}%</p>
        </div>
        {bars.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-0.5">View Trend (last 10d)</p>
            <p className="font-mono text-base text-indigo-600 tracking-widest leading-none">{bars.join('')}</p>
          </div>
        )}
      </div>
    </td>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SellerListingsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusTab, setStatusTab] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedPerf, setExpandedPerf] = useState<Set<string>>(new Set());

  const [delistTarget, setDelistTarget] = useState<SellerListing | null>(null);
  const [delistLoading, setDelistLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showChangePriceModal, setShowChangePriceModal] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 300);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-listings', debouncedSearch, statusTab, sortBy, page],
    queryFn: () =>
      api.get<ListingsResponse>('/seller/listings', {
        params: {
          search: debouncedSearch || undefined,
          status: statusTab || undefined,
          sort_by: sortBy,
          page,
          limit: PAGE_SIZE,
        },
      }),
    select: (res) => (res.data as unknown as { data: ListingsResponse })?.data ?? res.data,
    enabled: isAuthenticated(),
    placeholderData: (prev) => prev,
  });

  const listings: SellerListing[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Selection helpers
  const allSelected = listings.length > 0 && listings.every((l) => selectedIds.has(l.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(listings.map((l) => l.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Status update
  async function updateStatus(id: string, status: string) {
    setStatusLoading(id);
    try {
      await api.patch(`/seller/listings/${id}/status`, { status });
      toast.success(`Listing ${status === 'live' ? 'resumed' : status}`);
      qc.invalidateQueries({ queryKey: ['seller-listings'] });
    } catch {
      toast.error('Failed to update listing status');
    } finally {
      setStatusLoading(null);
    }
  }

  // Delist
  async function confirmDelist() {
    if (!delistTarget) return;
    setDelistLoading(true);
    try {
      await api.patch(`/seller/listings/${delistTarget.id}/status`, { status: 'delisted' });
      toast.success('Listing delisted');
      qc.invalidateQueries({ queryKey: ['seller-listings'] });
      setDelistTarget(null);
    } catch {
      toast.error('Failed to delist listing');
    } finally {
      setDelistLoading(false);
    }
  }

  // Bulk action
  async function bulkAction(action: 'pause' | 'unpause' | 'delist') {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      await api.patch('/seller/listings/bulk', { ids, action });
      toast.success(`${ids.length} listing${ids.length > 1 ? 's' : ''} ${action}d`);
      qc.invalidateQueries({ queryKey: ['seller-listings'] });
      setSelectedIds(new Set());
    } catch {
      toast.error('Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  }

  async function bulkChangePrice(newPrice: number) {
    const ids = Array.from(selectedIds);
    setBulkLoading(true);
    try {
      await api.patch('/seller/listings/bulk', { ids, action: 'change_price', new_price: newPrice });
      toast.success(`Price updated for ${ids.length} listing${ids.length > 1 ? 's' : ''}`);
      qc.invalidateQueries({ queryKey: ['seller-listings'] });
      setSelectedIds(new Set());
      setShowChangePriceModal(false);
    } catch {
      toast.error('Failed to update price');
    } finally {
      setBulkLoading(false);
    }
  }

  function togglePerf(id: string) {
    setExpandedPerf((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString('en-IN')} total listings</p>
        </div>
        <Link
          href="/seller/listings/new"
          className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Listing
        </Link>
      </div>

      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search listings by title…"
              className="input-field pl-9"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="input-field w-44"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusTab(tab.value); setPage(1); setSelectedIds(new Set()); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusTab === tab.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded-full w-14" />
                <div className="h-3 bg-gray-200 rounded w-10" />
                <div className="h-3 bg-gray-200 rounded w-10" />
                <div className="h-3 bg-gray-200 rounded w-10" />
                <div className="h-7 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-600 mb-1">No listings found</h3>
            <p className="text-xs text-gray-400 mb-4">
              {statusTab || debouncedSearch ? 'Try changing your filters.' : 'Add your first listing to get started.'}
            </p>
            <Link
              href="/seller/listings/new"
              className="inline-flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Listing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-primary-600"
                    />
                  </th>
                  <th className="px-4 py-3 w-12">Img</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Price</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Views</span>
                  </th>
                  <th className="text-left px-4 py-3">
                    <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />Saves</span>
                  </th>
                  <th className="text-left px-4 py-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Days</span>
                  </th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((listing) => {
                  const badgeClass = STATUS_BADGE[listing.status] ?? 'bg-gray-100 text-gray-600';
                  const isLive = listing.status === 'live';
                  const isPaused = listing.status === 'paused';
                  const actionLoading = statusLoading === listing.id;
                  const perfExpanded = expandedPerf.has(listing.id);

                  return (
                    <React.Fragment key={listing.id}>
                      <tr
                        className={`hover:bg-gray-50 transition-colors ${selectedIds.has(listing.id) ? 'bg-primary-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(listing.id)}
                            onChange={() => toggleOne(listing.id)}
                            className="rounded border-gray-300 text-primary-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {listing.images?.[0] ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                          <p className="text-xs text-gray-400">ID: {listing.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          ₹{listing.asking_price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${badgeClass}`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{(listing.view_count ?? 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-600">{(listing.watchlist_count ?? 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-600">{daysSince(listing.created_at)}d</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Link
                              href={`/seller/listings/${listing.id}/edit`}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Link>

                            {isLive && (
                              <button
                                onClick={() => updateStatus(listing.id, 'paused')}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors disabled:opacity-50"
                              >
                                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
                                Pause
                              </button>
                            )}

                            {isPaused && (
                              <button
                                onClick={() => updateStatus(listing.id, 'live')}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-green-100 hover:bg-green-200 text-green-700 transition-colors disabled:opacity-50"
                              >
                                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                Unpause
                              </button>
                            )}

                            {(isLive || isPaused) && (
                              <button
                                onClick={() => setDelistTarget(listing)}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delist
                              </button>
                            )}

                            <button
                              onClick={() => togglePerf(listing.id)}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                                perfExpanded
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              <BarChart2 className="w-3 h-3" />
                              Performance
                              {perfExpanded ? (
                                <X className="w-3 h-3" />
                              ) : (
                                <MoreVertical className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline performance row */}
                      {perfExpanded && (
                        <tr className="bg-indigo-50">
                          <PerformanceRow listingId={listing.id} />
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const pageNum = start + i;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  pageNum === page
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => bulkAction('pause')}
            disabled={bulkLoading}
            className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
            Pause {selectedIds.size} Selected
          </button>
          <button
            onClick={() => bulkAction('unpause')}
            disabled={bulkLoading}
            className="text-sm font-medium text-green-400 hover:text-green-300 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5" />
            Unpause {selectedIds.size}
          </button>
          <button
            onClick={() => setShowChangePriceModal(true)}
            disabled={bulkLoading}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            Change Price
          </button>
          <button
            onClick={() => bulkAction('delist')}
            disabled={bulkLoading}
            className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delist {selectedIds.size}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {delistTarget && (
        <DelistModal
          listing={delistTarget}
          onConfirm={confirmDelist}
          onCancel={() => setDelistTarget(null)}
          loading={delistLoading}
        />
      )}

      {showChangePriceModal && (
        <ChangePriceModal
          count={selectedIds.size}
          onConfirm={bulkChangePrice}
          onCancel={() => setShowChangePriceModal(false)}
          loading={bulkLoading}
        />
      )}

      {/* Warning if listing has age issue */}
      {listings.some((l) => daysSince(l.created_at) >= 30 && l.status === 'live') && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Some live listings are 30+ days old without a sale. Consider updating prices or descriptions.
        </div>
      )}
    </div>
  );
}

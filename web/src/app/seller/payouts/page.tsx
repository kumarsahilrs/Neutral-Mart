'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Download,
  Clock,
  CheckCircle,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PayoutSummary {
  pending_payout: number;
  expected_payout_date: string;
  bank_account_last4: string;
}

interface PayoutRecord {
  id: string;
  date: string;
  orders_count: number;
  gross_amount: number;
  commission: number;
  gst_on_commission: number;
  tcs: number;
  net_payout: number;
  status: string;
}

interface PayoutsResponse {
  summary: PayoutSummary;
  data: PayoutRecord[];
  total: number;
}

interface EscrowOrder {
  id: string;
  order_number: string;
  amount: number;
  escrow_status: string;
  expected_release_date: string;
  listing_title: string;
}

interface EscrowResponse {
  data: EscrowOrder[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function formatCurrency(v: number) {
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PAYOUT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: Clock },
};

const ESCROW_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  holding: { label: 'Holding', color: 'bg-yellow-100 text-yellow-700' },
  release_scheduled: { label: 'Release Scheduled', color: 'bg-blue-100 text-blue-700' },
  released: { label: 'Released', color: 'bg-green-100 text-green-700' },
};

// ── Skeleton ───────────────────────────────────────────────────────────────────
function PayoutsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-green-100 rounded-2xl" />
      <div className="card p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SellerPayoutsPage() {
  const [page, setPage] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  const { data: payoutsData, isLoading: payoutsLoading, error: payoutsError } = useQuery({
    queryKey: ['seller-payouts', page],
    queryFn: () =>
      api.get<{ data: PayoutsResponse }>('/seller/payouts', {
        params: { page, limit: PAGE_SIZE },
      }),
    select: (res) => (res.data as unknown as { data: PayoutsResponse })?.data ?? res.data,
    enabled: ready && isAuthenticated(),
    retry: 1,
  });

  const { data: escrowData, isLoading: escrowLoading } = useQuery({
    queryKey: ['seller-escrow'],
    queryFn: () =>
      api.get<{ data: EscrowResponse }>('/seller/escrow-status'),
    select: (res) => (res.data as unknown as { data: EscrowResponse })?.data ?? res.data,
    enabled: ready && isAuthenticated(),
    retry: 1,
  });

  useEffect(() => {
    if (payoutsError) toast.error('Failed to load payout data');
  }, [payoutsError]);

  async function downloadStatement(payoutId: string) {
    try {
      const res = await api.get(`/seller/payouts/${payoutId}/statement`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to download statement');
    }
  }

  if (!ready || payoutsLoading) return <PayoutsSkeleton />;

  const summary = payoutsData?.summary ?? { pending_payout: 0, expected_payout_date: '', bank_account_last4: '' };
  const payouts: PayoutRecord[] = payoutsData?.data ?? [];
  const total = payoutsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const escrowOrders: EscrowOrder[] = (escrowData as unknown as EscrowResponse)?.data ?? [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payouts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your earnings and payout schedule</p>
      </div>

      {/* Summary banner */}
      <div className="bg-green-600 rounded-2xl p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 opacity-90">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Pending Payout</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(summary.pending_payout)}</p>
          </div>

          <div className="space-y-2">
            {summary.expected_payout_date && (
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Calendar className="w-4 h-4" />
                <span>Expected by: <span className="font-semibold">{formatDate(summary.expected_payout_date)}</span></span>
              </div>
            )}
            {summary.bank_account_last4 && (
              <div className="flex items-center gap-2 text-sm opacity-90">
                <IndianRupee className="w-4 h-4" />
                <span>Bank account: ****{summary.bank_account_last4}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payout history table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Payout History</h2>
        </div>

        {payouts.length === 0 ? (
          <div className="text-center py-14">
            <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-600 mb-1">No payouts yet</h3>
            <p className="text-xs text-gray-400">Your payout history will appear here once payouts are processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Orders</th>
                  <th className="text-right px-4 py-3 font-medium">Gross (₹)</th>
                  <th className="text-right px-4 py-3 font-medium">Commission (₹)</th>
                  <th className="text-right px-4 py-3 font-medium">GST on Comm. (₹)</th>
                  <th className="text-right px-4 py-3 font-medium">TCS (₹)</th>
                  <th className="text-right px-4 py-3 font-medium">Net Payout (₹)</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((p) => {
                  const sc = PAYOUT_STATUS_CONFIG[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-600', icon: Clock };
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{formatDate(p.date)}</td>
                      <td className="px-4 py-4 text-right text-gray-600">{p.orders_count}</td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(p.gross_amount)}
                      </td>
                      <td className="px-4 py-4 text-right text-red-600">
                        −{formatCurrency(p.commission)}
                      </td>
                      <td className="px-4 py-4 text-right text-red-600">
                        −{formatCurrency(p.gst_on_commission)}
                      </td>
                      <td className="px-4 py-4 text-right text-red-600">
                        −{formatCurrency(p.tcs)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-green-700">
                        {formatCurrency(p.net_payout)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => downloadStatement(p.id)}
                          title="Download Statement"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!payoutsLoading && totalPages > 1 && (
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

      {/* Escrow Status */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Escrow Status</h2>
          <p className="text-xs text-gray-500 mt-0.5">Recent orders with escrow details</p>
        </div>

        {escrowLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : escrowOrders.length === 0 ? (
          <div className="text-center py-10">
            <IndianRupee className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No escrow orders to show</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="text-left px-6 py-3 font-medium">Order #</th>
                  <th className="text-left px-6 py-3 font-medium">Product</th>
                  <th className="text-right px-4 py-3 font-medium">Amount (₹)</th>
                  <th className="text-left px-4 py-3 font-medium">Escrow Stage</th>
                  <th className="text-left px-4 py-3 font-medium">Expected Release</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {escrowOrders.map((o) => {
                  const ec = ESCROW_STATUS_CONFIG[o.escrow_status] ?? { label: o.escrow_status, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary-600">
                        {o.order_number ?? o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-gray-700 max-w-[200px] truncate">{o.listing_title}</td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(o.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ec.color}`}>
                          {ec.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                        {o.expected_release_date ? formatDate(o.expected_release_date) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

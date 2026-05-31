'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Truck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShoppingCart,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────────────────
interface SellerOrder {
  id: string;
  order_number: string;
  buyer_name: string;
  buyer_business_name: string;
  buyer_phone: string;
  listing_title: string;
  quantity: number;
  unit: string;
  total_amount: number;
  subtotal: number;
  platform_commission: number;
  gst_amount: number;
  freight_amount: number;
  escrow_status: string;
  expected_escrow_release: string;
  status: string;
  awb_number?: string;
  carrier?: string;
  tracking_link?: string;
  created_at: string;
  dispute_reason?: string;
  dispute_description?: string;
  dispute_evidence?: string[];
  delivery_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface OrdersResponse {
  data: SellerOrder[];
  total: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'ready_to_ship', label: 'Ready to Ship' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  ready_to_ship: { label: 'Ready to Ship', color: 'bg-cyan-100 text-cyan-700', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: RefreshCw },
};

const ESCROW_CONFIG: Record<string, { label: string; color: string }> = {
  holding: { label: 'Holding', color: 'bg-yellow-100 text-yellow-700' },
  release_scheduled: { label: 'Release Scheduled', color: 'bg-blue-100 text-blue-700' },
  released: { label: 'Released', color: 'bg-green-100 text-green-700' },
};

const CARRIERS = ['Delhivery', 'BlueDart', 'DTDC', 'India Post', 'Ekart', 'Other'];

function formatCurrency(v: number) {
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Mark Shipped Modal ─────────────────────────────────────────────────────────
function MarkShippedModal({
  order,
  onClose,
}: {
  order: SellerOrder;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [awb, setAwb] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingLink, setTrackingLink] = useState('');
  const [errors, setErrors] = useState<{ awb?: string; carrier?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const errs: typeof errors = {};
    if (!awb.trim()) errs.awb = 'AWB number is required';
    if (!carrier) errs.carrier = 'Please select a carrier';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.patch(`/seller/orders/${order.id}/ship`, {
        awb_number: awb.trim(),
        carrier,
        tracking_link: trackingLink.trim() || undefined,
      });
      toast.success('Order marked as shipped');
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
      onClose();
    } catch {
      toast.error('Failed to mark order as shipped');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Mark as Shipped</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Order <span className="font-semibold text-gray-800">{order.order_number}</span> — {order.listing_title}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AWB Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={awb}
              onChange={(e) => { setAwb(e.target.value); setErrors((p) => ({ ...p, awb: undefined })); }}
              placeholder="e.g. 1234567890"
              className="input-field"
            />
            {errors.awb && <p className="text-xs text-red-500 mt-1">{errors.awb}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carrier <span className="text-red-500">*</span>
            </label>
            <select
              value={carrier}
              onChange={(e) => { setCarrier(e.target.value); setErrors((p) => ({ ...p, carrier: undefined })); }}
              className="input-field appearance-none"
            >
              <option value="">Select carrier…</option>
              {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.carrier && <p className="text-xs text-red-500 mt-1">{errors.carrier}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tracking Link <span className="text-gray-400 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={trackingLink}
              onChange={(e) => setTrackingLink(e.target.value)}
              placeholder="https://track.example.com/…"
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Mark Shipped
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Expanded Row Detail ────────────────────────────────────────────────────────
function OrderDetail({ order }: { order: SellerOrder }) {
  const escrowCfg = ESCROW_CONFIG[order.escrow_status] ?? { label: order.escrow_status, color: 'bg-gray-100 text-gray-600' };

  return (
    <td colSpan={9} className="px-6 py-5 bg-gray-50 border-b border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        {/* Buyer */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Buyer</p>
          <p className="font-semibold text-gray-900">{order.buyer_business_name || order.buyer_name}</p>
          <p className="text-gray-600">{order.buyer_name}</p>
          <p className="text-gray-500 text-xs mt-1">{order.buyer_phone}</p>
          {order.delivery_address && (
            <div className="mt-2 text-xs text-gray-500">
              <p>{order.delivery_address.line1}</p>
              {order.delivery_address.line2 && <p>{order.delivery_address.line2}</p>}
              <p>{order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}</p>
            </div>
          )}
        </div>

        {/* Amount breakdown */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amount Breakdown</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Commission</span>
              <span className="font-medium text-red-600">−{formatCurrency(order.platform_commission ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST</span>
              <span className="font-medium text-red-600">−{formatCurrency(order.gst_amount ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Freight</span>
              <span className="font-medium text-red-600">−{formatCurrency(order.freight_amount ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
              <span className="font-semibold text-gray-700">Total Payout</span>
              <span className="font-bold text-green-700">{formatCurrency(order.total_amount ?? 0)}</span>
            </div>
          </div>

          {/* Escrow */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Escrow Status</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${escrowCfg.color}`}>
              {escrowCfg.label}
            </span>
            {order.expected_escrow_release && (
              <p className="text-xs text-gray-400 mt-1">
                Expected release: {formatDate(order.expected_escrow_release)}
              </p>
            )}
          </div>
        </div>

        {/* Shipping / Dispute */}
        <div>
          {order.awb_number ? (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shipping Info</p>
              <p className="font-medium text-gray-800">{order.carrier}</p>
              <p className="text-gray-600 text-xs">AWB: {order.awb_number}</p>
              {order.tracking_link && (
                <a
                  href={order.tracking_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                >
                  Track Package →
                </a>
              )}
            </>
          ) : order.status === 'disputed' && order.dispute_reason ? (
            <>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Dispute Details</p>
              <p className="font-medium text-gray-800">{order.dispute_reason}</p>
              <p className="text-gray-500 text-xs mt-1">{order.dispute_description}</p>
              {order.dispute_evidence && order.dispute_evidence.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Evidence ({order.dispute_evidence.length} files)</p>
                  {order.dispute_evidence.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline block"
                    >
                      Evidence {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">No shipping info yet</p>
          )}
        </div>
      </div>
    </td>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SellerOrdersPage() {
  const [statusTab, setStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [shipModal, setShipModal] = useState<SellerOrder | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', statusTab, page],
    queryFn: () =>
      api.get<OrdersResponse>('/orders/my/seller', {
        params: {
          status: statusTab || undefined,
          page,
          limit: PAGE_SIZE,
        },
      }),
    select: (res) => (res.data as unknown as { data: OrdersResponse })?.data ?? res.data,
    enabled: isAuthenticated(),
    placeholderData: (prev) => prev,
  });

  const orders: SellerOrder[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleRow(id: string) {
    setExpandedRow((prev) => (prev === id ? null : id));
  }

  async function downloadInvoice(orderId: string) {
    try {
      const res = await api.get(`/invoices/${orderId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to download invoice');
    }
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString('en-IN')} total orders</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusTab(tab.value); setPage(1); setExpandedRow(null); }}
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

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-32" />
                <div className="flex-1 h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded-full w-20" />
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-7 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-600 mb-1">No orders found</h3>
            <p className="text-xs text-gray-400">
              {statusTab ? 'No orders with this status.' : 'Orders will appear here once buyers purchase your listings.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium">Order #</th>
                  <th className="text-left px-6 py-3 font-medium">Buyer</th>
                  <th className="text-left px-6 py-3 font-medium">Product</th>
                  <th className="text-left px-6 py-3 font-medium">Qty</th>
                  <th className="text-left px-6 py-3 font-medium">Amount</th>
                  <th className="text-left px-6 py-3 font-medium">Escrow</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const sc = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600', icon: Clock };
                  const StatusIcon = sc.icon;
                  const escrowCfg = ESCROW_CONFIG[order.escrow_status] ?? { label: order.escrow_status, color: 'bg-gray-100 text-gray-600' };
                  const isExpanded = expandedRow === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                        onClick={() => toggleRow(order.id)}
                      >
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-primary-600 whitespace-nowrap">
                          {order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800 max-w-[120px] truncate">
                          {order.buyer_business_name || order.buyer_name}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-[180px] truncate">
                          {order.listing_title}
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                          {order.quantity?.toLocaleString('en-IN')} {order.unit}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(order.total_amount ?? 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${escrowCfg.color}`}>
                            {escrowCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sc.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </span>

                            {order.status === 'ready_to_ship' && (
                              <button
                                onClick={() => setShipModal(order)}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors whitespace-nowrap"
                              >
                                <Truck className="w-3 h-3" />
                                Mark Shipped
                              </button>
                            )}

                            <button
                              onClick={() => downloadInvoice(order.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              Invoice
                            </button>

                            {order.status === 'disputed' && (
                              <button
                                onClick={() => toggleRow(order.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                View Dispute
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <OrderDetail order={order} />
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

      {/* Mark Shipped Modal */}
      {shipModal && (
        <MarkShippedModal
          order={shipModal}
          onClose={() => setShipModal(null)}
        />
      )}
    </div>
  );
}

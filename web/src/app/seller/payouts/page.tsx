'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Loader2,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell, Badge, SectionCard, inr } from '@/components/ui';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { SELLER_NAV, SELLER_BRAND_SUB, SellerSidebarFooter } from '../_nav';

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

interface EscrowResponse { data: EscrowOrder[]; }

const PAGE_SIZE = 20;

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  processing: 'Holding',
  completed: 'Completed',
  failed: 'Disputed',
};

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SellerPayoutsPage() {
  const [page, setPage] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  const { data: payoutsData, isLoading: payoutsLoading, error: payoutsError } = useQuery({
    queryKey: ['seller-payouts', page],
    queryFn: () => api.get<{ data: PayoutsResponse }>('/seller/payouts', { params: { page, limit: PAGE_SIZE } }),
    select: (res) => (res.data as unknown as { data: PayoutsResponse })?.data ?? res.data,
    enabled: ready && isAuthenticated(),
    retry: 1,
  });

  const { data: escrowData, isLoading: escrowLoading } = useQuery({
    queryKey: ['seller-escrow'],
    queryFn: () => api.get<{ data: EscrowResponse }>('/seller/escrow-status'),
    select: (res) => (res.data as unknown as { data: EscrowResponse })?.data ?? res.data,
    enabled: ready && isAuthenticated(),
    retry: 1,
  });

  useEffect(() => { if (payoutsError) toast.error('Failed to load payout data'); }, [payoutsError]);

  async function downloadStatements() {
    try {
      const res = await api.get('/seller/payouts/statements', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Statements are not available right now');
    }
  }

  const summary = payoutsData?.summary ?? { pending_payout: 0, expected_payout_date: '', bank_account_last4: '4471' };
  const payouts: PayoutRecord[] = payoutsData?.data ?? [];
  const total = payoutsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const escrowOrders: EscrowOrder[] = (escrowData as unknown as EscrowResponse)?.data ?? [];

  return (
    <AppShell
      navItems={SELLER_NAV}
      brandSub={SELLER_BRAND_SUB}
      sidebarFooter={<SellerSidebarFooter />}
      title="Payouts"
      subtitle="Track your earnings and payout schedule"
    >
      {payoutsLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={30} className="animate-spin" style={{ color: 'var(--nm-green)' }} /></div>
      ) : (
        <>
          {/* Pending payout banner */}
          <div
            className="gradient-hero flex items-center justify-between flex-wrap gap-5 mb-6"
            style={{ borderRadius: 20, padding: '28px 32px' }}
          >
            <div>
              <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,.7)' }}>
                <Wallet size={15} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Pending payout</span>
              </div>
              <p className="num disp" style={{ fontSize: 36, fontWeight: 800, color: '#f4a82a', margin: '6px 0 6px' }}>
                {inr(summary.pending_payout)}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', margin: 0 }}>
                {summary.expected_payout_date ? `Expected ${fmtDate(summary.expected_payout_date)}` : 'Payout date pending'} · To account HDFC ••{summary.bank_account_last4 || '4471'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="nm-btn-gold" style={{ fontSize: 13.5 }}>Request payout</button>
              <button
                onClick={downloadStatements}
                style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '9px 16px', cursor: 'pointer' }}
              >
                Download statements
              </button>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* In escrow */}
            <SectionCard title="In escrow">
              {escrowLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--nm-green)' }} /></div>
              ) : escrowOrders.length === 0 ? (
                <div className="text-center py-8">
                  <IndianRupee size={30} style={{ color: 'var(--nm-faint)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12.5, color: 'var(--nm-faint)' }}>No orders in escrow</p>
                </div>
              ) : (
                <table className="nm-table">
                  <thead><tr>
                    <th>Order</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Expected release</th>
                  </tr></thead>
                  <tbody>
                    {escrowOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span style={{ fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 700, fontSize: 12.5, display: 'block' }}>
                            {o.order_number ?? o.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--nm-faint)', display: 'block', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {o.listing_title}
                          </span>
                        </td>
                        <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--nm-ink)' }}>{inr(o.amount)}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--nm-muted)' }}>{o.expected_release_date ? fmtDate(o.expected_release_date) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            {/* Payout history */}
            <SectionCard title="Payout history">
              {payouts.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet size={30} style={{ color: 'var(--nm-faint)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12.5, color: 'var(--nm-faint)' }}>No payouts yet</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="nm-table">
                    <thead><tr>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Orders</th>
                      <th style={{ textAlign: 'right' }}>Gross</th>
                      <th style={{ textAlign: 'right' }}>Commission</th>
                      <th style={{ textAlign: 'right' }}>GST</th>
                      <th style={{ textAlign: 'right' }}>TCS</th>
                      <th style={{ textAlign: 'right' }}>Net</th>
                      <th>Status</th>
                    </tr></thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontSize: 12.5, color: 'var(--nm-muted)', whiteSpace: 'nowrap' }}>{fmtDate(p.date)}</td>
                          <td className="num" style={{ textAlign: 'right', color: 'var(--nm-muted)' }}>{p.orders_count}</td>
                          <td className="num" style={{ textAlign: 'right', color: 'var(--nm-ink)' }}>{inr(p.gross_amount)}</td>
                          <td className="num" style={{ textAlign: 'right', color: 'var(--nm-red)' }}>−{inr(p.commission)}</td>
                          <td className="num" style={{ textAlign: 'right', color: 'var(--nm-red)' }}>−{inr(p.gst_on_commission)}</td>
                          <td className="num" style={{ textAlign: 'right', color: 'var(--nm-red)' }}>−{inr(p.tcs)}</td>
                          <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--nm-green)' }}>{inr(p.net_payout)}</td>
                          <td><Badge status={PAYOUT_STATUS_LABEL[p.status] ?? 'Pending'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="nm-btn-secondary" style={{ padding: '6px 10px' }}>
                    <ChevronLeft size={15} />
                  </button>
                  <span className="num" style={{ fontSize: 13, color: 'var(--nm-muted)' }}>{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="nm-btn-secondary" style={{ padding: '6px 10px' }}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </AppShell>
  );
}

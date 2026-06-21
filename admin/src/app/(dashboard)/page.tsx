'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { statsApi, transactionsApi } from '@/lib/api';
import AdminShell from '@/components/ui/AdminShell';
import Kpi from '@/components/ui/Kpi';
import SectionCard from '@/components/ui/SectionCard';
import Badge from '@/components/ui/Badge';
import {
  IndianRupee, Package, Users, ShoppingCart, Percent, Scale,
  AlertTriangle, Clock, FileCheck, RefreshCw, ArrowRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface KpiData {
  totalGmv: number; gmvChange: number;
  activeListings: number; listingsChange: number;
  activeSellers: number; sellersChange: number;
  activeBuyers: number; buyersChange: number;
  todaysCommission: number; commissionChange: number;
  openDisputes: number; disputesChange: number;
}

interface GmvPoint { date: string; gmv: number; }
interface AlertData { openDisputes: number; agingListings: number; pendingKyc: number; }

interface RecentOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  sellerName: string;
  amount?: number;
  totalAmount?: number;
  status: string;
  createdAt: string;
}

function formatINR(val: number): string {
  if (val >= 10_000_000) return `${(val / 10_000_000).toFixed(2)}Cr`;
  if (val >= 100_000) return `${(val / 100_000).toFixed(2)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toFixed(0);
}

function deltaSub(change: number | undefined, label: string): { sub: string; positive?: boolean } {
  if (change == null) return { sub: label };
  const sign = change > 0 ? '+' : '';
  return { sub: `${sign}${change.toFixed(1)}% ${label}`, positive: change >= 0 };
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  let d = label ?? '';
  try { d = format(parseISO(label ?? ''), 'd MMM'); } catch { /* keep raw */ }
  return (
    <div className="nm-card" style={{ padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--nm-muted)', marginBottom: 2 }}>{d}</div>
      <div className="num" style={{ color: 'var(--nm-green)', fontWeight: 800 }}>₹{formatINR(payload[0].value)}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: kpi, isLoading: kpiLoading, refetch: refetchKpi } = useQuery<KpiData | null>({
    queryKey: ['dashboard-kpi'],
    queryFn: async () => (await statsApi.getDashboard()).data?.data ?? null,
    retry: 1,
  });

  const { data: gmvData, refetch: refetchGmv } = useQuery<GmvPoint[]>({
    queryKey: ['gmv-history'],
    queryFn: async () => (await statsApi.getGmvHistory(30)).data?.data ?? [],
    retry: 1,
  });

  const { data: alerts, refetch: refetchAlerts } = useQuery<AlertData | null>({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => (await statsApi.getAlerts()).data?.data ?? null,
    retry: 1,
  });

  const { data: recentOrdersData, refetch: refetchOrders } = useQuery<RecentOrder[]>({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const res = await transactionsApi.getOrders({ limit: 10, page: 1 });
      const payload = res.data?.data;
      return Array.isArray(payload) ? payload : (payload as { rows?: RecentOrder[] })?.rows ?? [];
    },
    retry: 1,
  });

  function refetchAll() {
    refetchKpi(); refetchGmv(); refetchAlerts(); refetchOrders();
  }

  const gmv = gmvData ?? [];
  const recentOrders = recentOrdersData ?? [];

  return (
    <AdminShell
      title="Platform overview"
      subtitle="Live · last 30 days"
      actions={
        <button onClick={refetchAll} className="nm-btn-secondary" style={{ padding: '9px 14px', fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi label="Total GMV" loading={kpiLoading} icon={IndianRupee}
          value={`₹${formatINR(kpi?.totalGmv ?? 0)}`}
          {...deltaSub(kpi?.gmvChange, 'vs last month')} />
        <Kpi label="Active listings" loading={kpiLoading} icon={Package}
          value={(kpi?.activeListings ?? 0).toLocaleString('en-IN')}
          {...deltaSub(kpi?.listingsChange, 'vs last week')} />
        <Kpi label="Active sellers" loading={kpiLoading} icon={Users}
          value={(kpi?.activeSellers ?? 0).toLocaleString('en-IN')}
          {...deltaSub(kpi?.sellersChange, 'vs last week')} />
        <Kpi label="Active buyers" loading={kpiLoading} icon={ShoppingCart}
          value={(kpi?.activeBuyers ?? 0).toLocaleString('en-IN')}
          {...deltaSub(kpi?.buyersChange, 'vs last week')} />
        <Kpi label="Today's commission" loading={kpiLoading} icon={Percent}
          value={`₹${formatINR(kpi?.todaysCommission ?? 0)}`}
          {...deltaSub(kpi?.commissionChange, 'vs yesterday')} />
        <Kpi label="Open disputes" loading={kpiLoading} icon={Scale} danger
          value={(kpi?.openDisputes ?? 0).toLocaleString('en-IN')}
          {...deltaSub(kpi?.disputesChange, 'vs last week')} />
      </div>

      {/* GMV chart + alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2">
          <SectionCard title="GMV — last 30 days"
            action={<span style={{ fontSize: 12, color: 'var(--nm-muted)' }}>Daily gross merchandise value</span>}>
            {gmv.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: 240, color: 'var(--nm-muted)', fontSize: 13 }}>
                No GMV data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={gmv} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f6b3a" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#1f6b3a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ece1cd" />
                  <XAxis dataKey="date"
                    tickFormatter={(d) => { try { return format(parseISO(d), 'd MMM'); } catch { return d; } }}
                    tick={{ fontSize: 11, fill: '#7a6f5d' }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tickFormatter={(v) => `₹${formatINR(v)}`}
                    tick={{ fontSize: 11, fill: '#7a6f5d' }} tickLine={false} axisLine={false} width={64} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="gmv" stroke="#1f6b3a" strokeWidth={2}
                    fill="url(#gmvFill)" activeDot={{ r: 4, fill: '#1f6b3a' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-3">
          <AlertCard
            accent="var(--nm-red)" bg="var(--nm-red-soft)" fg="var(--nm-red)" icon={AlertTriangle}
            title={`${alerts?.openDisputes ?? kpi?.openDisputes ?? 0} disputes need attention`}
            body="Review and respond before SLA breach."
            href="/disputes" cta="View dispute queue" />
          <AlertCard
            accent="var(--nm-gold)" bg="var(--nm-gold-soft)" fg="var(--nm-gold-ink)" icon={Clock}
            title={`${alerts?.agingListings ?? 0} listings ageing >30 days`}
            body="These listings risk de-ranking. Consider seller outreach."
            href="/inventory" cta="View in inventory" />
          <AlertCard
            accent="var(--nm-info)" bg="var(--nm-info-soft)" fg="var(--nm-info)" icon={FileCheck}
            title={`${alerts?.pendingKyc ?? 0} KYC documents pending`}
            body="Sellers are blocked from transacting until KYC is approved."
            href="/kyc" cta="Review KYC docs" />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mt-4">
        <SectionCard
          title="Recent transactions"
          pad={0}
          action={
            <a href="/transactions" className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600, color: 'var(--nm-green)', padding: '18px 22px 0' }}>
              View all <ArrowRight size={14} />
            </a>
          }
        >
          {recentOrders.length === 0 ? (
            <div className="text-center" style={{ padding: '48px 0', color: 'var(--nm-muted)', fontSize: 13 }}>
              No recent transactions
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin" style={{ padding: '6px 22px 16px' }}>
              <table className="nm-table">
                <thead>
                  <tr>
                    <th>Order</th><th>Buyer</th><th>Seller</th>
                    <th style={{ textAlign: 'right' }}>Amount</th><th>Status</th><th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const amt = o.amount ?? o.totalAmount ?? 0;
                    return (
                      <tr key={o.id}>
                        <td className="num" style={{ color: 'var(--nm-green)', fontWeight: 700 }}>{o.orderNumber || '—'}</td>
                        <td>{o.buyerName}</td>
                        <td style={{ color: 'var(--nm-muted)' }}>{o.sellerName}</td>
                        <td className="num">₹{amt.toLocaleString('en-IN')}</td>
                        <td><Badge status={o.status} /></td>
                        <td style={{ color: 'var(--nm-muted)', fontSize: 12.5 }}>
                          {o.createdAt ? format(new Date(o.createdAt), 'h:mm a') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}

function AlertCard({
  accent, bg, fg, icon: Icon, title, body, href, cta,
}: {
  accent: string; bg: string; fg: string; icon: typeof AlertTriangle;
  title: string; body: string; href: string; cta: string;
}) {
  return (
    <div className="nm-card" style={{ padding: 16, borderLeft: `4px solid ${accent}` }}>
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center flex-shrink-0"
          style={{ width: 32, height: 32, borderRadius: 9, background: bg, color: fg }}>
          <Icon size={16} />
        </span>
        <div>
          <p className="disp" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>{title}</p>
          <p style={{ fontSize: 12, color: 'var(--nm-muted)', marginTop: 3 }}>{body}</p>
          <a href={href} className="flex items-center gap-1" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--nm-green)', marginTop: 8 }}>
            {cta} <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

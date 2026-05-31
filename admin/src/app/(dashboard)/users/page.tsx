'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { RefreshCw, Users, MessageSquare, X, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Column } from '@/components/ui/DataTable';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SellerScorecard {
  fulfillmentRate: number;
  disputeRate: number;
  responseRate: number;
}

interface User extends Record<string, unknown> {
  id: string;
  phone: string;
  fullName: string;
  role: 'buyer' | 'seller';
  status: string;
  kycStatus: string;
  verificationTier: number;
  createdAt: string;
  totalOrders?: number;
  totalGmv?: number;
  gstin?: string;
  bankAccountVerified?: boolean;
  scorecard?: SellerScorecard;
}

interface UsersResponse {
  rows: User[];
  total: number;
  page: number;
  limit: number;
}

interface ReferralRow extends Record<string, unknown> {
  id: string;
  referrerName: string;
  referredBuyerName: string;
  dateJoined: string;
  firstPurchase: number | null;
  commissionOwed: number;
  payoutStatus: string;
}

interface ReferralsResponse {
  rows: ReferralRow[];
  total: number;
}

// ─── Scorecard dot component ──────────────────────────────────────────────────

function RateIndicator({ label, value, thresholdGreen, thresholdOrange, lowerIsBetter = false }: {
  label: string;
  value: number;
  thresholdGreen: number;
  thresholdOrange: number;
  lowerIsBetter?: boolean;
}) {
  let dotClass = '';
  let textClass = '';

  if (!lowerIsBetter) {
    if (value >= thresholdGreen) {
      dotClass = 'bg-green-500';
      textClass = 'text-green-700 dark:text-green-400';
    } else if (value >= thresholdOrange) {
      dotClass = 'bg-orange-400';
      textClass = 'text-orange-600 dark:text-orange-400';
    } else {
      dotClass = 'bg-red-500';
      textClass = 'text-red-600 dark:text-red-400';
    }
  } else {
    if (value < thresholdGreen) {
      dotClass = 'bg-green-500';
      textClass = 'text-green-700 dark:text-green-400';
    } else if (value < thresholdOrange) {
      dotClass = 'bg-orange-400';
      textClass = 'text-orange-600 dark:text-orange-400';
    } else {
      dotClass = 'bg-red-500';
      textClass = 'text-red-600 dark:text-red-400';
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${textClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      {label}: {value.toFixed(1)}%
    </span>
  );
}

// ─── Message Modal ────────────────────────────────────────────────────────────

interface MessageModalProps {
  user: User;
  onClose: () => void;
}

function MessageModal({ user, onClose }: MessageModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<'push' | 'whatsapp' | 'sms'>('push');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!body.trim()) { toast.error('Message body is required'); return; }
    setLoading(true);
    try {
      await api.post('/admin/notifications/send-to-user', {
        user_id: user.id,
        title: title.trim(),
        body: body.trim(),
        channel,
      });
      toast.success(`Message sent to ${user.fullName} via ${channel}`);
      onClose();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[480px] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nm-border dark:border-nm-border-dark">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-nm-primary" />
            <h2 className="text-base font-bold text-nm-text dark:text-nm-text-dark">
              Message {user.fullName}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide mb-1.5">
              Channel
            </label>
            <div className="relative">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'push' | 'whatsapp' | 'sms')}
                className="w-full appearance-none border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg pl-4 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark"
              >
                <option value="push">Push Notification</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-nm-text-muted pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title..."
              className="w-full border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark placeholder:text-nm-text-muted"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={4}
              className="w-full border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark placeholder:text-nm-text-muted resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-nm-border dark:border-nm-border-dark">
          <button onClick={onClose} className="nm-btn-secondary text-sm px-4">Cancel</button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-nm-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Referrals tab table ──────────────────────────────────────────────────────

function ReferralsTab() {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery<ReferralsResponse>({
    queryKey: ['referrals', page],
    queryFn: async () => {
      const res = await api.get('/admin/referrals', { params: { page, limit: PAGE_SIZE } });
      return res.data?.data ?? { rows: [], total: 0 };
    },
    retry: 1,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const columns: Column<ReferralRow>[] = [
    {
      key: 'referrerName',
      header: 'Referrer',
      render: (r) => <span className="font-medium text-nm-text dark:text-nm-text-dark">{r.referrerName}</span>,
    },
    {
      key: 'referredBuyerName',
      header: 'Referred Buyer',
      render: (r) => <span className="text-nm-text dark:text-nm-text-dark">{r.referredBuyerName}</span>,
    },
    {
      key: 'dateJoined',
      header: 'Date Joined',
      render: (r) => (
        <span className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
          {new Date(r.dateJoined).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'firstPurchase',
      header: 'First Purchase',
      render: (r) => (
        <span className="text-sm text-nm-text dark:text-nm-text-dark">
          {r.firstPurchase != null ? `₹${r.firstPurchase.toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      key: 'commissionOwed',
      header: 'Commission Owed',
      render: (r) => (
        <span className="font-semibold text-nm-primary">
          ₹{(r.commissionOwed ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'payoutStatus',
      header: 'Payout Status',
      render: (r) => <StatusBadge status={r.payoutStatus} />,
    },
  ];

  return (
    <div className="space-y-4">
      {!isLoading && rows.length === 0 ? (
        <div className="nm-card p-16 text-center">
          <Users size={40} className="mx-auto text-nm-text-muted dark:text-nm-text-dark-muted mb-3" />
          <p className="text-nm-text-muted dark:text-nm-text-dark-muted text-sm">No referrals found.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          keyField="id"
          loading={isLoading}
          emptyMessage="No referrals found."
          pagination={
            total > PAGE_SIZE
              ? { page, pageSize: PAGE_SIZE, total, onPageChange: setPage }
              : undefined
          }
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const ROLE_TABS = [
  { value: '', label: 'All' },
  { value: 'buyer', label: 'Buyers' },
  { value: 'seller', label: 'Sellers' },
  { value: 'referrals', label: 'Referrals' },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [messageUser, setMessageUser] = useState<User | null>(null);

  const isReferralsTab = activeTab === 'referrals';
  const roleFilter = isReferralsTab ? '' : activeTab;

  const queryParams: Record<string, string | number> = { page, limit: PAGE_SIZE };
  if (roleFilter) queryParams.role = roleFilter;
  if (kycFilter) queryParams.kycStatus = kycFilter;
  if (search) queryParams.search = search;

  const { data, isLoading, refetch } = useQuery<UsersResponse>({
    queryKey: ['users', page, roleFilter, kycFilter, search],
    queryFn: async () => {
      const res = await usersApi.getUsers(queryParams);
      return res.data?.data ?? { rows: [], total: 0 };
    },
    retry: 1,
    enabled: !isReferralsTab,
  });

  const users = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pendingKycCount = users.filter((u) => u.kycStatus === 'pending').length;

  async function handleSuspend(userId: string, userName: string) {
    const reason = prompt(`Reason for suspending ${userName}:`);
    if (!reason) return;
    setActionLoading(userId);
    try {
      await usersApi.suspendUser(userId, reason);
      toast.success(`${userName} suspended`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch {
      toast.error('Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBan(userId: string, userName: string) {
    const reason = prompt(`Reason for banning ${userName} (this is permanent):`);
    if (!reason) return;
    if (!confirm(`Are you sure you want to permanently ban ${userName}?`)) return;
    setActionLoading(userId);
    try {
      await usersApi.banUser(userId, reason);
      toast.success(`${userName} has been banned`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch {
      toast.error('Failed to ban user');
    } finally {
      setActionLoading(null);
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      header: 'User',
      render: (u) => (
        <div>
          <div className="font-semibold text-sm text-nm-text dark:text-nm-text-dark">{u.fullName}</div>
          <div className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted font-mono">{u.phone}</div>
          {u.gstin && (
            <div className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">GSTIN: {u.gstin}</div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            u.role === 'seller'
              ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          }`}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'kycStatus',
      header: 'KYC',
      render: (u) => (
        <div>
          <StatusBadge status={u.kycStatus} />
          <div className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted mt-0.5">
            Tier {u.verificationTier ?? 0}
          </div>
          {u.bankAccountVerified !== undefined && (
            <div
              className={`text-xs ${u.bankAccountVerified ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}
            >
              {u.bankAccountVerified ? '✓ Bank verified' : '✗ Bank unverified'}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'totalOrders',
      header: 'Activity',
      render: (u) => (
        <div className="text-sm text-nm-text dark:text-nm-text-dark">
          {u.totalOrders !== undefined && (
            <div>{u.totalOrders} orders</div>
          )}
          {u.totalGmv !== undefined && (
            <div className="text-nm-text-muted dark:text-nm-text-dark-muted text-xs">
              ₹{(u.totalGmv / 1000).toFixed(0)}K GMV
            </div>
          )}
        </div>
      ),
    },
    // Scorecard column — only meaningful for sellers
    {
      key: 'scorecard',
      header: 'Scorecard',
      render: (u) => {
        if (u.role !== 'seller' || !u.scorecard) {
          return <span className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">—</span>;
        }
        const sc = u.scorecard as SellerScorecard;
        return (
          <div className="flex flex-col gap-0.5">
            <RateIndicator label="F" value={sc.fulfillmentRate} thresholdGreen={90} thresholdOrange={70} />
            <RateIndicator label="D" value={sc.disputeRate} thresholdGreen={2} thresholdOrange={5} lowerIsBetter />
            <RateIndicator label="R" value={sc.responseRate} thresholdGreen={80} thresholdOrange={50} />
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u) => (
        <span className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
          {new Date(u.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex gap-1.5 flex-wrap">
          {/* Message button */}
          <button
            onClick={(e) => { e.stopPropagation(); setMessageUser(u); }}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors flex items-center gap-1"
          >
            <MessageSquare size={10} />
            Message
          </button>
          {u.status !== 'suspended' && u.status !== 'banned' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleSuspend(u.id, u.fullName); }}
              disabled={actionLoading === u.id}
              className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 disabled:opacity-50 transition-colors"
            >
              Suspend
            </button>
          )}
          {u.status !== 'banned' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleBan(u.id, u.fullName); }}
              disabled={actionLoading === u.id}
              className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50 transition-colors"
            >
              Ban
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nm-text dark:text-nm-text-dark">Users</h1>
          <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted mt-0.5">
            Manage buyers and sellers
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingKycCount > 0 && !isReferralsTab && (
            <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-sm px-3 py-1 rounded-full font-semibold">
              {pendingKycCount} KYC pending
            </span>
          )}
          {!isReferralsTab && (
            <button
              onClick={() => refetch()}
              className="nm-btn-secondary flex items-center gap-2 text-sm"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Role / Tab filter */}
      <div className="flex gap-1 border-b border-nm-border dark:border-nm-border-dark">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.value
                ? 'border-nm-primary text-nm-primary dark:text-nm-primary-light'
                : 'border-transparent text-nm-text-muted dark:text-nm-text-dark-muted hover:text-nm-text dark:hover:text-nm-text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Referrals tab */}
      {isReferralsTab ? (
        <ReferralsTab />
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or phone..."
              className="border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark placeholder:text-nm-text-muted"
            />
            <select
              value={kycFilter}
              onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
              className="border border-nm-border dark:border-nm-border-dark bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nm-primary text-nm-text dark:text-nm-text-dark"
            >
              <option value="">All KYC</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Table */}
          {!isLoading && users.length === 0 ? (
            <div className="nm-card p-16 text-center">
              <Users size={40} className="mx-auto text-nm-text-muted dark:text-nm-text-dark-muted mb-3" />
              <p className="text-nm-text-muted dark:text-nm-text-dark-muted text-sm">
                {search || roleFilter || kycFilter ? 'No users match your filters.' : 'No users found.'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              keyField="id"
              loading={isLoading}
              emptyMessage="No users found."
              pagination={
                total > PAGE_SIZE
                  ? { page, pageSize: PAGE_SIZE, total, onPageChange: setPage }
                  : undefined
              }
            />
          )}
        </>
      )}

      {/* Message Modal */}
      {messageUser && (
        <MessageModal user={messageUser} onClose={() => setMessageUser(null)} />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Shield,
  RefreshCw,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';
import api from '@/lib/api';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KycDocument {
  id: string;
  filename: string;
  documentType: string;
  url: string;
}

interface KycSubmission {
  id: string;
  sellerId: string;
  sellerName: string;
  businessName: string;
  businessType: string;
  gstNumber: string;
  panNumber: string;
  msmeNumber: string | null;
  documents: KycDocument[];
  submittedAt: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  kycTier?: string;
}

interface KycListResponse {
  rows: KycSubmission[];
  total: number;
  page: number;
  limit: number;
}

interface KycStatsData {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  avgReviewTimeHours: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const kycApi = {
  getList: (params: Record<string, string | number>) =>
    api.get('/admin/kyc', { params }),
  reviewKyc: (id: string, body: Record<string, string>) =>
    api.post(`/admin/kyc/${id}/review`, body),
  getStats: () => api.get('/admin/kyc/stats'),
};

// ─── Status colours ───────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// ─── Document icon helper ─────────────────────────────────────────────────────

function DocIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes('image') || t.includes('photo') || t.includes('jpg') || t.includes('png'))
    return <ImageIcon size={14} className="text-blue-500 shrink-0" />;
  if (t.includes('pdf'))
    return <FileText size={14} className="text-red-500 shrink-0" />;
  return <File size={14} className="text-gray-400 shrink-0" />;
}

// ─── Slide Panel ─────────────────────────────────────────────────────────────

interface ReviewPanelProps {
  submission: KycSubmission | null;
  onClose: () => void;
  onActionSuccess: () => void;
}

function ReviewPanel({ submission, onClose, onActionSuccess }: ReviewPanelProps) {
  const [activeAction, setActiveAction] = useState<'reject' | 'request_more' | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<KycDocument | null>(null);

  useEffect(() => {
    setActiveAction(null);
    setReason('');
    setMessage('');
  }, [submission?.id]);

  if (!submission) return null;

  async function submitAction(action: string, extra?: Record<string, string>) {
    if (!submission) return;
    setLoading(action);
    try {
      await kycApi.reviewKyc(submission.id, { action, ...extra });
      toast.success(
        action === 'approve'
          ? `KYC approved (${extra?.tier ?? 'basic'})`
          : action === 'reject'
          ? 'KYC rejected'
          : 'Additional docs requested'
      );
      onActionSuccess();
      onClose();
    } catch {
      toast.error('Action failed — please try again');
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {/* Inline Doc Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{previewDoc.filename}</p>
                <p className="text-xs text-gray-500 capitalize">{previewDoc.documentType.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  <ExternalLink size={12} /> Open in new tab
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800">
              {previewDoc.documentType.toLowerCase().includes('pdf') || previewDoc.url.endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-full min-h-[500px]"
                  title={previewDoc.filename}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.url}
                  alt={previewDoc.filename}
                  className="w-full h-auto max-h-[70vh] object-contain p-4"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nm-border dark:border-nm-border-dark shrink-0">
          <div>
            <h2 className="text-base font-bold text-nm-text dark:text-nm-text-dark">KYC Review</h2>
            <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted mt-0.5">
              Submitted {new Date(submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted dark:text-nm-text-dark-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-6">
          {/* Seller Details */}
          <section>
            <h3 className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide mb-3">
              Seller Details
            </h3>
            <div className="nm-card p-4 space-y-2.5">
              <DetailRow label="Seller Name" value={submission.sellerName} />
              <DetailRow label="Business Name" value={submission.businessName} />
              <DetailRow label="Business Type" value={submission.businessType} />
              <DetailRow label="GST Number" value={submission.gstNumber} mono />
              <DetailRow label="PAN Number" value={submission.panNumber} mono />
              {submission.msmeNumber && (
                <DetailRow label="MSME Number" value={submission.msmeNumber} mono />
              )}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">Current Status:</span>
                <StatusBadge status={submission.status} />
              </div>
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide mb-3">
              Documents ({submission.documents.length})
            </h3>
            {submission.documents.length === 0 ? (
              <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {submission.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-nm-border dark:border-nm-border-dark rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <DocIcon type={doc.documentType} />
                      <div className="min-w-0">
                        <p className="text-sm text-nm-text dark:text-nm-text-dark truncate font-medium">
                          {doc.filename}
                        </p>
                        <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted capitalize">
                          {doc.documentType.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="text-xs text-nm-primary font-medium hover:underline"
                      >
                        Preview
                      </button>
                      <span className="text-gray-300">|</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-nm-primary"
                      >
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Inline Reject Form */}
          {activeAction === 'reject' && (
            <section className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Rejection Reason</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the KYC is being rejected..."
                rows={3}
                className="w-full border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 text-nm-text dark:text-nm-text-dark placeholder:text-nm-text-muted resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    if (!reason.trim()) { toast.error('Please provide a rejection reason'); return; }
                    submitAction('reject', { reason });
                  }}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading === 'reject' && <Loader2 size={13} className="animate-spin" />}
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 nm-btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {/* Inline Request More Docs Form */}
          {activeAction === 'request_more' && (
            <section className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Message to Seller</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what additional documents or information are needed..."
                rows={3}
                className="w-full border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-nm-text dark:text-nm-text-dark placeholder:text-nm-text-muted resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    if (!message.trim()) { toast.error('Please enter a message'); return; }
                    submitAction('request_more', { message });
                  }}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading === 'request_more' && <Loader2 size={13} className="animate-spin" />}
                  Send Request
                </button>
                <button
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 nm-btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Action Footer */}
        {!activeAction && (
          <div className="border-t border-nm-border dark:border-nm-border-dark px-6 py-4 space-y-2.5 shrink-0 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide mb-1">
              Take Action
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => submitAction('approve', { tier: 'basic' })}
                disabled={!!loading}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading === 'approve' && <Loader2 size={13} className="animate-spin" />}
                <CheckCircle size={14} />
                Approve — Basic
              </button>
              <button
                onClick={() => submitAction('approve', { tier: 'verified' })}
                disabled={!!loading}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors"
              >
                {loading === 'approve_verified' && <Loader2 size={13} className="animate-spin" />}
                <CheckCircle size={14} />
                Approve — Verified
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveAction('reject')}
                disabled={!!loading}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors border border-red-200 dark:border-red-800"
              >
                <XCircle size={14} />
                Reject
              </button>
              <button
                onClick={() => setActiveAction('request_more')}
                disabled={!!loading}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors border border-blue-200 dark:border-blue-800"
              >
                <Clock size={14} />
                Request More Docs
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted shrink-0">{label}</span>
      <span className={`text-xs text-nm-text dark:text-nm-text-dark text-right ${mono ? 'font-mono' : 'font-medium'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function KycPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<KycSubmission | null>(null);

  const queryParams: Record<string, string | number> = { page, limit: PAGE_SIZE };
  if (statusFilter) queryParams.status = statusFilter;

  const { data, isLoading, refetch } = useQuery<KycListResponse>({
    queryKey: ['kyc-list', page, statusFilter],
    queryFn: async () => {
      const res = await kycApi.getList(queryParams);
      return res.data?.data ?? { rows: [], total: 0 };
    },
    retry: 1,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<KycStatsData>({
    queryKey: ['kyc-stats'],
    queryFn: async () => {
      const res = await kycApi.getStats();
      return res.data?.data ?? { pending: 0, approvedToday: 0, rejectedToday: 0, avgReviewTimeHours: 0 };
    },
    retry: 1,
  });

  const submissions = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleActionSuccess() {
    queryClient.invalidateQueries({ queryKey: ['kyc-list'] });
    queryClient.invalidateQueries({ queryKey: ['kyc-stats'] });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nm-text dark:text-nm-text-dark">KYC Review Queue</h1>
          <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted mt-0.5">
            Verify seller identities and approve or reject submissions
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pending Review"
          value={statsData?.pending ?? '—'}
          loading={statsLoading}
          icon={<Shield size={16} className="text-yellow-600" />}
          iconBg="bg-yellow-100 dark:bg-yellow-900/20"
        />
        <StatsCard
          title="Approved Today"
          value={statsData?.approvedToday ?? '—'}
          loading={statsLoading}
          icon={<CheckCircle size={16} className="text-green-600" />}
          iconBg="bg-green-100 dark:bg-green-900/20"
        />
        <StatsCard
          title="Rejected Today"
          value={statsData?.rejectedToday ?? '—'}
          loading={statsLoading}
          icon={<XCircle size={16} className="text-red-500" />}
          iconBg="bg-red-100 dark:bg-red-900/20"
        />
        <StatsCard
          title="Avg Review Time"
          value={statsData?.avgReviewTimeHours != null ? `${statsData.avgReviewTimeHours.toFixed(1)}h` : '—'}
          loading={statsLoading}
          icon={<Clock size={16} className="text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-nm-border dark:border-nm-border-dark">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              statusFilter === tab.value
                ? 'border-nm-primary text-nm-primary dark:text-nm-primary-light'
                : 'border-transparent text-nm-text-muted dark:text-nm-text-dark-muted hover:text-nm-text dark:hover:text-nm-text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="nm-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-nm-border dark:border-nm-border-dark">
                <th className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide">
                  Seller / Business
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide">
                  Business Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide">
                  GST Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide">
                  Documents
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide">
                  Submitted At
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nm-border dark:divide-nm-border-dark">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${55 + Math.random() * 35}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Users size={36} className="mx-auto text-nm-text-muted dark:text-nm-text-dark-muted mb-3" />
                    <p className="text-nm-text-muted dark:text-nm-text-dark-muted text-sm">
                      No KYC submissions found
                    </p>
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-nm-text dark:text-nm-text-dark">{s.sellerName}</div>
                      <div className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">{s.businessName}</div>
                    </td>
                    <td className="px-4 py-3 text-nm-text dark:text-nm-text-dark capitalize">{s.businessType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-nm-text dark:text-nm-text-dark">{s.gstNumber}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
                        {s.documents.length} file{s.documents.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-nm-text-muted dark:text-nm-text-dark-muted whitespace-nowrap">
                      {new Date(s.submittedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedSubmission(s)}
                        className="text-xs bg-nm-primary/10 text-nm-primary dark:bg-nm-primary/20 px-3 py-1.5 rounded-full hover:bg-nm-primary/20 dark:hover:bg-nm-primary/30 font-medium transition-colors"
                      >
                        Review
                      </button>
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

      {/* Review Slide Panel */}
      <ReviewPanel
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onActionSuccess={handleActionSuccess}
      />
    </div>
  );
}

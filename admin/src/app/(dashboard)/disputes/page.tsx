'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '@/lib/api';
import { toast } from 'sonner';
import { Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import AdminShell from '@/components/ui/AdminShell';
import Badge from '@/components/ui/Badge';

interface Dispute {
  id: string;
  orderNumber: string;
  reason: string;
  status: string;
  slaDeadline: string;
  buyerName: string;
  sellerName: string;
  totalAmount: number;
  description: string;
  createdAt: string;
  assignedTo?: string;
  evidence?: { fileUrl: string; fileName: string; uploadedBy: string }[];
}
interface DisputesResponse { rows: Dispute[]; total: number; }

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
];

function formatSla(deadline: string): { text: string; color: string } {
  const hrs = (new Date(deadline).getTime() - Date.now()) / 3_600_000;
  if (hrs < 0) return { text: `Overdue ${Math.abs(Math.round(hrs))}h`, color: 'var(--nm-red)' };
  if (hrs < 12) return { text: `${Math.round(hrs)}h remaining`, color: 'var(--nm-gold-ink)' };
  return { text: `${Math.round(hrs)}h remaining`, color: 'var(--nm-muted)' };
}

export default function DisputesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('open');
  const [winningSide, setWinningSide] = useState<'seller' | 'buyer'>('seller');
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);

  const { data, isLoading, refetch } = useQuery<DisputesResponse>({
    queryKey: ['disputes', statusFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await disputesApi.getDisputes(params);
      return res.data?.data ?? { rows: [], total: 0 };
    },
    retry: 1,
  });

  const disputes = data?.rows ?? [];
  const openCount = disputes.filter((d) => d.status === 'open').length;
  const reviewCount = disputes.filter((d) => d.status === 'in_review').length;

  // The first card (or selected one) is expanded.
  const expandedId = selectedId ?? disputes[0]?.id ?? null;

  async function submitResolve(escalate: boolean) {
    const target = disputes.find((d) => d.id === expandedId);
    if (!target) return;
    if (resolution.trim().length < 20) {
      toast.error('Resolution note must be at least 20 characters');
      return;
    }
    setWorking(true);
    try {
      await disputesApi.resolveDispute(target.id, {
        resolution: escalate ? `ESCALATED: ${resolution}` : resolution,
        notes,
        winningSide,
      });
      toast.success(escalate ? 'Dispute escalated to senior review' : 'Dispute resolved');
      setSelectedId(null); setResolution(''); setNotes('');
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    } catch {
      toast.error(escalate ? 'Failed to escalate dispute' : 'Failed to resolve dispute');
    } finally {
      setWorking(false);
    }
  }

  return (
    <AdminShell
      title={`${openCount} open · ${reviewCount} under review`}
      subtitle="Buyer–seller dispute resolution"
      actions={
        <button onClick={() => refetch()} className="nm-btn-secondary" style={{ padding: '9px 14px', fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      <div className="nm-tabbar">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => { setStatusFilter(t.value); setSelectedId(null); }}
            className={`nm-tab ${statusFilter === t.value ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-4" style={{ maxWidth: 880 }}>
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="nm-card animate-pulse" style={{ height: 88 }} />
        ))}

        {!isLoading && disputes.length === 0 && (
          <div className="nm-card text-center" style={{ padding: '56px 0', color: 'var(--nm-muted)' }}>
            <AlertTriangle size={36} className="mx-auto" style={{ color: 'var(--nm-faint)', marginBottom: 10 }} />
            <p style={{ fontSize: 13 }}>No disputes for this filter.</p>
          </div>
        )}

        {disputes.map((d) => {
          const expanded = d.id === expandedId;
          const sla = d.slaDeadline ? formatSla(d.slaDeadline) : null;
          const canResolve = d.status !== 'resolved';
          return (
            <div key={d.id} className="nm-card"
              style={{ padding: 18, cursor: 'pointer', borderColor: expanded ? 'var(--nm-green)' : 'var(--nm-line)' }}
              onClick={() => setSelectedId(expanded ? null : d.id)}>
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--nm-red-soft)', color: 'var(--nm-red)' }}>
                  <Zap size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="disp" style={{ fontSize: 14, fontWeight: 700, color: 'var(--nm-ink)', textTransform: 'capitalize' }}>
                    {d.reason?.replace(/_/g, ' ') || 'Dispute'}
                  </div>
                  <div className="num" style={{ fontSize: 12.5, color: 'var(--nm-green)', fontWeight: 600, marginTop: 2 }}>{d.orderNumber}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--nm-muted)', marginTop: 3 }}>
                    {d.buyerName} vs {d.sellerName} · raised {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--nm-ink)' }}>₹{(d.totalAmount ?? 0).toLocaleString('en-IN')}</div>
                  <div style={{ marginTop: 4 }}><Badge status={d.status} /></div>
                  {sla && <div style={{ fontSize: 11.5, color: sla.color, fontWeight: 600, marginTop: 4 }}>{sla.text}</div>}
                </div>
              </div>

              {expanded && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--nm-line)' }} onClick={(e) => e.stopPropagation()}>
                  {d.description && (
                    <>
                      <p className="label" style={{ marginBottom: 6 }}>Buyer statement</p>
                      <div style={{ background: 'var(--nm-panel)', borderRadius: 12, padding: 12, fontSize: 13, color: 'var(--nm-ink)', marginBottom: 16 }}>
                        {d.description}
                      </div>
                    </>
                  )}

                  {d.evidence && d.evidence.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p className="label" style={{ marginBottom: 6 }}>Evidence ({d.evidence.length})</p>
                      <div className="flex flex-col gap-1.5">
                        {d.evidence.map((e, i) => (
                          <a key={i} href={e.fileUrl} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12.5, color: 'var(--nm-green)', fontWeight: 600 }}>📎 {e.fileName}</a>
                        ))}
                      </div>
                    </div>
                  )}

                  {canResolve ? (
                    <>
                      <p className="label" style={{ marginBottom: 8 }}>Outcome</p>
                      <div className="flex gap-2 mb-3">
                        {(['seller', 'buyer'] as const).map((side) => (
                          <button key={side} onClick={() => setWinningSide(side)}
                            className="flex-1" style={{
                              padding: '9px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                              fontFamily: '"Bricolage Grotesque", sans-serif',
                              border: `1px solid ${winningSide === side ? 'var(--nm-green)' : 'var(--nm-line)'}`,
                              background: winningSide === side ? 'var(--nm-green-soft)' : 'transparent',
                              color: winningSide === side ? 'var(--nm-green)' : 'var(--nm-muted)',
                            }}>
                            {side === 'seller' ? 'Release to seller' : 'Refund buyer'}
                          </button>
                        ))}
                      </div>

                      <p className="label" style={{ marginBottom: 6 }}>Admin note</p>
                      <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3}
                        placeholder="Resolution summary (min 20 characters)..." className="nm-input" style={{ resize: 'none', marginBottom: 10 }} />
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                        placeholder="Internal notes (optional)..." className="nm-input" style={{ resize: 'none', marginBottom: 12 }} />

                      <div className="flex gap-2">
                        <button onClick={() => submitResolve(false)} disabled={working || resolution.trim().length < 20}
                          className="nm-btn-primary" style={{ padding: '10px 18px', fontSize: 13.5 }}>
                          {working ? 'Working…' : 'Resolve'}
                        </button>
                        <button onClick={() => submitResolve(true)} disabled={working || resolution.trim().length < 20}
                          className="nm-btn-gold" style={{ padding: '10px 18px', fontSize: 13.5 }}>
                          Escalate
                        </button>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--nm-muted)' }}>This dispute has been resolved.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}

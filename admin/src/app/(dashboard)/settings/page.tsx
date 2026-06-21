'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, RefreshCw, Shield, Bell, IndianRupee, Wrench, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/ui/AdminShell';
import Toggle from '@/components/ui/Toggle';
import { settingsApi } from '@/lib/api';

type SettingsMap = Record<string, string>;

function Row({ label, hint, value, type = 'text', min, max, step, placeholder, onChange }: {
  label: string; hint?: string; value: string; type?: string;
  min?: string; max?: string; step?: string; placeholder?: string; onChange: (v: string) => void;
}) {
  const isToggle = type === 'toggle';
  return (
    <div className="flex items-center justify-between" style={{ padding: '13px 0', borderBottom: '1px solid var(--nm-line-soft)' }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nm-ink)', margin: 0 }}>{label}</p>
        {hint && <p style={{ fontSize: 12, color: 'var(--nm-muted)', margin: '2px 0 0' }}>{hint}</p>}
      </div>
      {isToggle ? (
        <Toggle on={value === 'true'} onChange={v => onChange(v ? 'true' : 'false')} />
      ) : (
        <input type={type} value={value} min={min} max={max} step={step} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className="nm-input" style={{ width: 200, textAlign: type === 'number' ? 'right' : 'left' }} />
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="nm-card overflow-hidden">
      <div className="flex items-center gap-2.5" style={{ padding: '14px 22px', background: 'var(--nm-panel)', borderBottom: '1px solid var(--nm-line)' }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--nm-green-soft)', color: 'var(--nm-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} />
        </span>
        <h2 className="disp" style={{ fontSize: 14, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '0 22px' }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [local, setLocal] = useState<SettingsMap>({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApi.getSettings();
      return (res.data as { data?: SettingsMap })?.data ?? ({} as SettingsMap);
    },
  });

  useEffect(() => { if (data && !dirty) setLocal(data); }, [data, dirty]);

  const saveMut = useMutation({
    mutationFn: () => settingsApi.updateSettings(local),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); setDirty(false); toast.success('Settings saved'); },
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (key: string) => (v: string) => { setLocal(p => ({ ...p, [key]: v })); setDirty(true); };
  const get = (key: string) => local[key] ?? data?.[key] ?? '';

  if (isLoading) return (
    <AdminShell title="Settings">
      <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--nm-green)' }} /></div>
    </AdminShell>
  );

  return (
    <AdminShell title="Settings" subtitle="Configure platform behaviour, fees, and features"
      actions={
        <div className="flex items-center gap-3">
          {dirty && <button onClick={() => { setLocal(data ?? {}); setDirty(false); }} className="nm-btn-secondary flex items-center gap-2" style={{ fontSize: 13 }}><RefreshCw size={14} /> Reset</button>}
          <button onClick={() => saveMut.mutate()} disabled={!dirty || saveMut.isPending}
            className="nm-btn-primary flex items-center gap-2" style={{ fontSize: 13 }}>
            {saveMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save changes
          </button>
        </div>
      }
    >
      {dirty && (
        <div className="flex items-center gap-2 mb-4" style={{ background: 'var(--nm-gold-soft)', border: '1px solid var(--nm-gold-line)', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: 'var(--nm-gold-ink)' }}>
          ⚠ You have unsaved changes
        </div>
      )}

      <div className="flex flex-col gap-5" style={{ maxWidth: 760 }}>
        <Section icon={IndianRupee} title="Fees & Rates">
          <Row label="Default Commission Rate (%)" hint="Applied to sectors without a custom rate" type="number" min="0" max="50" step="0.1" value={get('default_commission_rate')} onChange={set('default_commission_rate')} />
          <Row label="TCS Rate (%)" hint="Tax Collected at Source under Section 194-O" type="number" min="0" max="5" step="0.1" value={get('tcs_rate')} onChange={set('tcs_rate')} />
          <Row label="Minimum Order Value (₹)" type="number" min="0" step="100" value={get('min_order_value')} onChange={set('min_order_value')} />
        </Section>

        <Section icon={Shield} title="Escrow & Dispute">
          <Row label="Auto-Release Days" hint="Escrow released automatically after N days if buyer doesn't confirm" type="number" min="1" max="30" value={get('auto_release_days')} onChange={set('auto_release_days')} />
          <Row label="Dispute SLA (hours)" hint="Time for admin to resolve before escalation" type="number" min="1" max="720" value={get('dispute_sla_hours')} onChange={set('dispute_sla_hours')} />
        </Section>

        <Section icon={Settings} title="Listing Configuration">
          <Row label="Max Images per Listing" type="number" min="1" max="20" value={get('max_listing_images')} onChange={set('max_listing_images')} />
          <Row label="Enable Flash Sales" type="toggle" value={get('enable_flash_sales')} onChange={set('enable_flash_sales')} />
          <Row label="Enable Auctions" type="toggle" value={get('enable_auctions')} onChange={set('enable_auctions')} />
        </Section>

        <Section icon={Bell} title="Registrations & Features">
          <Row label="Allow Buyer Registration" hint="New buyers can sign up" type="toggle" value={get('enable_buyer_registration')} onChange={set('enable_buyer_registration')} />
          <Row label="Allow Seller Registration" hint="New sellers can apply to list inventory" type="toggle" value={get('enable_seller_registration')} onChange={set('enable_seller_registration')} />
          <Row label="WhatsApp Notifications" hint="Send order/payment alerts via WhatsApp" type="toggle" value={get('enable_whatsapp_notifications')} onChange={set('enable_whatsapp_notifications')} />
        </Section>

        <Section icon={Bell} title="KPI Alert Thresholds">
          <Row label="GMV Drop Alert (%)" hint="Alert when weekly GMV drops by this % WoW" type="number" min="1" max="100" step="1" placeholder="20" value={get('alert_gmv_drop_pct')} onChange={set('alert_gmv_drop_pct')} />
          <Row label="Dispute Rate Alert (%)" type="number" min="0" max="100" step="0.5" placeholder="5" value={get('alert_dispute_rate_pct')} onChange={set('alert_dispute_rate_pct')} />
          <Row label="Inventory Aging Alert (days)" type="number" min="7" max="180" step="1" placeholder="30" value={get('alert_aging_days')} onChange={set('alert_aging_days')} />
          <Row label="Low CVR Alert (%)" type="number" min="0" max="20" step="0.5" placeholder="1" value={get('alert_low_cvr_pct')} onChange={set('alert_low_cvr_pct')} />
          <Row label="Weekly Report Emails" hint="Comma-separated — Monday 8AM IST report" placeholder="admin@nirmalmandi.com" value={get('weekly_report_emails')} onChange={set('weekly_report_emails')} />
        </Section>

        <Section icon={Wrench} title="Maintenance">
          <Row label="Maintenance Mode" hint="Shows maintenance page to all users when enabled" type="toggle" value={get('maintenance_mode')} onChange={set('maintenance_mode')} />
        </Section>
      </div>
    </AdminShell>
  );
}

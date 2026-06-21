'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Store, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import api, { storefrontApi } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { AppShell, Avatar } from '@/components/ui';
import { SELLER_NAV, SELLER_BRAND_SUB, SellerSidebarFooter } from '../_nav';

interface SellerProfile {
  id: string;
  name: string;
  phone: string;
  business_name: string;
  business_type: string;
  gst_number: string;
  pan_number?: string;
  msme_number?: string;
  state: string;
  city: string;
  address_line1?: string;
  pincode?: string;
  bank_account_last4?: string;
  ifsc?: string;
  kyc_status: string;
  seller_tier: string;
  total_listings: number;
  total_orders: number;
  rating?: number;
  created_at: string;
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'S';
}

// ── Detail row ──────────────────────────────────────────────────────────────────
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '11px 0', borderBottom: '1px solid var(--nm-line-soft)' }}>
      <span style={{ fontSize: 13, color: 'var(--nm-muted)' }}>{label}</span>
      <span className={mono ? 'num' : 'disp'} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nm-ink)' }}>{value}</span>
    </div>
  );
}

// ── Stat ────────────────────────────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="num disp" style={{ fontSize: 20, fontWeight: 800, color: 'var(--nm-ink)', margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11.5, color: 'var(--nm-muted)', margin: '2px 0 0' }}>{label}</p>
    </div>
  );
}

export default function SellerProfilePage() {
  const [localUser, setLocalUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); setLocalUser(getUser()); }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: () => api.get<{ data: SellerProfile }>('/seller/profile'),
    select: (res) => (res.data as unknown as { data: SellerProfile })?.data ?? res.data,
    enabled: ready && isAuthenticated(),
    retry: 1,
  });

  useEffect(() => { if (error) toast.error('Failed to load profile'); }, [error]);

  const profile = data as SellerProfile | undefined;
  const name = profile?.name ?? localUser?.name ?? '—';
  const businessName = profile?.business_name ?? 'Your business';
  const kycVerified = (profile?.kyc_status ?? '') === 'verified';

  return (
    <AppShell
      navItems={SELLER_NAV}
      brandSub={SELLER_BRAND_SUB}
      sidebarFooter={<SellerSidebarFooter />}
      title="Profile"
      subtitle="Your seller account details"
      actions={<button className="nm-btn-secondary" style={{ fontSize: 13.5 }}>Edit</button>}
    >
      {!ready || isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={30} className="animate-spin" style={{ color: 'var(--nm-green)' }} /></div>
      ) : (
        <div className="flex flex-col gap-5" style={{ maxWidth: 900 }}>
          {/* Profile header card */}
          <div className="nm-card flex flex-wrap items-center gap-5" style={{ padding: 24 }}>
            <Avatar initials={initials(businessName)} size={72} />
            <div className="flex-1 min-w-0">
              <h2 className="disp" style={{ fontSize: 22, fontWeight: 800, color: 'var(--nm-ink)', margin: 0 }}>{businessName}</h2>
              <p style={{ fontSize: 13, color: 'var(--nm-muted)', margin: '2px 0 10px' }}>
                {name} · Member since {fmtDate(profile?.created_at ?? '')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {kycVerified && (
                  <span className="nm-pill" style={{ color: 'var(--nm-green)', background: 'var(--nm-green-soft)', fontWeight: 700 }}>KYC verified</span>
                )}
                {!kycVerified && profile?.kyc_status && (
                  <span className="nm-pill" style={{ color: 'var(--nm-gold-ink)', background: 'var(--nm-gold-soft)', fontWeight: 700, textTransform: 'capitalize' }}>KYC {profile.kyc_status}</span>
                )}
                {profile?.seller_tier && (
                  <span className="nm-pill" style={{ color: 'var(--nm-green)', background: 'var(--nm-green-soft)', fontWeight: 700, textTransform: 'capitalize' }}>{profile.seller_tier} seller</span>
                )}
                {profile?.msme_number && (
                  <span className="nm-pill" style={{ color: 'var(--nm-gold-ink)', background: 'var(--nm-gold-soft)', fontWeight: 700 }}>MSME</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6" style={{ paddingLeft: 8 }}>
              <Stat label="Listings" value={String(profile?.total_listings ?? 0)} />
              <Stat label="Orders" value={String(profile?.total_orders ?? 0)} />
              <Stat label="Rating" value={profile?.rating ? profile.rating.toFixed(1) : '—'} />
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Business details */}
            <div className="nm-card" style={{ padding: 22 }}>
              <h3 className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--nm-ink)', margin: '0 0 6px' }}>Business details</h3>
              <Row label="Phone" value={profile?.phone ?? localUser?.phone ?? '—'} />
              <Row label="Business type" value={(profile?.business_type ?? '—').replace(/^./, (c) => c.toUpperCase())} />
              <Row label="GSTIN" value={profile?.gst_number ?? '—'} mono />
              <Row label="PAN" value={profile?.pan_number ? `••••${profile.pan_number.slice(-4)}` : '—'} mono />
              <div className="flex items-center justify-between" style={{ padding: '11px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--nm-muted)' }}>MSME</span>
                <span className="num" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nm-ink)' }}>{profile?.msme_number ?? '—'}</span>
              </div>
            </div>

            {/* Location & bank */}
            <div className="nm-card" style={{ padding: 22 }}>
              <h3 className="disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--nm-ink)', margin: '0 0 6px' }}>Location &amp; bank</h3>
              <Row label="State" value={profile?.state ?? '—'} />
              <Row label="City" value={profile?.city ?? '—'} />
              <Row label="Address" value={profile?.address_line1 ?? '—'} />
              <Row label="Bank" value={profile?.bank_account_last4 ? `••${profile.bank_account_last4}` : '—'} mono />
              <div className="flex items-center justify-between" style={{ padding: '11px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--nm-muted)' }}>IFSC</span>
                <span className="num" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nm-ink)' }}>{profile?.ifsc ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Storefront Settings (unchanged) */}
          <StorefrontSettings />
        </div>
      )}
    </AppShell>
  );
}

function StorefrontSettings() {
  const [settings, setSettings] = useState<{
    seller_slug: string; storefront_enabled: boolean;
    storefront_tagline: string; reseller_margin_pct: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storefrontApi.getMySettings()
      .then(r => {
        const d = (r.data as { data: typeof settings }).data;
        setSettings({
          seller_slug: d?.seller_slug ?? '',
          storefront_enabled: d?.storefront_enabled ?? false,
          storefront_tagline: d?.storefront_tagline ?? '',
          reseller_margin_pct: d?.reseller_margin_pct ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      await storefrontApi.updateSettings({
        seller_slug: settings.seller_slug || undefined,
        storefront_enabled: settings.storefront_enabled,
        storefront_tagline: settings.storefront_tagline || undefined,
        reseller_margin_pct: settings.reseller_margin_pct,
      });
      toast.success('Storefront settings saved');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded || !settings) return null;

  const storefrontUrl = settings.seller_slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${settings.seller_slug}`
    : null;

  return (
    <div className="nm-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Store className="w-5 h-5 text-nm-primary" />
        <h2 className="text-base font-bold text-nm-text dark:text-nm-text-dark">Reseller Storefront</h2>
      </div>
      <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted">
        Your personal mini-catalogue — share a link and buyers can browse all your live listings with your custom margin.
      </p>

      {/* Enable toggle */}
      <div className="flex items-center justify-between py-3 border-b border-nm-border dark:border-nm-border-dark">
        <div>
          <p className="text-sm font-semibold text-nm-text dark:text-nm-text-dark">Enable Storefront</p>
          <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">Make your catalogue publicly accessible</p>
        </div>
        <button onClick={() => setSettings(s => s ? { ...s, storefront_enabled: !s.storefront_enabled } : s)}
          className="text-nm-primary">
          {settings.storefront_enabled
            ? <ToggleRight className="w-8 h-8" />
            : <ToggleLeft className="w-8 h-8 text-gray-400" />}
        </button>
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-semibold text-nm-text-muted uppercase tracking-wider mb-1.5">
          Storefront URL
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-nm-text-muted flex-shrink-0">/s/</span>
          <input value={settings.seller_slug}
            onChange={e => setSettings(s => s ? { ...s, seller_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') } : s)}
            placeholder="your-shop-name"
            className="nm-input flex-1 text-sm"
          />
        </div>
        {storefrontUrl && (
          <a href={storefrontUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-nm-primary mt-1.5 hover:underline">
            <ExternalLink className="w-3.5 h-3.5" /> Preview storefront
          </a>
        )}
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-xs font-semibold text-nm-text-muted uppercase tracking-wider mb-1.5">
          Tagline <span className="font-normal text-nm-text-muted">(optional)</span>
        </label>
        <input value={settings.storefront_tagline}
          onChange={e => setSettings(s => s ? { ...s, storefront_tagline: e.target.value } : s)}
          maxLength={200}
          placeholder="Best deals on surplus stock — pan India"
          className="nm-input text-sm"
        />
      </div>

      {/* Reseller margin */}
      <div>
        <label className="block text-xs font-semibold text-nm-text-muted uppercase tracking-wider mb-1.5">
          Reseller Margin %
        </label>
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={50} step={0.5}
            value={settings.reseller_margin_pct}
            onChange={e => setSettings(s => s ? { ...s, reseller_margin_pct: parseFloat(e.target.value) } : s)}
            className="flex-1 accent-nm-primary"
          />
          <span className="text-base font-bold text-nm-primary w-14 text-right">
            {settings.reseller_margin_pct}%
          </span>
        </div>
        <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted mt-1">
          Prices on your storefront will be marked up by this percentage. Buyers see the higher price; you earn the margin.
        </p>
      </div>

      <button onClick={save} disabled={saving}
        className="nm-btn-seller w-full flex items-center justify-center gap-2 py-3 font-bold">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
          : <><Store className="w-4 h-4" />Save Storefront Settings</>}
      </button>
    </div>
  );
}

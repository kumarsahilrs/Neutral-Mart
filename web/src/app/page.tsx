'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Package } from 'lucide-react';
import { TopNav, ListingCard, Brand } from '@/components/ui';
import { inventoryApi, type Listing } from '@/lib/api';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';

const SECTORS = ['Electronics', 'Textiles & Apparel', 'FMCG', 'Auto Parts', 'Home & Kitchen', 'Footwear', 'Toys', 'Cosmetics'];
const HERO_STATS = [['₹240Cr+', 'GMV liquidated'], ['12,400+', 'live lots'], ['74%', 'avg capital recovered']];

function Countdown() {
  const [s, setS] = useState(4 * 3600 + 12 * 60 + 55);
  useEffect(() => {
    const t = setInterval(() => setS(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return <span className="num">{p(hh)}:{p(mm)}:{p(ss)}</span>;
}

export default function HomePage() {
  const router = useRouter();
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [flashListings, setFlash] = useState<Listing[]>([]);
  const [featuredListings, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  // AI match banner — personalised for logged-in buyers
  const [matchedDeals, setMatchedDeals] = useState<{ count: number; sectors: string[] } | null>(null);

  const load = useCallback(async () => {
    try {
      const [fRes, featRes] = await Promise.all([
        inventoryApi.getListings({ limit: 4, featured: true } as Parameters<typeof inventoryApi.getListings>[0]),
        inventoryApi.getListings({ limit: 8, sort_by: 'newest' } as Parameters<typeof inventoryApi.getListings>[0]),
      ]);
      const rows = (r: unknown) => {
        const d = (r as { data?: { rows?: Listing[] } | Listing[] })?.data;
        return Array.isArray(d) ? d : ((d as { rows?: Listing[] })?.rows ?? []);
      };
      setFlash(rows(fRes)); setFeatured(rows(featRes));
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  // Load AI-personalised match count for logged-in buyers
  useEffect(() => {
    if (!isAuthenticated()) return;
    const user = getUser();
    if (user?.role !== 'buyer') return;
    api.get('/search/deal-feed?limit=1').then(res => {
      const d = (res.data as { data?: { total?: number; rows?: unknown[]; sector_interests?: string[] } })?.data;
      const count = d?.total ?? (d?.rows ?? []).length;
      if (count > 0) setMatchedDeals({ count, sectors: d?.sector_interests ?? [] });
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ background: 'var(--nm-paper)', minHeight: '100vh', overflowX: 'hidden' }}>
      <TopNav />

      {/* ── AI Match Banner (logged-in buyers only) ─────────────────────── */}
      {matchedDeals && matchedDeals.count > 0 && (
        <div
          className="flex items-center justify-between flex-wrap gap-3"
          style={{ background: 'var(--nm-deep)', color: '#fff', padding: '12px 36px' }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 18 }}>✨</span>
            <div>
              <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>
                {matchedDeals.count.toLocaleString('en-IN')} deals matched for you today
              </span>
              {matchedDeals.sectors.length > 0 && (
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.65)', marginLeft: 10 }}>
                  in {matchedDeals.sectors.slice(0, 3).join(', ')}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/listings?sort_by=deal_feed"
            className="nm-btn-gold no-underline"
            style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
          >
            See your deals →
          </Link>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--nm-deep)', color: '#fff', padding: '56px 36px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(244,168,42,.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 180, bottom: -120, width: 260, height: 260, borderRadius: '50%', background: 'rgba(47,128,73,.18)', pointerEvents: 'none' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 40, alignItems: 'center', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div>
            <span className="nm-pill" style={{ background: 'rgba(244,168,42,.18)', color: '#f4a82a', marginBottom: 20, display: 'inline-flex' }}>
              ⚡ India's B2B liquidation mandi
            </span>
            <h1 className="disp" style={{ fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1.02, fontWeight: 800, margin: '0 0 18px', letterSpacing: '-.02em' }}>
              Dead inventory,<br /><span style={{ color: '#f4a82a' }}>turned into cash.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', maxWidth: 480, margin: '0 0 28px' }}>
              Liquidate excess, returns and ageing stock to verified bulk buyers — escrow-protected, freight included, paid out fast.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/seller-register" className="nm-btn-gold no-underline" style={{ fontSize: 15.5, padding: '15px 22px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Sell Now <ArrowRight size={16} />
              </Link>
              <Link href="/listings" className="no-underline flex items-center gap-2" style={{ padding: '15px 22px', borderRadius: 12, background: 'rgba(255,255,255,.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,.25)', fontSize: 15.5, fontFamily: '"Bricolage Grotesque",sans-serif', fontWeight: 600 }}>
                Browse Deals
              </Link>
            </div>
            <div className="flex gap-9 mt-10 flex-wrap">
              {HERO_STATS.map(([v, k]) => (
                <div key={k}>
                  <div className="num" style={{ fontSize: 26, fontWeight: 800, color: '#f4a82a' }}>{v}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Tilted lot card */}
          <div className="relative hidden lg:block">
            <div className="nm-card" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', padding: 16, transform: 'rotate(-2deg)', borderRadius: 18 }}>
              <div style={{ height: 230, background: 'rgba(255,255,255,.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={64} style={{ color: 'rgba(255,255,255,.3)' }} />
              </div>
              <div className="flex justify-between items-center mt-3.5 px-1">
                <div>
                  <div className="disp" style={{ fontSize: 16, fontWeight: 700 }}>Galaxy M14 5G lot</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>420 units · Grade B</div>
                </div>
                <span className="num" style={{ fontSize: 24, fontWeight: 800, color: '#f4a82a' }}>₹6,200</span>
              </div>
            </div>
            <div className="nm-card absolute" style={{ bottom: -22, left: -18, background: 'var(--nm-gold)', border: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, transform: 'rotate(-2deg)', borderRadius: 16 }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--nm-deep)', color: '#f4a82a', display: 'grid', placeItems: 'center' }}>
                <Shield size={18} />
              </span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--nm-deep)', fontWeight: 700 }}>Escrow secured</div>
                <div className="num disp" style={{ fontSize: 16, fontWeight: 800, color: 'var(--nm-deep)' }}>+₹3.3L margin</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ padding: '36px', maxWidth: 1240, margin: '0 auto' }}>
        {/* Sectors */}
        <div className="flex gap-2.5 flex-wrap mb-10">
          {SECTORS.map((s) => (
            <button key={s} onClick={() => { setActiveSector(s === activeSector ? null : s); router.push(`/listings?sector=${encodeURIComponent(s)}`); }}
              className="nm-pill"
              style={{ fontSize: 13.5, padding: '10px 18px', background: activeSector === s ? 'var(--nm-green)' : 'var(--nm-card)', color: activeSector === s ? '#fff' : 'var(--nm-ink)', border: `1px solid ${activeSector === s ? 'var(--nm-green)' : 'var(--nm-line)'}`, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Flash sales */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="disp" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>🔥 Flash sales</h2>
          <span className="nm-pill" style={{ background: 'var(--nm-deep)', color: '#f4a82a', fontWeight: 700 }}>
            Ends in <Countdown />
          </span>
          <Link href="/listings?price_type=flash_sale" className="no-underline ml-auto" style={{ fontSize: 13.5, color: 'var(--nm-green)', fontWeight: 700 }}>View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-11">
          {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="nm-card animate-pulse" style={{ height: 320 }} />)
            : (flashListings.length ? flashListings : featuredListings).slice(0, 4).map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>

        {/* Featured */}
        <h2 className="disp" style={{ fontSize: 24, fontWeight: 800, margin: '0 0 18px' }}>Featured deals</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-11">
          {loading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="nm-card animate-pulse" style={{ height: 320 }} />)
            : featuredListings.slice(0, 8).map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>

        {/* Seller CTA */}
        <div className="gradient-hero flex items-center gap-8 flex-wrap" style={{ borderRadius: 24, color: '#fff', padding: '40px 44px' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 className="disp" style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px' }}>Sitting on dead stock?</h2>
            <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,.75)', margin: 0, maxWidth: 520, lineHeight: 1.5 }}>
              List it in minutes. Reach 8,000+ verified bulk buyers, set your price or take offers, and recover working capital this week.
            </p>
          </div>
          <Link href="/seller-register" className="nm-btn-gold no-underline flex items-center gap-2" style={{ fontSize: 15.5, padding: '15px 22px', flexShrink: 0 }}>
            List your inventory <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center flex-wrap gap-4" style={{ padding: '28px 36px', borderTop: '1px solid var(--nm-line)', color: 'var(--nm-muted)', fontSize: 13 }}>
        <Brand />
        <span className="ml-auto">© 2026 NirmalMandi · Escrow by RazorpayX · Logistics by Delhivery</span>
      </footer>
    </div>
  );
}

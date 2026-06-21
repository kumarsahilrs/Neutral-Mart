// shared.jsx — content data, placeholder image, icon set, and the design brief.
// Everything exported to window for the per-direction screen files.

// ── Shared content (same data across all three directions) ──────────────
const NM = {
  listing: {
    title: 'Samsung Galaxy M14 5G · Sealed-Box Returns Lot',
    sector: 'Electronics',
    grade: 'B',
    gradeLabel: 'Grade B · Open-box, fully tested',
    seller: 'Verité Distributors',
    sellerCity: 'Surat, Gujarat',
    sellerRating: 4.6,
    sellerResponse: '94% · under 2h',
    verified: true,
    ask: 6200,
    mrp: 13999,
    resale: 9500,
    qty: 420,
    moq: 50,
    lotType: 'Partial lot OK',
    stockType: 'Customer returns',
    views: 1240,
    watching: 38,
    agingDays: 22,
  },
  seller: {
    name: 'Verité Distributors',
    gmv: '₹18.4L',
    gmvChange: '+12.4%',
    payout: '₹4.28L',
    payoutDate: 'Jun 12',
    bankLast4: '4471',
    activeListings: 27,
    awaitingAction: 6,
    aging: 5,
  },
  orders: [
    { id: 'NM-90412', buyer: 'Khanna Mobiles', item: 'iPhone 12 64GB · A-grade', qty: 30, amount: '₹9,60,000', status: 'Shipped' },
    { id: 'NM-90388', buyer: 'Surplus Bazaar',  item: 'Galaxy M14 returns', qty: 50, amount: '₹3,10,000', status: 'Awaiting ship' },
    { id: 'NM-90377', buyer: 'Deccan Retail',    item: 'boAt earbuds · excess', qty: 200, amount: '₹1,40,000', status: 'In escrow' },
    { id: 'NM-90351', buyer: 'Metro Wholesale',  item: 'Mi power banks lot', qty: 120, amount: '₹84,000', status: 'Delivered' },
    { id: 'NM-90340', buyer: 'Janta Traders',    item: 'Realme C-series dead', qty: 80, amount: '₹2,24,000', status: 'Disputed' },
  ],
  // capital recovery numbers (₹)
  recovery: { gmv: 1840000, feePct: 2.5, fee: 46000, gstOnFee: 8280, net: 1785720 },
};

// ── Placeholder product image — a clean labelled tile, never a fake photo ──
function NMImg({ w = '100%', h = 200, label = 'PRODUCT IMAGE', tone = '#e7e3da', fg = 'rgba(60,50,40,.5)', radius = 0, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius, background: tone,
      backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,.025) 0 14px, transparent 14px 28px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      overflow: 'hidden', ...style,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: fg }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="3" y="4" width="18" height="16" rx="1.5" /><circle cx="8.5" cy="9.5" r="1.6" />
          <path d="M21 16l-5-5L7 20" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 600, fontFamily: 'inherit' }}>{label}</span>
      </div>
    </div>
  );
}

// ── Icon set (inline, stroke-based, inherit color) ─────────────────────
const I = {
  search: 'M11 4a7 7 0 105.2 11.7L21 20M11 4a7 7 0 014.9 12',
  heart: 'M12 20s-7-4.3-9.3-8.3C1 8.5 2.6 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.4 0 5 3.5 3.3 6.7C19 15.7 12 20 12 20z',
  shield: 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6l1-8z',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 01-3.4 0',
  truck: 'M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a1.6 1.6 0 100-3.2A1.6 1.6 0 007 18zM18 18a1.6 1.6 0 100-3.2 1.6 1.6 0 000 3.2z',
  check: 'M5 12l5 5L20 6',
  arrow: 'M5 12h14M13 5l7 7-7 7',
  spark: 'M12 3v6m0 6v6M3 12h6m6 0h6M6 6l3 3m6 6l3 3M18 6l-3 3m-6 6l-3 3',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  box: 'M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  wallet: 'M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 7l2-3h11l2 3M17 13h2',
  tag: 'M3 3h7l11 11-7 7L3 10V3zM7 7h.01',
};
function NMIcon({ d, size = 18, sw = 1.7, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ── Design brief card (intro section) ──────────────────────────────────
function NMBrief() {
  const Row = ({ k, v }) => (
    <div style={{ display: 'flex', gap: 14, padding: '11px 0', borderBottom: '1px solid #ece9e3' }}>
      <div style={{ flex: '0 0 150px', fontSize: 13, fontWeight: 600, color: '#0f5132' }}>{k}</div>
      <div style={{ flex: 1, fontSize: 13.5, color: '#3c352c', lineHeight: 1.5 }}>{v}</div>
    </div>
  );
  return (
    <div style={{ width: '100%', height: '100%', background: '#fbfaf7', fontFamily: '"DM Sans", sans-serif', padding: '40px 44px', overflow: 'hidden' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#0f5132', textTransform: 'uppercase', marginBottom: 18 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: '#0f5132', color: '#bef264', display: 'grid', placeItems: 'center' }}>
          <NMIcon d={I.box} size={13} />
        </span>
        NirmalMandi · Design review
      </div>
      <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 38, lineHeight: 1.05, letterSpacing: -1, margin: '0 0 14px', color: '#16130f' }}>
        Three directions for a<br />dead-stock liquidation marketplace.
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#5b5347', margin: '0 0 26px', maxWidth: 600 }}>
        The design system was empty, so I'm setting the visual language from scratch — anchored on a
        green "dead inventory&nbsp;→&nbsp;cash" palette. Each direction is shown on two surfaces: a buyer-facing
        <strong> Listing detail</strong> (the marketplace side) and a <strong>Seller dashboard</strong> (the data side).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
        {[
          ['A', 'Mandi Bold', 'Energetic, oversized, lime accents', '#0f5132', '#bef264'],
          ['B', 'Bazaar Warm', 'Approachable, marigold, vernacular', '#1f6b3a', '#f4a82a'],
          ['C', 'Terminal Dense', 'Power-user, compact, mono numerals', '#0b3d2e', '#5eead4'],
        ].map(([k, t, d, bg, ac]) => (
          <div key={k} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #ece9e3', background: '#fff' }}>
            <div style={{ height: 54, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
              <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 24, fontWeight: 700, color: '#fff' }}>{k}</span>
              <span style={{ width: 30, height: 16, borderRadius: 4, background: ac }} />
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#16130f', marginBottom: 4 }}>{t}</div>
              <div style={{ fontSize: 12, color: '#6b6256', lineHeight: 1.4 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Row k="Scope confirmed" v="Full end-to-end flow across all roles (buyer · seller · admin · public). This review covers the visual language first." />
        <Row k="Signature features" v="AI Market-it caption generator · Capital recovery estimator (seller) · Inventory aging heatmap (admin)." />
        <Row k="Devices" v="Desktop frames shown here for visual review; final build is responsive down to mobile." />
        <Row k="Next" v="Pick a direction (or mix elements). I'll lock the system and build out all 35 modules screen-by-screen." />
      </div>
    </div>
  );
}

Object.assign(window, { NM, NMImg, NMIcon, I, NMBrief });

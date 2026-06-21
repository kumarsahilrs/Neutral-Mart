// public.jsx — Public / unregistered visitor screens (Direction A layout · warm theme).
const { T, Brand, Btn, Pill, Badge, TopNav, Avatar, Field, Ic } = window.DS;
const PI = window.I, PImg = window.NMImg;

const SECTORS = ['Electronics', 'Textiles & Apparel', 'FMCG', 'Auto Parts', 'Home & Kitchen', 'Footwear', 'Toys', 'Cosmetics'];

const LISTINGS = [
  { t: 'Galaxy M14 5G · Sealed-box returns', sec: 'Electronics', g: 'B', ask: '₹6,200', mrp: '₹13,999', save: 56, seller: 'Verité Distributors', city: 'Surat', moq: 50, views: 1240, tone: '#e9e2d2', flash: true },
  { t: 'Cotton kurta lot · mixed sizes', sec: 'Textiles', g: 'A', ask: '₹210', mrp: '₹699', save: 70, seller: 'Raghav Textiles', city: 'Tirupur', moq: 200, views: 880, tone: '#e6e8df' },
  { t: 'boAt Airdopes · excess stock', sec: 'Electronics', g: 'A', ask: '₹540', mrp: '₹1,299', save: 58, seller: 'SoundHub Wholesale', city: 'Delhi', moq: 100, views: 2110, tone: '#e2e6e8', flash: true },
  { t: 'Stainless steel cookware set', sec: 'Home & Kitchen', g: 'B', ask: '₹820', mrp: '₹2,199', save: 63, seller: 'Metro Surplus', city: 'Mumbai', moq: 40, views: 640, tone: '#ece6da' },
  { t: 'Running shoes · surplus sizes', sec: 'Footwear', g: 'B', ask: '₹560', mrp: '₹1,899', save: 70, seller: 'StridePoint', city: 'Agra', moq: 60, views: 970, tone: '#e8e3d6' },
  { t: 'Mi power banks 10000mAh', sec: 'Electronics', g: 'A', ask: '₹700', mrp: '₹1,499', save: 53, seller: 'ChargeUp Traders', city: 'Pune', moq: 80, views: 1530, tone: '#e3e7e4' },
  { t: 'Denim jeans · branded returns', sec: 'Apparel', g: 'C', ask: '₹340', mrp: '₹1,599', save: 79, seller: 'Indigo Lots', city: 'Bengaluru', moq: 150, views: 720, tone: '#dfe2e6' },
  { t: 'Face serum · short-expiry FMCG', sec: 'Cosmetics', g: 'A', ask: '₹95', mrp: '₹449', save: 79, seller: 'GlowMart', city: 'Noida', moq: 300, views: 1190, tone: '#ece4e0' },
  { t: 'Car floor mats · overstock', sec: 'Auto Parts', g: 'B', ask: '₹260', mrp: '₹799', save: 67, seller: 'AutoBay', city: 'Ludhiana', moq: 100, views: 510, tone: '#e6e3da' },
];

function ListingCard({ l, compact }) {
  const gtone = { A: [T.green, T.green3soft], B: [T.ink, '#efe9dd'], C: ['#a9690a', T.goldSoft] }[l.g];
  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        {l.flash && <span className="pill" style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: T.red, color: '#fff', fontWeight: 700 }}>🔥 Flash</span>}
        <span style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 32, height: 32, borderRadius: 999, background: '#fff', display: 'grid', placeItems: 'center', color: T.muted, boxShadow: '0 1px 3px rgba(0,0,0,.12)' }}><Ic d={PI.heart} size={16} /></span>
        <PImg h={compact ? 150 : 168} label={l.sec.toUpperCase()} tone={l.tone} />
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Pill color={T.green} bg={T.green3soft} icon={PI.tag}>{l.sec}</Pill>
          <Pill color={gtone[0]} bg={gtone[1]}>Grade {l.g}</Pill>
        </div>
        <div className="disp" style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.25 }}>{l.t}</div>
        <div style={{ fontSize: 12.5, color: T.muted }}>{l.seller} · {l.city}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 'auto' }}>
          <span className="num" style={{ fontSize: 24, fontWeight: 800, color: T.green }}>{l.ask}</span>
          <span style={{ fontSize: 13, color: T.faint, textDecoration: 'line-through', marginBottom: 3 }}>{l.mrp}</span>
          <span className="pill" style={{ marginLeft: 'auto', background: T.gold, color: T.deep, fontWeight: 800, marginBottom: 1 }}>−{l.save}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted, borderTop: `1px solid ${T.line2}`, paddingTop: 9 }}>
          <span>MOQ {l.moq}</span><span>{l.views.toLocaleString()} views</span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────  HOMEPAGE  ───────────────────────────────
function Home() {
  return (
    <div className="nm" style={{ overflowY: 'auto' }}>
      <TopNav active="Browse Deals" />
      {/* hero */}
      <div style={{ background: T.deep, color: '#fff', padding: '56px 36px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(244,168,42,.12)' }} />
        <div style={{ position: 'absolute', right: 180, bottom: -120, width: 260, height: 260, borderRadius: '50%', background: 'rgba(47,128,73,.18)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 40, position: 'relative', alignItems: 'center' }}>
          <div>
            <Pill bg="rgba(244,168,42,.18)" color={T.gold2} icon={PI.bolt} style={{ marginBottom: 20 }}>India's B2B liquidation mandi</Pill>
            <h1 className="disp" style={{ fontSize: 56, lineHeight: 1.02, fontWeight: 800, margin: '0 0 18px', letterSpacing: '-.02em' }}>
              Dead inventory,<br /><span style={{ color: T.gold2 }}>turned into cash.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', maxWidth: 480, margin: '0 0 28px' }}>
              Liquidate excess, returns and ageing stock to verified bulk buyers — escrow-protected, freight included, paid out fast.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn variant="gold" size="lg" iconRight={PI.arrow}>Sell Now</Btn>
              <Btn variant="ghost" size="lg" style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,.25)' }}>Browse Deals</Btn>
            </div>
            <div style={{ display: 'flex', gap: 36, marginTop: 38 }}>
              {[['₹240Cr+', 'GMV liquidated'], ['12,400+', 'live lots'], ['74%', 'avg capital recovered']].map(([v, k]) => (
                <div key={k}>
                  <div className="num" style={{ fontSize: 26, fontWeight: 800, color: T.gold2 }}>{v}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="card" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', padding: 16, transform: 'rotate(-2deg)' }}>
              <PImg h={230} label="FEATURED LOT" tone="rgba(255,255,255,.1)" fg="rgba(255,255,255,.5)" radius={12} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '0 4px' }}>
                <div>
                  <div className="disp" style={{ fontSize: 16, fontWeight: 700 }}>Galaxy M14 5G lot</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>420 units · Grade B</div>
                </div>
                <span className="num" style={{ fontSize: 24, fontWeight: 800, color: T.gold2 }}>₹6,200</span>
              </div>
            </div>
            <div className="card" style={{ position: 'absolute', bottom: -22, left: -18, background: T.gold, border: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, transform: 'rotate(-2deg)' }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: T.deep, color: T.gold2, display: 'grid', placeItems: 'center' }}><Ic d={PI.shield} size={18} /></span>
              <div><div style={{ fontSize: 11, color: T.deep, fontWeight: 700 }}>Escrow secured</div><div className="num disp" style={{ fontSize: 16, fontWeight: 800, color: T.deep }}>+₹3.3L margin</div></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '36px' }}>
        {/* sectors */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          {SECTORS.map((s, i) => (
            <span key={s} className="pill" style={{ fontSize: 13.5, padding: '10px 18px', background: i === 0 ? T.green : T.card, color: i === 0 ? '#fff' : T.ink, border: `1px solid ${i === 0 ? T.green : T.line}`, fontWeight: 600, cursor: 'pointer' }}>{s}</span>
          ))}
        </div>

        {/* flash */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <h2 className="disp" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>🔥 Flash sales</h2>
          <span className="pill num" style={{ background: T.deep, color: T.gold2, fontWeight: 700 }}>Ends in 04:12:55</span>
          <span style={{ marginLeft: 'auto', fontSize: 13.5, color: T.green, fontWeight: 700, cursor: 'pointer' }}>View all →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 44 }}>
          {LISTINGS.filter((l) => l.flash).concat([LISTINGS[5], LISTINGS[7]]).slice(0, 4).map((l, i) => <ListingCard key={i} l={l} />)}
        </div>

        {/* featured */}
        <h2 className="disp" style={{ fontSize: 24, fontWeight: 800, margin: '0 0 18px' }}>Featured deals</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 44 }}>
          {LISTINGS.slice(0, 8).map((l, i) => <ListingCard key={i} l={l} />)}
        </div>

        {/* seller CTA */}
        <div style={{ borderRadius: 24, background: `linear-gradient(100deg, ${T.green}, ${T.deep})`, color: '#fff', padding: '40px 44px', display: 'flex', alignItems: 'center', gap: 30 }}>
          <div style={{ flex: 1 }}>
            <h2 className="disp" style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px' }}>Sitting on dead stock?</h2>
            <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,.75)', margin: 0, maxWidth: 520, lineHeight: 1.5 }}>List it in minutes. Reach 8,000+ verified bulk buyers, set your price or take offers, and recover working capital this week.</p>
          </div>
          <Btn variant="gold" size="lg" iconRight={PI.arrow}>List your inventory</Btn>
        </div>
      </div>

      <div style={{ padding: '28px 36px', borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 16, color: T.muted, fontSize: 13 }}>
        <Brand /><span style={{ marginLeft: 'auto' }}>© 2026 NirmalMandi · Escrow by RazorpayX · Logistics by Delhivery</span>
      </div>
    </div>
  );
}

// ───────────────────────────────  BROWSE  ───────────────────────────────
function Browse() {
  const FILT = [['Sector', SECTORS.slice(0, 5)], ['Condition grade', ['Grade A', 'Grade B', 'Grade C', 'Scrap']], ['Stock type', ['Dead stock', 'Excess', 'Surplus', 'Returns']], ['Lot type', ['Full lot', 'Partial lot OK']]];
  return (
    <div className="nm" style={{ overflowY: 'auto' }}>
      <TopNav active="Browse Deals" />
      <div style={{ padding: '24px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <h1 className="disp" style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>All deals</h1>
          <span style={{ fontSize: 13.5, color: T.muted }}>12,408 lots</span>
          <div className="ipt" style={{ marginLeft: 'auto', width: 320, borderRadius: 999 }}><Ic d={PI.search} size={16} style={{ color: T.faint }} /><span style={{ color: T.faint }}>Search lots…</span></div>
          <div className="ipt" style={{ borderRadius: 999, padding: '12px 16px' }}>Sort: <span style={{ color: T.ink, fontWeight: 600 }}>Newest</span> ▾</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr', gap: 24, marginTop: 22 }}>
          {/* filters */}
          <div className="card" style={{ padding: '20px', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="disp" style={{ fontSize: 15, fontWeight: 700 }}>Filters</span>
              <span style={{ fontSize: 12.5, color: T.green, fontWeight: 600 }}>Clear</span>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div className="label" style={{ marginBottom: 10 }}>Price / unit</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="ipt" style={{ flex: 1, justifyContent: 'center', padding: '9px' }}>₹0</div>
                <div className="ipt" style={{ flex: 1, justifyContent: 'center', padding: '9px' }}>₹15k</div>
              </div>
              <div style={{ height: 4, background: T.line, borderRadius: 2, margin: '14px 0 4px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10%', right: '35%', height: '100%', background: T.green, borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: '10%', top: -4, width: 12, height: 12, borderRadius: 999, background: '#fff', border: `2px solid ${T.green}` }} />
                <div style={{ position: 'absolute', left: '65%', top: -4, width: 12, height: 12, borderRadius: 999, background: '#fff', border: `2px solid ${T.green}` }} />
              </div>
            </div>
            {FILT.map(([g, opts]) => (
              <div key={g} style={{ marginBottom: 18 }}>
                <div className="label" style={{ marginBottom: 11 }}>{g}</div>
                {opts.map((o, i) => (
                  <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0', fontSize: 13, color: T.ink }}>
                    <span style={{ width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${i === 0 ? T.green : T.line}`, background: i === 0 ? T.green : '#fff', display: 'grid', placeItems: 'center' }}>{i === 0 && <Ic d={PI.check} size={11} style={{ color: '#fff' }} />}</span>
                    {o}
                  </label>
                ))}
              </div>
            ))}
          </div>
          {/* grid */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Newest', 'Price: Low→High', 'Most viewed', 'Ageing first'].map((s, i) => (
                <span key={s} className={`tab ${i === 0 ? 'on' : ''}`}>{s}</span>
              ))}
              <span className="tab" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}><Ic d={PI.grid} size={14} />Compare (2)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {LISTINGS.map((l, i) => <ListingCard key={i} l={l} compact />)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
              {['‹', '1', '2', '3', '…', '42', '›'].map((p, i) => (
                <span key={i} className="num" style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 600, background: p === '1' ? T.green : T.card, color: p === '1' ? '#fff' : T.ink, border: `1px solid ${p === '1' ? T.green : T.line}` }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Pub = { Home, Browse, ListingCard, LISTINGS, SECTORS };
Object.assign(window, { Home, Browse });

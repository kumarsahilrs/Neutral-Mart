// public2.jsx — Listing detail, Compare drawer, Login, Seller registration.
const { T: T2, Brand: Brand2, Btn: Btn2, Pill: Pill2, Badge: Badge2, TopNav: TopNav2, Avatar: Av2, Field: Fld2, Ic: Ic2 } = window.DS;
const J = window.I, JImg = window.NMImg, JNM = window.NM;

// ───────────────────────────  LISTING DETAIL  ───────────────────────────
function ListingDetail() {
  const L = JNM.listing;
  return (
    <div className="nm" style={{ overflowY: 'auto' }}>
      <TopNav2 active="Browse Deals" />
      {/* urgency */}
      <div style={{ background: `linear-gradient(90deg,${T2.gold},${T2.gold2})`, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 36px', color: T2.deep }}>
        <Ic2 d={J.bolt} size={17} sw={2.3} />
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>Ageing {L.agingDays} days · seller is open to offers</span>
        <span className="num" style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 800, background: T2.deep, color: T2.gold2, padding: '5px 12px', borderRadius: 999 }}>Flash ends 04:12:55</span>
      </div>

      <div style={{ padding: '24px 36px 40px' }}>
        <div style={{ fontSize: 12.5, color: T2.faint, marginBottom: 18 }}>Deals / Electronics / Smartphones</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.32fr 1fr', gap: 30 }}>
          {/* gallery */}
          <div>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: `1px solid ${T2.line}` }}>
              <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, display: 'flex', gap: 8 }}>
                <Pill2 bg={T2.red} color="#fff" style={{ fontWeight: 700 }}>🔥 Flash sale</Pill2>
                <Pill2 bg="#fff" color={T2.ink} style={{ fontWeight: 700 }}>−56% off MRP</Pill2>
              </div>
              <JImg h={420} label="GALAXY M14 5G · SEALED BOX" tone="#e9e2d2" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 12 }}>
              {['FRONT', 'BACK', 'BOX', 'LABEL'].map((t, i) => (
                <JImg key={t} h={92} label={t} radius={12} tone={i === 0 ? '#ddd6c4' : '#efe8d8'} style={{ border: i === 0 ? `2px solid ${T2.green}` : `1px solid ${T2.line}` }} />
              ))}
            </div>
            <div style={{ marginTop: 26 }}>
              <h3 className="disp" style={{ fontSize: 18, fontWeight: 700, margin: '0 0 14px' }}>Lot specifications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Model', 'Galaxy M14 5G (6/128GB)'], ['Condition', 'Grade B · open-box'], ['Warranty', 'No brand warranty'], ['Units', '420 pcs'], ['Packaging', 'Original sealed box'], ['Batch', '2024 manufacture']].map(([k, v]) => (
                  <div key={k} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderRadius: 12 }}>
                    <span style={{ fontSize: 12.5, color: T2.muted }}>{k}</span><span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* info */}
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <Pill2 color={T2.green} bg={T2.green3soft} icon={J.tag}>{L.sector}</Pill2>
              <Pill2 color="#fff" bg={T2.ink}>Grade {L.grade}</Pill2>
              <Pill2 color={T2.green} bg={T2.green3soft} icon={J.shield}>Verified · ★ {L.sellerRating}</Pill2>
            </div>
            <h1 className="disp" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1, margin: '0 0 8px' }}>{L.title}</h1>
            <div style={{ fontSize: 13.5, color: T2.muted, marginBottom: 18 }}>by <strong style={{ color: T2.green }}>{L.seller}</strong> · {L.sellerCity}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 6 }}>
              <span className="num" style={{ fontSize: 44, fontWeight: 800, color: T2.green }}>₹6,200</span>
              <span style={{ fontSize: 14, color: T2.muted, marginBottom: 9 }}>/ unit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <span style={{ fontSize: 15, color: T2.faint, textDecoration: 'line-through' }}>MRP ₹13,999</span>
              <Pill2 bg={T2.gold} color={T2.deep} style={{ fontWeight: 800 }}>Save 56%</Pill2>
              <span style={{ fontSize: 13, color: T2.muted }}>· Resale est. <strong style={{ color: T2.ink }}>₹9,500</strong></span>
            </div>

            {/* calculator */}
            <div className="card" style={{ padding: 20, background: '#fdf8ee', borderColor: T2.goldLine }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: T2.green, color: '#fff', display: 'grid', placeItems: 'center' }}><Ic2 d={J.spark} size={14} /></span>
                <span className="disp" style={{ fontSize: 15, fontWeight: 700 }}>Lot calculator</span>
                <span style={{ marginLeft: 'auto', fontSize: 11.5, color: T2.muted }}>MOQ {L.moq} · {L.lotType}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: T2.muted }}>Quantity</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: `1px solid ${T2.line}`, borderRadius: 999, padding: '8px 16px' }}>
                  <span style={{ color: T2.faint, fontSize: 19 }}>−</span><span className="num" style={{ fontSize: 18, fontWeight: 800 }}>100</span><span style={{ color: T2.green, fontSize: 19 }}>+</span>
                </div>
                <span style={{ fontSize: 12.5, color: T2.muted }}>units</span>
              </div>
              {[['Subtotal (100 × ₹6,200)', '₹6,20,000'], ['Platform fee · 2.5%', '₹15,500'], ['You pay', '₹6,35,500', true]].map(([k, v, b]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: b ? `1px dashed ${T2.goldLine}` : 'none' }}>
                  <span style={{ fontSize: 13, color: b ? T2.ink : T2.muted, fontWeight: b ? 800 : 400 }}>{k}</span>
                  <span className="num" style={{ fontSize: b ? 17 : 13.5, fontWeight: 800, color: b ? T2.green : T2.ink }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '13px 15px', background: T2.green, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: 12, color: T2.gold2, fontWeight: 700 }}>Est. resale margin</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>at ₹9,500/unit</div></div>
                <div style={{ textAlign: 'right' }}><span className="num" style={{ fontSize: 25, fontWeight: 800, color: '#fff' }}>+₹3,30,000</span><div style={{ fontSize: 12, color: T2.gold2, fontWeight: 700 }}>≈ 53% margin</div></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn2 variant="primary" size="lg" iconRight={J.arrow} style={{ flex: 1 }}>Buy now</Btn2>
              <Btn2 variant="gold" size="lg">Make offer</Btn2>
              <Btn2 variant="ghost" size="lg" style={{ width: 54, padding: 0, color: T2.red }}><Ic2 d={J.heart} size={20} /></Btn2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
              {[['420', 'units available'], ['38', 'buyers watching'], ['Returns', 'stock type']].map(([v, k]) => (
                <div key={k} className="card" style={{ textAlign: 'center', padding: '13px 8px', borderRadius: 12 }}>
                  <div className="num" style={{ fontSize: 20, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 11, color: T2.muted, marginTop: 2 }}>{k}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, padding: '14px 16px', background: T2.green3soft, borderRadius: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: T2.green, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic2 d={J.shield} size={19} /></span>
              <div><div style={{ fontSize: 13.5, fontWeight: 800, color: T2.green }}>Escrow-protected payment</div><div style={{ fontSize: 12.5, color: T2.muted, lineHeight: 1.45 }}>We hold your payment until you confirm the lot is received as described.</div></div>
            </div>
          </div>
        </div>

        {/* market-it */}
        <div style={{ marginTop: 30, borderRadius: 20, background: T2.deep, color: '#fff', padding: '26px 30px', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 30, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(244,168,42,.14)' }} />
          <div style={{ position: 'relative' }}>
            <Pill2 bg="rgba(244,168,42,.2)" color={T2.gold2} icon={J.spark} style={{ marginBottom: 14 }}>AI MARKET-IT</Pill2>
            <h3 className="disp" style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.15, margin: '0 0 10px' }}>Won the lot? Resell it in one tap.</h3>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.66)', lineHeight: 1.55, margin: 0 }}>Generate a ready-to-post caption for WhatsApp Business & Instagram with price, specs and a buy link.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Btn2 variant="gold" size="sm">WhatsApp caption</Btn2>
              <Btn2 variant="ghost" size="sm" style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,.28)' }}>Instagram</Btn2>
            </div>
          </div>
          <div style={{ position: 'relative', background: 'rgba(255,255,255,.07)', borderRadius: 14, padding: 18, border: '1px solid rgba(255,255,255,.12)' }}>
            <div style={{ fontSize: 11, color: T2.gold2, fontWeight: 700, letterSpacing: '.05em', marginBottom: 8 }}>GENERATED · WHATSAPP</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,.9)', margin: 0 }}>🔥 <strong>Galaxy M14 5G</strong> — sealed-box returns, fully tested. 6GB/128GB.<br />₹6,200/pc · MOQ 50 · 420 pcs available.<br />MRP ₹13,999 — grab at 56% off. DM to book 📦</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────  COMPARE DRAWER  ───────────────────────────
function Compare() {
  const cols = [window.Pub.LISTINGS[0], window.Pub.LISTINGS[2], window.Pub.LISTINGS[5]];
  const rows = [['Price / unit', (l) => l.ask, true], ['MRP', (l) => l.mrp], ['You save', (l) => `−${l.save}%`], ['Condition', (l) => `Grade ${l.g}`], ['Seller', (l) => l.seller], ['Location', (l) => l.city], ['MOQ', (l) => `${l.moq} units`], ['Sector', (l) => l.sec]];
  return (
    <div className="nm" style={{ background: 'rgba(20,73,42,.35)', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: 760, background: T2.paper, height: '100%', boxShadow: '-12px 0 40px rgba(0,0,0,.2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '22px 28px', borderBottom: `1px solid ${T2.line}` }}>
          <div><h2 className="disp" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Compare lots</h2><div style={{ fontSize: 13, color: T2.muted }}>3 of 3 selected</div></div>
          <span style={{ marginLeft: 'auto', width: 40, height: 40, borderRadius: 999, border: `1px solid ${T2.line}`, display: 'grid', placeItems: 'center', color: T2.muted, fontSize: 20 }}>×</span>
        </div>
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div />
            {cols.map((l, i) => (
              <div key={i} className="card" style={{ overflow: 'hidden' }}>
                <JImg h={90} label={l.sec.toUpperCase()} tone={l.tone} />
                <div style={{ padding: '10px 12px' }}><div className="disp" style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{l.t}</div></div>
              </div>
            ))}
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {rows.map(([k, fn, hl], ri) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', borderTop: ri ? `1px solid ${T2.line2}` : 'none', background: hl ? T2.green3soft : 'transparent' }}>
                <div style={{ padding: '13px 16px', fontSize: 12, color: T2.muted, fontWeight: 600 }}>{k}</div>
                {cols.map((l, ci) => <div key={ci} className={hl ? 'num' : ''} style={{ padding: '13px 16px', fontSize: hl ? 16 : 13, fontWeight: hl ? 800 : 500, color: hl ? T2.green : T2.ink }}>{fn(l)}</div>)}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 14, marginTop: 16 }}>
            <div />{cols.map((l, i) => <Btn2 key={i} variant={i === 0 ? 'primary' : 'outline'} full>View lot</Btn2>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────  LOGIN (OTP)  ───────────────────────────
function Login() {
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <div style={{ flex: 1, background: T2.deep, color: '#fff', padding: '48px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -100, bottom: -100, width: 340, height: 340, borderRadius: '50%', background: 'rgba(244,168,42,.1)' }} />
        <Brand2 light />
        <div style={{ position: 'relative' }}>
          <h1 className="disp" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.05, margin: '0 0 16px' }}>Welcome back to<br />the mandi.</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.72)', maxWidth: 380, lineHeight: 1.55 }}>Track your orders, watchlist and escrow — all in one place.</p>
        </div>
        <div style={{ display: 'flex', gap: 28, position: 'relative' }}>
          {[['8,000+', 'verified buyers'], ['₹240Cr+', 'liquidated'], ['74%', 'avg recovery']].map(([v, k]) => (
            <div key={k}><div className="num" style={{ fontSize: 22, fontWeight: 800, color: T2.gold2 }}>{v}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{k}</div></div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 380 }}>
          <h2 className="disp" style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Sign in</h2>
          <p style={{ fontSize: 14, color: T2.muted, margin: '0 0 26px' }}>We'll send a one-time code to your phone.</p>
          <Fld2 label="Phone number" value="+91 98765 43210" icon={J.bell} />
          <div style={{ height: 14 }} />
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T2.ink, marginBottom: 7 }}>Enter OTP</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
            {['4', '7', '1', '9', '', ''].map((d, i) => (
              <div key={i} className="num" style={{ flex: 1, height: 54, borderRadius: 12, border: `1.5px solid ${d ? T2.green : T2.line}`, background: d ? '#fff' : T2.panel, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800, color: T2.ink }}>{d}</div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: T2.muted, marginBottom: 22 }}>Resend code in <span className="num" style={{ color: T2.green, fontWeight: 700 }}>0:24</span></div>
          <Btn2 variant="primary" size="lg" full iconRight={J.arrow}>Verify & continue</Btn2>
          <div style={{ textAlign: 'center', fontSize: 13, color: T2.muted, marginTop: 18 }}>New seller? <span style={{ color: T2.green, fontWeight: 700 }}>Register your business →</span></div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────  SELLER REGISTRATION  ───────────────────────────
function SellerRegister() {
  const steps = ['Phone', 'Business', 'GST & PAN', 'Bank'];
  const active = 1;
  return (
    <div className="nm" style={{ overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 72, padding: '0 36px', borderBottom: `1px solid ${T2.line}`, background: T2.card }}>
        <Brand2 /><span style={{ marginLeft: 'auto', fontSize: 13.5, color: T2.muted }}>Already registered? <span style={{ color: T2.green, fontWeight: 700 }}>Sign in</span></span>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <h1 className="disp" style={{ fontSize: 30, fontWeight: 800, margin: '0 0 6px', textAlign: 'center' }}>List your inventory in 4 steps</h1>
        <p style={{ fontSize: 14.5, color: T2.muted, textAlign: 'center', margin: '0 0 30px' }}>Verified sellers get a trust badge and faster payouts.</p>
        {/* steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <span className="num disp" style={{ width: 38, height: 38, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 800, background: i < active ? T2.green : i === active ? T2.gold : T2.panel, color: i <= active ? (i === active ? T2.deep : '#fff') : T2.faint, border: `1px solid ${i <= active ? 'transparent' : T2.line}` }}>{i < active ? '✓' : i + 1}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: i === active ? T2.ink : T2.muted }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < active ? T2.green : T2.line, margin: '0 8px', marginBottom: 22 }} />}
            </React.Fragment>
          ))}
        </div>
        {/* form: step 2 business info */}
        <div className="card" style={{ padding: 28 }}>
          <h3 className="disp" style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Business information</h3>
          <p style={{ fontSize: 13, color: T2.muted, margin: '0 0 22px' }}>Tell us about your business so buyers know who they're dealing with.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Fld2 label="Business name" value="Verité Distributors" />
            <Fld2 label="Business type" value="Wholesaler / Distributor" />
            <Fld2 label="State" value="Gujarat" />
            <Fld2 label="City" value="Surat" />
            <div style={{ gridColumn: '1 / -1' }}><Fld2 label="What do you typically liquidate?" placeholder="e.g. consumer electronics, returns, excess FMCG…" /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 26 }}>
            <Btn2 variant="ghost">← Back</Btn2>
            <Btn2 variant="primary" iconRight={J.arrow} style={{ marginLeft: 'auto' }}>Continue to GST & PAN</Btn2>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: T2.faint, textAlign: 'center', marginTop: 18 }}>🔒 Your details are encrypted and used only for KYC verification.</p>
      </div>
    </div>
  );
}

Object.assign(window, { ListingDetail, Compare, Login, SellerRegister });

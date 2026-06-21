// seller2.jsx — Seller: Analytics, Payouts, Profile.
const { T: S2, Btn: Bt, Pill: Pl, Badge: Bd, Kpi: Kp, Topbar: Tb, IconBtn: Ib, Avatar: Av, Ic: Ic3, SectionCard: SC } = window.DS;
const S2I = window.I, S2Img = window.NMImg;
const SellerSide2 = window.SellerSide;

// little line chart
function LineChart({ pts, w = 640, h = 180, color = S2.green }) {
  const max = Math.max(...pts), min = Math.min(...pts);
  const X = (i) => (i / (pts.length - 1)) * w;
  const Y = (v) => h - ((v - min) / (max - min || 1)) * (h - 20) - 10;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = d + ` L${w},${h} L0,${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs><linearGradient id="lc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.18" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#lc)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={i === pts.length - 1 ? 4 : 0} fill={color} />)}
    </svg>
  );
}

// ─────────────────────────────  ANALYTICS  ─────────────────────────────
function SellerAnalytics() {
  const funnel = [['Views', '24,800', 100], ['Inquiries', '3,120', 42], ['Orders', '412', 16], ['Repeat', '96', 7]];
  const top = [['Galaxy M14 5G · returns', 1240, 86, 31, '₹9,61,000'], ['boAt Airdopes · excess', 2110, 142, 58, '₹3,13,200'], ['Mi power banks', 1530, 64, 22, '₹1,54,000'], ['LED bulbs · bulk', 980, 38, 19, '₹66,500']];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <SellerSide2 active="Analytics" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Analytics" subtitle="Performance over the last 90 days" actions={<div className="tabbar">{['30d', '90d', '6m', '1y'].map((t, i) => <span key={t} className={`tab ${i === 1 ? 'on' : ''}`}>{t}</span>)}</div>} />
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
            <Kp label="Revenue" value="₹48.2L" sub="+18.4%" icon={S2I.wallet} pos />
            <Kp label="Total orders" value="412" sub="+9.1%" icon={S2I.truck} pos />
            <Kp label="Conversion rate" value="1.66%" sub="+0.2pt" icon={S2I.chart} pos />
            <Kp label="Avg response" value="1.8h" sub="−22 min" icon={S2I.bolt} pos />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
            <SC title="Revenue trend" action={<span className="num" style={{ fontSize: 12.5, color: S2.green, fontWeight: 700 }}>₹48.2L total</span>} pad={22}>
              <LineChart pts={[12, 18, 15, 22, 19, 28, 24, 31, 27, 35, 33, 42]} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: S2.faint, marginTop: 6 }}>{['Mar', 'Apr', 'May', 'Jun'].map((m) => <span key={m}>{m}</span>)}</div>
            </SC>
            <SC title="Conversion funnel" pad={22}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {funnel.map(([k, v, w]) => (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 12.5, color: S2.muted }}>{k}</span><span className="num" style={{ fontSize: 13, fontWeight: 700 }}>{v}</span></div>
                    <div style={{ height: 22, borderRadius: 7, background: S2.panel, overflow: 'hidden' }}><div style={{ width: `${w}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg,${S2.green},${S2.green2})` }} /></div>
                  </div>
                ))}
              </div>
            </SC>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            <SC title="Top listings" pad={0} style={{ overflow: 'hidden' }}>
              <table>
                <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Listing</th><th>Views</th><th>Inquiries</th><th>Orders</th><th style={{ paddingRight: 22 }}>Revenue</th></tr></thead>
                <tbody>{top.map(([t, v, inq, o, rev]) => <tr key={t}><td style={{ paddingLeft: 22, fontWeight: 600 }}>{t}</td><td className="num">{v.toLocaleString()}</td><td className="num">{inq}</td><td className="num">{o}</td><td className="num" style={{ paddingRight: 22, fontWeight: 700 }}>{rev}</td></tr>)}</tbody>
              </table>
            </SC>
            {/* AI insights */}
            <div style={{ borderRadius: 18, background: S2.deep, color: '#fff', padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(244,168,42,.14)' }} />
              <div style={{ position: 'relative' }}>
                <Pl bg="rgba(244,168,42,.2)" color={S2.gold2} icon={S2I.spark} style={{ marginBottom: 14 }}>AI INSIGHTS</Pl>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Your Galaxy M14 lot is ageing — dropping the price 6% could clear it ~9 days sooner based on similar lots.', 'Electronics inquiries peak Tue–Thu mornings. Schedule new listings then for +14% views.', 'Faster replies (<1h) convert 1.4× better. You currently average 1.8h.'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12.5, lineHeight: 1.45, color: 'rgba(255,255,255,.85)' }}><Ic3 d={S2I.check} size={15} style={{ color: S2.gold2, flexShrink: 0, marginTop: 1 }} />{t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  PAYOUTS  ─────────────────────────────
function SellerPayouts() {
  const escrow = [['NM-90412', 'Khanna Mobiles', '₹9,60,000', 'Jun 9', 'Holding'], ['NM-90388', 'Surplus Bazaar', '₹3,10,000', 'Jun 11', 'Holding'], ['NM-90377', 'Deccan Retail', '₹1,40,000', 'Jun 12', 'Holding']];
  const hist = [['Jun 1', 5, '₹8,40,000', '₹21,000', '₹3,780', '₹8,400', '₹8,06,820', 'Processed'], ['May 24', 7, '₹11,20,000', '₹28,000', '₹5,040', '₹11,200', '₹10,75,760', 'Processed'], ['May 17', 4, '₹5,60,000', '₹14,000', '₹2,520', '₹5,600', '₹5,37,880', 'Processed']];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <SellerSide2 active="Payouts" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Payouts" subtitle="Settlements & escrow" actions={<Ib icon={S2I.bell} />} />
        <div style={{ padding: '24px 32px' }}>
          {/* pending banner */}
          <div style={{ borderRadius: 18, background: `linear-gradient(100deg,${S2.green},${S2.deep})`, color: '#fff', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 30, marginBottom: 20 }}>
            <div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)' }}>Pending payout</div><div className="num disp" style={{ fontSize: 36, fontWeight: 800, color: S2.gold2 }}>₹4,28,000</div></div>
            <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,.18)' }} />
            <div style={{ fontSize: 13 }}><div style={{ color: 'rgba(255,255,255,.7)' }}>Expected</div><div className="num" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Jun 12, 2026</div></div>
            <div style={{ fontSize: 13 }}><div style={{ color: 'rgba(255,255,255,.7)' }}>To account</div><div className="num" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>HDFC ••4471</div></div>
            <Bt variant="gold" size="lg" iconRight={S2I.arrow} style={{ marginLeft: 'auto' }}>Request payout</Bt>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
            <SC title="In escrow" pad={0} style={{ overflow: 'hidden' }}>
              <table>
                <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Order</th><th>Amount</th><th style={{ paddingRight: 22 }}>Release</th></tr></thead>
                <tbody>{escrow.map(([id, b, amt, date]) => <tr key={id}><td style={{ paddingLeft: 22 }}><div className="num" style={{ fontWeight: 700 }}>{id}</div><div style={{ fontSize: 11.5, color: S2.muted }}>{b}</div></td><td className="num" style={{ fontWeight: 700 }}>{amt}</td><td className="num" style={{ paddingRight: 22, color: S2.muted }}>{date}</td></tr>)}</tbody>
              </table>
            </SC>
            <SC title="Payout history" action={<span style={{ fontSize: 12.5, color: S2.green, fontWeight: 700 }}>Download statements</span>} pad={0} style={{ overflow: 'hidden' }}>
              <table>
                <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Date</th><th>Orders</th><th>Gross</th><th>Commission</th><th>GST</th><th>TCS</th><th>Net</th><th style={{ paddingRight: 22 }}>Status</th></tr></thead>
                <tbody>{hist.map((r) => <tr key={r[0]}><td style={{ paddingLeft: 22, fontWeight: 600 }}>{r[0]}</td><td className="num">{r[1]}</td><td className="num">{r[2]}</td><td className="num" style={{ color: S2.red }}>{r[3]}</td><td className="num" style={{ color: S2.red }}>{r[4]}</td><td className="num" style={{ color: S2.red }}>{r[5]}</td><td className="num" style={{ fontWeight: 700, color: S2.green }}>{r[6]}</td><td style={{ paddingRight: 22 }}><Bd s={r[7]} /></td></tr>)}</tbody>
              </table>
            </SC>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  PROFILE  ─────────────────────────────
function SellerProfile() {
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <SellerSide2 active="Profile" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Profile" subtitle="Business & KYC details" actions={<Bt variant="ghost">Edit</Bt>} />
        <div style={{ padding: '24px 32px' }}>
          <div className="card" style={{ padding: 28, display: 'flex', gap: 22, alignItems: 'center', marginBottom: 18 }}>
            <Av initials="VD" size={72} />
            <div style={{ flex: 1 }}>
              <div className="disp" style={{ fontSize: 24, fontWeight: 800 }}>Verité Distributors</div>
              <div style={{ fontSize: 13.5, color: S2.muted, marginBottom: 10 }}>Rohan Mehta · Member since Mar 2024</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Pl color={S2.green} bg={S2.green3soft} icon={S2I.shield}>KYC verified</Pl>
                <Pl color={S2.deep} bg={S2.goldSoft}>Tier 3 seller</Pl>
                <Pl color={S2.green2} bg={S2.green3soft}>MSME registered</Pl>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 26, paddingRight: 8 }}>
              {[['Listings', '27'], ['Orders', '412'], ['Rating', '4.6 ★']].map(([k, v]) => <div key={k} style={{ textAlign: 'center' }}><div className="num disp" style={{ fontSize: 22, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 12, color: S2.muted }}>{k}</div></div>)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <SC title="Business details" pad={22}>
              {[['Phone', '+91 98765 43210'], ['Business type', 'Wholesaler / Distributor'], ['GSTIN', '24AABCV1234F1Z5'], ['PAN', 'AABCV1234F'], ['MSME', 'UDYAM-GJ-22-0099887']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${S2.line2}` }}><span style={{ fontSize: 13, color: S2.muted }}>{k}</span><span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{v}</span></div>
              ))}
            </SC>
            <SC title="Location & bank" pad={22}>
              {[['State', 'Gujarat'], ['City', 'Surat'], ['Address', 'Plot 14, Ring Road, 395003'], ['Bank account', 'HDFC ••••4471'], ['IFSC', 'HDFC0000123']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${S2.line2}` }}><span style={{ fontSize: 13, color: S2.muted }}>{k}</span><span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{v}</span></div>
              ))}
            </SC>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SellerAnalytics, SellerPayouts, SellerProfile });

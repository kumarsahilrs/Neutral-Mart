// admin2.jsx — Admin: Analytics (heatmap), Transactions, Inventory, Users.
const { T: A2, Btn: Bt, Pill: Pl, Badge: Bd, Topbar: Tb, IconBtn: Ib, Avatar: Av, Ic: Ic2, SectionCard: SC } = window.DS;
const A2I = window.I, A2Img = window.NMImg;
const AdminSide2 = window.AdminSide;

// ─────────────────────────────  ADMIN ANALYTICS  ─────────────────────────────
function AdminAnalytics() {
  const sectors = ['Electronics', 'Textiles', 'FMCG', 'Auto Parts', 'Footwear', 'Home'];
  const buckets = ['0–30d', '31–60d', '61–90d+'];
  // value matrix [sector][bucket] = ₹ lakh, intensity 0..1
  const data = [[182, 64, 28], [96, 88, 41], [142, 36, 12], [58, 72, 55], [44, 38, 61], [120, 52, 19]];
  const maxV = 182;
  const cell = (v) => { const t = v / maxV; return { bg: `rgba(31,107,58,${0.12 + t * 0.8})`, fg: t > 0.45 ? '#fff' : A2.deep }; };
  const scorecard = [['Verité Distributors', '₹48.2L', 412, '1.66%', 4.6], ['SoundHub Wholesale', '₹39.1L', 388, '2.10%', 4.8], ['Metro Surplus', '₹28.4L', 246, '1.34%', 4.3], ['ChargeUp Traders', '₹22.7L', 198, '1.51%', 4.5]];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide2 active="Analytics" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Platform analytics" subtitle="Supply, demand & seller health" actions={<><div className="tabbar">{['30d', '90d', '6m', '1y'].map((t, i) => <span key={t} className={`tab ${i === 1 ? 'on' : ''}`}>{t}</span>)}</div><Bt variant="ghost" icon={A2I.chart}>Export</Bt></>} />
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* heatmap */}
            <SC title="Inventory ageing heatmap" action={<span style={{ fontSize: 12, color: A2.muted }}>₹ value by sector × age</span>} pad={22}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(3,1fr)', gap: 6 }}>
                <div />
                {buckets.map((b) => <div key={b} className="label" style={{ textAlign: 'center', paddingBottom: 4 }}>{b}</div>)}
                {sectors.map((s, si) => (
                  <React.Fragment key={s}>
                    <div style={{ fontSize: 12.5, color: A2.ink, fontWeight: 600, display: 'flex', alignItems: 'center' }}>{s}</div>
                    {data[si].map((v, bi) => {
                      const c = cell(v);
                      return <div key={bi} className="num" style={{ height: 46, borderRadius: 8, background: c.bg, color: c.fg, display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 700 }}>₹{v}L</div>;
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 11.5, color: A2.muted }}>
                <span>Low</span><div style={{ flex: 1, height: 8, borderRadius: 4, background: `linear-gradient(90deg, rgba(31,107,58,.12), rgba(31,107,58,.92))` }} /><span>High · stuck capital</span>
              </div>
            </SC>
            {/* demand/supply */}
            <SC title="Demand vs supply" pad={22}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[['Views (demand)', '248K', 100, A2.green], ['Watchlists', '38K', 62, A2.gold], ['Live listings (supply)', '12.4K', 44, A2.blue]].map(([k, v, w, c]) => (
                  <div key={k}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 12.5, color: A2.muted }}>{k}</span><span className="num" style={{ fontSize: 14, fontWeight: 800 }}>{v}</span></div><div style={{ height: 14, borderRadius: 7, background: A2.panel }}><div style={{ width: `${w}%`, height: '100%', borderRadius: 7, background: c }} /></div></div>
                ))}
                <div style={{ marginTop: 6, padding: '14px 16px', borderRadius: 12, background: A2.green3soft, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div><div style={{ fontSize: 12, color: A2.muted }}>Demand / supply ratio</div><div className="num disp" style={{ fontSize: 24, fontWeight: 800, color: A2.green }}>2.0×</div></div>
                  <div style={{ fontSize: 12, color: A2.green2, fontWeight: 600, marginLeft: 'auto', textAlign: 'right' }}>Healthy — buyers<br />outpace listings</div>
                </div>
              </div>
            </SC>
          </div>
          <SC title="Seller scorecard" action={<span style={{ fontSize: 12.5, color: A2.green, fontWeight: 700 }}>Sort: GMV ▾</span>} pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Seller</th><th>GMV</th><th>Orders</th><th>Conversion</th><th style={{ paddingRight: 22 }}>Rating</th></tr></thead>
              <tbody>{scorecard.map((r) => <tr key={r[0]}><td style={{ paddingLeft: 22 }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><Av initials={r[0].slice(0, 2).toUpperCase()} size={32} /><span style={{ fontWeight: 700, fontSize: 13.5 }}>{r[0]}</span></div></td><td className="num" style={{ fontWeight: 700 }}>{r[1]}</td><td className="num">{r[2]}</td><td className="num">{r[3]}</td><td className="num" style={{ paddingRight: 22, fontWeight: 700, color: A2.gold }}>{r[4]} ★</td></tr>)}</tbody>
            </table>
          </SC>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  TRANSACTIONS  ─────────────────────────────
function AdminTransactions() {
  const rows = [['NM-90412', 'Khanna Mobiles', 'Verité Distributors', '₹9,60,000', 'Paid', 'Jun 6'], ['NM-90411', 'Surplus Bazaar', 'SoundHub Wholesale', '₹1,12,400', 'Shipped', 'Jun 6'], ['NM-90409', 'Deccan Retail', 'Metro Surplus', '₹84,000', 'Delivered', 'Jun 6'], ['NM-90405', 'Janta Traders', 'Indigo Lots', '₹2,24,000', 'Disputed', 'Jun 5'], ['NM-90402', 'Metro Wholesale', 'ChargeUp Traders', '₹1,40,000', 'Completed', 'Jun 5'], ['NM-90398', 'StridePoint', 'GlowMart', '₹52,500', 'Pending payment', 'Jun 5'], ['NM-90391', 'AutoBay', 'Raghav Textiles', '₹1,75,000', 'Completed', 'Jun 4'], ['NM-90388', 'Khanna Mobiles', 'Verité Distributors', '₹3,10,000', 'Shipped', 'Jun 4']];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide2 active="Transactions" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Transaction ledger" subtitle="All platform orders" actions={<><div className="ipt" style={{ borderRadius: 999, width: 200 }}><Ic2 d={A2I.search} size={16} style={{ color: A2.faint }} /><span style={{ color: A2.faint }}>Search order #…</span></div><Bt variant="ghost" icon={A2I.chart}>Export CSV</Bt></>} />
        <div style={{ padding: '20px 32px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['All status', 'Date range', 'Buyer', 'Seller', 'Amount range'].map((f) => <span key={f} className="ipt" style={{ borderRadius: 999, padding: '8px 14px', fontSize: 12.5 }}>{f} ▾</span>)}
          </div>
          <SC pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Order</th><th>Buyer</th><th>Seller</th><th>Amount</th><th>Status</th><th style={{ paddingRight: 22 }}>Date</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r[0]}><td className="num" style={{ paddingLeft: 22, fontWeight: 700 }}>{r[0]}</td><td>{r[1]}</td><td style={{ color: A2.muted }}>{r[2]}</td><td className="num" style={{ fontWeight: 700 }}>{r[3]}</td><td><Bd s={r[4]} /></td><td className="num" style={{ paddingRight: 22, color: A2.muted }}>{r[5]}</td></tr>)}</tbody>
            </table>
          </SC>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  INVENTORY  ─────────────────────────────
function AdminInventory() {
  const cats = [['Electronics', 4120, '₹2.4Cr', 18], ['Textiles & Apparel', 2980, '₹86L', 22], ['FMCG', 1840, '₹62L', 9], ['Auto Parts', 1120, '₹74L', 31], ['Footwear', 980, '₹41L', 27], ['Home & Kitchen', 1368, '₹58L', 14]];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide2 active="Inventory" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Inventory" subtitle="Platform-wide stock value" actions={<Ib icon={A2I.bell} />} />
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
            {[['Total inventory value', '₹5.21Cr', A2.green, A2I.wallet], ['Ageing 30+ days', '486 lots', A2.red, A2I.bolt], ['Stuck capital', '₹1.84Cr', '#a9690a', A2I.box]].map(([k, v, c, ic]) => (
              <div key={k} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 46, height: 46, borderRadius: 12, background: A2.green3soft, color: c, display: 'grid', placeItems: 'center' }}><Ic2 d={ic} size={22} /></span>
                <div><div style={{ fontSize: 12.5, color: A2.muted, fontWeight: 600 }}>{k}</div><div className="num disp" style={{ fontSize: 26, fontWeight: 800, color: c }}>{v}</div></div>
              </div>
            ))}
          </div>
          <SC title="Category breakdown" action={<span style={{ fontSize: 12.5, color: A2.muted }}>% = share ageing 30+ days</span>} pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Category</th><th>Listings</th><th>Value</th><th style={{ width: 280, paddingRight: 22 }}>Ageing</th></tr></thead>
              <tbody>{cats.map(([c, n, val, age]) => (
                <tr key={c}><td style={{ paddingLeft: 22, fontWeight: 700 }}>{c}</td><td className="num">{n.toLocaleString()}</td><td className="num" style={{ fontWeight: 700 }}>{val}</td>
                  <td style={{ paddingRight: 22 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ flex: 1, height: 8, borderRadius: 4, background: A2.panel }}><div style={{ width: `${age * 2.5}%`, height: '100%', borderRadius: 4, background: age >= 25 ? A2.red : age >= 18 ? A2.gold : A2.green }} /></div><span className="num" style={{ fontSize: 12.5, fontWeight: 700, color: age >= 25 ? A2.red : A2.muted, width: 34 }}>{age}%</span></div></td>
                </tr>
              ))}</tbody>
            </table>
          </SC>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  USERS  ─────────────────────────────
function AdminUsers() {
  const rows = [['Rohan Mehta', '+91 98765 43210', 'Seller', 'Active', 'Mar 2024'], ['Aman Khanna', '+91 99100 22334', 'Buyer', 'Active', 'Jan 2025'], ['Priya Nair', '+91 90011 55667', 'Seller', 'Active', 'Aug 2024'], ['Vikram Shah', '+91 98220 11445', 'Buyer', 'Suspended', 'Nov 2024'], ['Neha Gupta', '+91 97880 33221', 'Seller', 'Active', 'Feb 2026'], ['Karan Bose', '+91 90909 88776', 'Buyer', 'Active', 'May 2025']];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide2 active="Users" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="User management" subtitle="9,960 users" actions={<div className="ipt" style={{ borderRadius: 999, width: 240 }}><Ic2 d={A2I.search} size={16} style={{ color: A2.faint }} /><span style={{ color: A2.faint }}>Search name or phone…</span></div>} />
        <div style={{ padding: '20px 32px' }}>
          <div className="tabbar" style={{ marginBottom: 16 }}>{['All', 'Buyers', 'Sellers'].map((t, i) => <span key={t} className={`tab ${i === 0 ? 'on' : ''}`}>{t}</span>)}</div>
          <SC pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Name</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th style={{ textAlign: 'right', paddingRight: 22 }}>Action</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r[0]}>
                  <td style={{ paddingLeft: 22 }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><Av initials={r[0].split(' ').map((x) => x[0]).join('')} size={32} /><span style={{ fontWeight: 700, fontSize: 13.5 }}>{r[0]}</span></div></td>
                  <td className="num" style={{ color: A2.muted }}>{r[1]}</td>
                  <td><Pl color={r[2] === 'Seller' ? A2.green : A2.blue} bg={r[2] === 'Seller' ? A2.green3soft : A2.blueSoft}>{r[2]}</Pl></td>
                  <td><Bd s={r[3]} /></td>
                  <td className="num" style={{ color: A2.muted }}>{r[4]}</td>
                  <td style={{ paddingRight: 22 }}><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}><span style={{ fontSize: 12.5, color: A2.green, fontWeight: 600 }}>View</span><span style={{ fontSize: 12.5, color: r[3] === 'Suspended' ? A2.green : A2.red, fontWeight: 600 }}>{r[3] === 'Suspended' ? 'Activate' : 'Suspend'}</span></div></td>
                </tr>
              ))}</tbody>
            </table>
          </SC>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminAnalytics, AdminTransactions, AdminInventory, AdminUsers });

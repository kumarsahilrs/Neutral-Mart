// seller.jsx — Seller (authenticated): Dashboard, Listings manager, New listing, Orders (fulfillment).
const { T: S, Btn, Pill, Badge, Kpi, Sidebar, Topbar, IconBtn, Avatar, Field, Toggle, Ic, SectionCard } = window.DS;
const SI = window.I, SImg = window.NMImg, SNM = window.NM;

const SELLER_NAV = [['Dashboard', SI.grid], ['My Listings', SI.box], ['Orders', SI.truck], ['Analytics', SI.chart], ['Payouts', SI.wallet], ['Profile', SI.shield]];
function SellerSide({ active }) {
  return <Sidebar items={SELLER_NAV} active={active} brandSub="Seller console" footer={
    <div style={{ padding: 15, background: 'rgba(244,168,42,.16)', borderRadius: 14 }}>
      <div style={{ fontSize: 12, color: S.gold2, fontWeight: 700 }}>Capital recovery</div>
      <div className="num disp" style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>78%</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>of dead-stock value recovered</div>
    </div>
  } />;
}
window.SellerSide = SellerSide;

// ─────────────────────────────  DASHBOARD  ─────────────────────────────
function SellerDashboard() {
  const Sd = SNM.seller;
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <SellerSide active="Dashboard" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="Good morning, Rohan" subtitle="Verité Distributors · Surat" actions={<><Btn variant="primary">+ New listing</Btn><IconBtn icon={SI.bell} /><Avatar initials="VD" /></>} />
        <div style={{ padding: '24px 32px' }}>
          {/* alerts */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderRadius: 13, background: S.goldSoft, border: `1px solid ${S.goldLine}` }}>
              <Ic d={SI.bolt} size={17} style={{ color: '#a9690a' }} /><span style={{ fontSize: 13, color: '#6b4d00' }}><strong>{Sd.aging} listings</strong> ageing 30+ days — consider a price drop</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderRadius: 13, background: S.blueSoft, border: '1px solid #c7e2ec' }}>
              <Ic d={SI.truck} size={17} style={{ color: S.blue }} /><span style={{ fontSize: 13, color: '#155068' }}><strong>{Sd.awaitingAction} orders</strong> awaiting your shipment confirmation</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
            <Kpi label="GMV this month" value={Sd.gmv} sub={Sd.gmvChange} icon={SI.chart} pos />
            <Kpi label="Pending payout" value={Sd.payout} sub={`Next ${Sd.payoutDate}`} icon={SI.wallet} />
            <Kpi label="Active listings" value={Sd.activeListings} sub="+3 this week" icon={SI.box} pos />
            <Kpi label="Awaiting action" value={Sd.awaitingAction} sub="Ship today" icon={SI.truck} pos={false} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
            {/* capital recovery */}
            <SectionCard pad={22}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Ic d={SI.spark} size={16} style={{ color: S.green }} /><h3 className="disp" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Capital recovery estimator</h3></div>
              <p style={{ fontSize: 12.5, color: S.muted, margin: '0 0 18px' }}>What you'll actually receive this cycle.</p>
              {[['Gross merchandise value', '₹18,40,000', 100, S.green], ['− Platform fee (2.5%)', '−₹46,000', 6, S.gold], ['− GST on fee (18%)', '−₹8,280', 3, S.gold2]].map(([k, v, w, c]) => (
                <div key={k} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 12.5, color: S.muted }}>{k}</span><span className="num" style={{ fontSize: 13.5, fontWeight: 800 }}>{v}</span></div>
                  <div style={{ height: 7, borderRadius: 4, background: '#f0e8d6' }}><div style={{ width: `${w}%`, height: '100%', borderRadius: 4, background: c }} /></div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: '14px 16px', background: S.green, borderRadius: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 13, color: S.gold2, fontWeight: 700 }}>Net payout</span><span className="num" style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>₹17,85,720</span></div>
            </SectionCard>
            {/* recent orders */}
            <SectionCard title="Recent orders" action={<span style={{ fontSize: 12.5, color: S.green, fontWeight: 700 }}>View all →</span>} pad={0} style={{ overflow: 'hidden' }}>
              <table>
                <thead><tr><th style={{ paddingTop: 16 }}>Order</th><th>Buyer</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {SNM.orders.map((o) => (
                    <tr key={o.id}><td className="num" style={{ fontWeight: 700 }}>{o.id}</td><td>{o.buyer}</td><td style={{ color: S.muted }}>{o.item}</td><td className="num" style={{ fontWeight: 700 }}>{o.amount}</td><td><Badge s={o.status} /></td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 10, padding: '14px 18px', borderTop: `1px solid ${S.line}` }}>
                <Btn variant="soft" size="sm" icon={SI.box}>Add listing</Btn><Btn variant="soft" size="sm" icon={SI.truck}>View orders</Btn><Btn variant="soft" size="sm" icon={SI.wallet}>Check payouts</Btn>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  LISTINGS MANAGER  ─────────────────────────────
function SellerListings() {
  const rows = [
    ['Galaxy M14 5G · returns', '₹6,200', 'Live', 1240, 38, '#e9e2d2', 22],
    ['boAt Airdopes · excess', '₹540', 'Live', 2110, 64, '#e2e6e8', 8],
    ['Mi power banks 10000mAh', '₹700', 'Paused', 1530, 21, '#e3e7e4', 41],
    ['Realme C-series · dead', '₹2,800', 'Flagged', 410, 9, '#ece6da', 36],
    ['LED bulbs · bulk excess', '₹350', 'Sold', 980, 0, '#e8e3d6', 14],
    ['Wireless keyboards lot', '₹420', 'Live', 670, 12, '#dfe2e6', 5],
    ['USB-C cables · surplus', '₹65', 'Expired', 320, 3, '#ece4e0', 62],
  ];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <SellerSide active="My Listings" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="My listings" subtitle="27 active" actions={<><div className="ipt" style={{ borderRadius: 999, width: 220 }}><Ic d={SI.search} size={16} style={{ color: S.faint }} /><span style={{ color: S.faint }}>Search…</span></div><Btn variant="primary">+ New listing</Btn></>} />
        <div style={{ padding: '20px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <div className="tabbar">{['All', 'Live', 'Paused', 'Sold', 'Expired', 'Flagged'].map((t, i) => <span key={t} className={`tab ${i === 0 ? 'on' : ''}`}>{t}</span>)}</div>
            <div className="ipt" style={{ marginLeft: 'auto', borderRadius: 999, padding: '9px 14px' }}>Sort: <span style={{ color: S.ink, fontWeight: 600 }}>Most views</span> ▾</div>
          </div>
          <SectionCard pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16, paddingLeft: 18 }}>Listing</th><th>Asking</th><th>Status</th><th>Views</th><th>Watching</th><th>Age</th><th style={{ textAlign: 'right', paddingRight: 18 }}>Actions</th></tr></thead>
              <tbody>
                {rows.map(([t, price, st, views, watch, tone, age]) => (
                  <tr key={t}>
                    <td style={{ paddingLeft: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><SImg w={44} h={44} label="" tone={tone} radius={10} /><span className="disp" style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</span></div></td>
                    <td className="num" style={{ fontWeight: 700 }}>{price}</td>
                    <td><Badge s={st} /></td>
                    <td className="num">{views.toLocaleString()}</td>
                    <td className="num">{watch}</td>
                    <td><span style={{ color: age >= 30 ? S.red : S.muted, fontWeight: age >= 30 ? 700 : 400 }} className="num">{age}d</span></td>
                    <td style={{ paddingRight: 18 }}>
                      <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end', alignItems: 'center', color: S.muted }}>
                        <span style={{ fontSize: 12.5, color: S.green, fontWeight: 600, cursor: 'pointer' }}>Edit</span>
                        <Toggle on={st === 'Live'} />
                        <Ic d={SI.tag} size={15} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  NEW LISTING  ─────────────────────────────
function NewListing() {
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <SellerSide active="My Listings" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="Create new listing" subtitle="List dead, excess or returned stock" actions={<><Btn variant="ghost">Save as draft</Btn><Btn variant="primary" iconRight={SI.arrow}>Publish</Btn></>} />
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionCard title="Basics" pad={22}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Listing title" value="Galaxy M14 5G · Sealed-box returns lot" />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 7 }}>Description</div>
                  <div style={{ border: `1px solid ${S.line}`, borderRadius: 12, padding: '13px 15px', fontSize: 13.5, color: S.ink, lineHeight: 1.5, minHeight: 80 }}>420 units of Galaxy M14 5G (6/128GB), customer returns in original sealed boxes. Fully tested, Grade B. No brand warranty.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Category" value="Electronics → Smartphones" />
                  <Field label="Price type" value="Negotiable" />
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Pricing & quantity" pad={22}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Field label="Asking price / unit" value="₹6,200" />
                <Field label="Total quantity" value="420 pieces" />
                <Field label="MOQ" value="50" />
                <Field label="Condition grade" value="Grade B" />
                <Field label="Stock type" value="Customer returns" />
                <Field label="Lot type" value="Partial lot OK" />
              </div>
            </SectionCard>
            <SectionCard title="Photos" pad={22}>
              <div style={{ display: 'flex', gap: 12 }}>
                {['FRONT', 'BACK', 'BOX'].map((t) => <SImg key={t} w={104} h={104} label={t} tone="#ece6da" radius={12} />)}
                <div style={{ width: 104, height: 104, borderRadius: 12, border: `1.5px dashed ${S.line}`, display: 'grid', placeItems: 'center', background: S.panel, color: S.faint, textAlign: 'center', fontSize: 11, gap: 4 }}>
                  <div><Ic d={SI.box} size={22} style={{ color: S.faint }} /><div style={{ marginTop: 4 }}>Drop or upload</div></div>
                </div>
              </div>
            </SectionCard>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionCard title="Location" pad={22}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="State" value="Gujarat" /><Field label="City" value="Surat" /><Field label="Pincode" value="395003" />
              </div>
            </SectionCard>
            <SectionCard title="Urgency" pad={22}>
              <div style={{ fontSize: 12.5, color: S.muted, marginBottom: 12 }}>Higher urgency boosts visibility and unlocks flash-sale slots.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => <span key={n} className="num disp" style={{ flex: 1, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, background: n <= 4 ? S.gold : S.panel, color: n <= 4 ? S.deep : S.faint, border: `1px solid ${n <= 4 ? 'transparent' : S.line}` }}>{n}</span>)}
              </div>
              <div style={{ fontSize: 12, color: '#a9690a', fontWeight: 600, marginTop: 10 }}>🔥 High — eligible for flash sale</div>
            </SectionCard>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 11, background: S.green3soft, borderColor: '#cfe6d6', alignItems: 'center' }}>
              <Ic d={SI.shield} size={18} style={{ color: S.green, flexShrink: 0 }} /><div style={{ fontSize: 12.5, color: S.muted }}><strong style={{ color: S.green }}>GSTIN 24AABCV1234F1Z5</strong> will be shown on this listing.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  SELLER ORDERS (FULFILLMENT)  ─────────────────────────────
function SellerOrders() {
  const rows = SNM.orders.map((o, i) => ({ ...o, date: ['Jun 6', 'Jun 5', 'Jun 4', 'Jun 2', 'May 30'][i] }));
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <SellerSide active="Orders" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="Orders" subtitle="Fulfilment queue" actions={<><div className="ipt" style={{ borderRadius: 999, width: 220 }}><Ic d={SI.search} size={16} style={{ color: S.faint }} /><span style={{ color: S.faint }}>Search orders…</span></div><IconBtn icon={SI.bell} /></>} />
        <div style={{ padding: '20px 32px' }}>
          <div className="tabbar" style={{ marginBottom: 18 }}>{['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered'].map((t, i) => <span key={t} className={`tab ${i === 0 ? 'on' : ''}`}>{t}</span>)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((o) => (
              <div key={o.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '15px 20px' }}>
                <SImg w={56} h={56} label="" tone="#ece6da" radius={11} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="disp" style={{ fontSize: 15, fontWeight: 700 }}>{o.item}</span><span className="num" style={{ fontSize: 12, color: S.faint }}>{o.id}</span></div>
                  <div style={{ fontSize: 12.5, color: S.muted, marginTop: 3 }}>{o.buyer} · Qty {o.qty} · {o.date}</div>
                </div>
                <span className="num disp" style={{ fontSize: 18, fontWeight: 800, minWidth: 110, textAlign: 'right' }}>{o.amount}</span>
                <Badge s={o.status} />
                {o.status === 'Awaiting ship' ? <Btn variant="primary" size="sm" icon={SI.truck}>Mark shipped</Btn> : o.status === 'In escrow' ? <Btn variant="gold" size="sm" icon={SI.check}>Confirm</Btn> : <Btn variant="ghost" size="sm">View</Btn>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SellerDashboard, SellerListings, NewListing, SellerOrders });

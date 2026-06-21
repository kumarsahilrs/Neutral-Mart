// buyer.jsx — Buyer (authenticated): Dashboard, Orders list, Order detail + timeline, Checkout.
const { T: B, Btn, Pill, Badge, Kpi, Sidebar, Topbar, IconBtn, Avatar, Field, Ic, SectionCard } = window.DS;
const BI = window.I, BImg = window.NMImg, BNM = window.NM;

const BUYER_NAV = [['Dashboard', BI.grid], ['Browse lots', BI.box], ['Orders', BI.truck], ['Watchlist', BI.heart], ['Referral', BI.spark], ['Profile', BI.shield]];

function BuyerSide({ active }) {
  return <Sidebar items={BUYER_NAV} active={active} brandSub="Buyer account" footer={
    <div style={{ padding: 15, background: 'rgba(244,168,42,.16)', borderRadius: 14 }}>
      <div style={{ fontSize: 12, color: B.gold2, fontWeight: 700 }}>Escrow protected</div>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.65)', marginTop: 3, lineHeight: 1.4 }}>Every order is held safe until you confirm delivery.</div>
    </div>
  } />;
}

// ─────────────────────────────  DASHBOARD  ─────────────────────────────
function BuyerDashboard() {
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <BuyerSide active="Dashboard" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="Welcome back, Rohan" subtitle="Khanna Mobiles · Delhi" actions={<><Btn variant="primary" icon={BI.box}>Browse inventory</Btn><IconBtn icon={BI.bell} /><Avatar /></>} />
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
            <Kpi label="Total orders" value="38" sub="+4 this month" icon={BI.truck} pos />
            <Kpi label="Total spent" value="₹62.4L" sub="lifetime" icon={BI.wallet} />
            <Kpi label="Pending orders" value="3" sub="awaiting delivery" icon={BI.box} pos={false} />
            <Kpi label="Delivered" value="32" sub="84% on time" icon={BI.check} pos />
          </div>
          <SectionCard title="Recent orders" action={<span style={{ fontSize: 12.5, color: B.green, fontWeight: 700 }}>View all →</span>} pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16 }}>Order</th><th>Item</th><th>Qty</th><th>Amount</th><th>Escrow</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {BNM.orders.map((o, i) => (
                  <tr key={o.id}>
                    <td className="num" style={{ fontWeight: 700 }}>{o.id}</td>
                    <td>{o.item}</td>
                    <td className="num">{o.qty}</td>
                    <td className="num" style={{ fontWeight: 700 }}>{o.amount}</td>
                    <td>{['Disputed', 'Delivered'].includes(o.status) ? <Pill color={B.muted} bg="#efe9dd">Released</Pill> : <Pill color={B.blue} bg={B.blueSoft} icon={BI.shield}>Holding</Pill>}</td>
                    <td><Badge s={o.status} /></td>
                    <td style={{ color: B.muted }}>{['2h ago', '5h ago', '1d ago', '2d ago', '4d ago'][i]}</td>
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

// ─────────────────────────────  ORDERS LIST  ─────────────────────────────
function BuyerOrders() {
  const tabs = ['All', 'Pending payment', 'Paid', 'Shipped', 'Delivered', 'Completed', 'Disputed'];
  const rows = [...BNM.orders, { id: 'NM-90312', buyer: '', item: 'LED bulbs · bulk excess', qty: 500, amount: '₹1,75,000', status: 'Completed' }, { id: 'NM-90298', buyer: '', item: 'Wireless mouse lot', qty: 150, amount: '₹52,500', status: 'Delivered' }];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <BuyerSide active="Orders" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="My orders" subtitle="38 orders" actions={<><div className="ipt" style={{ borderRadius: 999, width: 240 }}><Ic d={BI.search} size={16} style={{ color: B.faint }} /><span style={{ color: B.faint }}>Search orders…</span></div><Btn variant="ghost" icon={BI.chart}>Export CSV</Btn><IconBtn icon={BI.bell} /></>} />
        <div style={{ padding: '20px 32px' }}>
          <div className="tabbar" style={{ marginBottom: 18 }}>{tabs.map((t, i) => <span key={t} className={`tab ${i === 0 ? 'on' : ''}`}>{t}</span>)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((o, i) => (
              <div key={o.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px' }}>
                <BImg w={64} h={64} label="" tone="#ece6da" radius={12} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="disp" style={{ fontSize: 15.5, fontWeight: 700 }}>{o.item}</span>
                    <span className="num" style={{ fontSize: 12, color: B.faint }}>{o.id}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: B.muted, marginTop: 3 }}>Qty {o.qty} · ordered {['2h', '5h', '1d', '2d', '4d', '6d', '8d'][i]} ago</div>
                </div>
                {!['Disputed', 'Delivered', 'Completed'].includes(o.status) && <Pill color={B.blue} bg={B.blueSoft} icon={BI.shield}>In escrow</Pill>}
                <span className="num disp" style={{ fontSize: 18, fontWeight: 800, minWidth: 110, textAlign: 'right' }}>{o.amount}</span>
                <Badge s={o.status} />
                <Ic d={BI.arrow} size={18} style={{ color: B.faint }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
            {['‹', '1', '2', '3', '›'].map((p, i) => <span key={i} className="num" style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600, background: p === '1' ? B.green : B.card, color: p === '1' ? '#fff' : B.ink, border: `1px solid ${p === '1' ? B.green : B.line}` }}>{p}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────  ORDER DETAIL + TIMELINE  ─────────────────────
function OrderDetail() {
  const stages = [['Order placed', 1], ['Payment in escrow', 1], ['Seller confirmed', 1], ['Shipped', 1], ['In transit', 2], ['Delivered', 0], ['Payment released', 0]];
  const track = [['Picked up', 1], ['In transit', 1], ['Reached hub', 2], ['Out for delivery', 0], ['Delivered', 0]];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <BuyerSide active="Orders" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="Order NM-90388" subtitle="Galaxy M14 returns · placed 2 days ago" actions={<><Btn variant="ghost" icon={BI.tag}>Download invoice</Btn><Badge s="In transit" /></>} />
        <div style={{ padding: '24px 32px' }}>
          {/* timeline */}
          <SectionCard pad={26} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 17, left: 24, right: 24, height: 3, background: B.line }} />
              <div style={{ position: 'absolute', top: 17, left: 24, width: '58%', height: 3, background: B.green }} />
              {stages.map(([s, st], i) => (
                <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, position: 'relative', flex: 1, textAlign: 'center' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 999, display: 'grid', placeItems: 'center', background: st === 1 ? B.green : st === 2 ? B.gold : B.card, color: st === 0 ? B.faint : (st === 2 ? B.deep : '#fff'), border: `2px solid ${st === 0 ? B.line : 'transparent'}`, boxShadow: st === 2 ? `0 0 0 5px ${B.goldSoft}` : 'none' }}>
                    {st === 1 ? <Ic d={BI.check} size={18} /> : st === 2 ? <Ic d={BI.truck} size={17} /> : <span className="num" style={{ fontSize: 13, fontWeight: 700 }}>{i + 1}</span>}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: st === 0 ? 500 : 700, color: st === 0 ? B.faint : B.ink, maxWidth: 84 }}>{s}</span>
                  {st !== 0 && <span style={{ fontSize: 11, color: B.muted }}>{['Jun 4', 'Jun 4', 'Jun 4', 'Jun 5', 'Now', '', ''][i]}</span>}
                </div>
              ))}
            </div>
          </SectionCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            {/* escrow */}
            <div className="card" style={{ padding: 22, display: 'flex', gap: 14, alignItems: 'center', background: B.green3soft, borderColor: '#cfe6d6' }}>
              <span style={{ width: 48, height: 48, borderRadius: 12, background: B.green, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic d={BI.shield} size={24} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: B.green }}>Payment held in escrow</div>
                <div style={{ fontSize: 12.5, color: B.muted, lineHeight: 1.45 }}>₹3,10,000 is protected. We release it to the seller only when you confirm receipt.</div>
              </div>
            </div>
            {/* live tracking */}
            <SectionCard title="Live tracking" action={<span style={{ fontSize: 12.5, color: B.green, fontWeight: 700 }}>Open tracker →</span>} pad={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: B.muted, marginBottom: 14 }}>
                <span>AWB <strong className="num" style={{ color: B.ink }}>DL-44871902</strong></span><span>Delhivery · ETA Jun 7</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 9, left: 10, right: 10, height: 2, background: B.line }} />
                <div style={{ position: 'absolute', top: 9, left: 10, width: '50%', height: 2, background: B.gold }} />
                {track.map(([s, st], i) => (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, position: 'relative', flex: 1 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: st === 1 ? B.green : st === 2 ? B.gold : B.card, border: `2px solid ${st === 0 ? B.line : 'transparent'}` }} />
                    <span style={{ fontSize: 10.5, fontWeight: st === 0 ? 500 : 700, color: st === 0 ? B.faint : B.ink, textAlign: 'center', maxWidth: 60 }}>{s}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
            {/* amount breakdown */}
            <SectionCard title="Amount breakdown" pad={0} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '4px 22px 14px' }}>
                {[['Subtotal (50 × ₹6,200)', '₹3,10,000'], ['Platform fee · 2.5%', '₹7,750'], ['GST on fee · 18%', '₹1,395'], ['Freight (Delhivery)', '₹2,400']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${B.line2}` }}>
                    <span style={{ fontSize: 13, color: B.muted }}>{k}</span><span className="num" style={{ fontSize: 13.5, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 13 }}>
                  <span className="disp" style={{ fontSize: 15, fontWeight: 800 }}>Total paid</span><span className="num" style={{ fontSize: 20, fontWeight: 800, color: B.green }}>₹3,21,545</span>
                </div>
              </div>
            </SectionCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* seller + product */}
              <SectionCard title="Seller" pad={20}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar initials="VD" />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Verité Distributors</div><div style={{ fontSize: 12, color: B.muted }}>Surat · 94% response · ★ 4.6</div></div>
                </div>
              </SectionCard>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="primary" full icon={BI.check}>Confirm receipt</Btn>
                <Btn variant="ghost" style={{ color: B.red, borderColor: B.redSoft }}>Raise dispute</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  CHECKOUT  ─────────────────────────────
function Checkout() {
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <BuyerSide active="Orders" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="Checkout" subtitle="Galaxy M14 5G · 50 units" actions={<Pill color={B.green} bg={B.green3soft} icon={BI.shield}>Escrow-protected</Pill>} />
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 22, alignItems: 'start' }}>
          {/* summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionCard title="Order summary" pad={20}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <BImg w={72} h={72} label="" tone="#e9e2d2" radius={12} />
                <div style={{ flex: 1 }}>
                  <div className="disp" style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.2 }}>Galaxy M14 5G · Sealed-box returns</div>
                  <div style={{ fontSize: 12, color: B.muted, marginTop: 4 }}>Verité Distributors</div>
                  <Pill color={B.ink} bg="#efe9dd" style={{ marginTop: 6 }}>Grade B</Pill>
                </div>
              </div>
              {[['50 × ₹6,200', '₹3,10,000'], ['Platform fee · 2.5%', '₹7,750'], ['GST on fee · 18%', '₹1,395'], ['Freight', '₹2,400']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${B.line2}` }}><span style={{ fontSize: 12.5, color: B.muted }}>{k}</span><span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{v}</span></div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 13 }}><span className="disp" style={{ fontSize: 15, fontWeight: 800 }}>Total</span><span className="num" style={{ fontSize: 20, fontWeight: 800, color: B.green }}>₹3,21,545</span></div>
            </SectionCard>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 11, background: B.green3soft, borderColor: '#cfe6d6' }}>
              <Ic d={BI.shield} size={18} style={{ color: B.green, flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: B.muted, lineHeight: 1.45 }}><strong style={{ color: B.green }}>Escrow protection.</strong> Your payment is held safely and only released to the seller after you confirm delivery.</div>
            </div>
          </div>
          {/* form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionCard title="Delivery address" pad={20}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Warehouse · Karol Bagh', 'Rohan Khanna · +91 98765 43210 · New Delhi 110005', true], ['Shop · Gaffar Market', 'Rohan Khanna · +91 98765 43210 · New Delhi 110006', false]].map(([t, d, on]) => (
                  <label key={t} style={{ display: 'flex', gap: 12, padding: '13px 15px', borderRadius: 12, border: `1.5px solid ${on ? B.green : B.line}`, background: on ? B.green3soft : B.card, cursor: 'pointer' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${on ? B.green : B.line}`, display: 'grid', placeItems: 'center', marginTop: 1, flexShrink: 0 }}>{on && <span style={{ width: 9, height: 9, borderRadius: 999, background: B.green }} />}</span>
                    <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</div><div style={{ fontSize: 12, color: B.muted, marginTop: 2 }}>{d}</div></div>
                  </label>
                ))}
                <div style={{ fontSize: 13, color: B.green, fontWeight: 700, padding: '4px 2px' }}>+ Add new address</div>
              </div>
            </SectionCard>
            <SectionCard title="Freight option" pad={20}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Platform logistics · Delhivery', 'Live estimate · ETA 3–4 days', '₹2,400', true], ['Seller self-ship', 'Dispatched by seller', 'Free', false], ['Buyer pickup', 'Collect from Surat warehouse', 'Free', false]].map(([t, d, p, on]) => (
                  <label key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '13px 15px', borderRadius: 12, border: `1.5px solid ${on ? B.green : B.line}`, background: on ? B.green3soft : B.card, cursor: 'pointer' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${on ? B.green : B.line}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{on && <span style={{ width: 9, height: 9, borderRadius: 999, background: B.green }} />}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</div><div style={{ fontSize: 12, color: B.muted }}>{d}</div></div>
                    <span className="num" style={{ fontSize: 14, fontWeight: 800, color: p === 'Free' ? B.green : B.ink }}>{p}</span>
                  </label>
                ))}
              </div>
            </SectionCard>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 11, background: B.goldSoft, borderColor: B.goldLine, alignItems: 'center' }}>
              <Ic d={BI.bolt} size={18} style={{ color: '#a9690a', flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: '#7a4e06', flex: 1 }}>Orders above ₹1L need <strong>Tier 2 verification</strong> before payment.</div>
              <Btn variant="gold" size="sm">Verify</Btn>
            </div>
            <Btn variant="primary" size="lg" full iconRight={BI.shield}>Pay ₹3,21,545 securely</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

window.BuyerSide = BuyerSide;
Object.assign(window, { BuyerDashboard, BuyerOrders, OrderDetail, Checkout });

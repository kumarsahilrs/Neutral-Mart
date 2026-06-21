// admin3.jsx — Admin: Categories, Payouts, Settings, Audit log, Notifications.
const { T: A3, Btn: Bt, Pill: Pl, Badge: Bd, Topbar: Tb, IconBtn: Ib, Avatar: Av, Toggle: Tg, Ic: Ic4, SectionCard: SC, Field: Fd } = window.DS;
const A3I = window.I;
const AdminSide3 = window.AdminSide;

// ─────────────────────────────  CATEGORIES  ─────────────────────────────
function AdminCategories() {
  const cats = [['Electronics', 'electronics', 4120, true], ['Textiles & Apparel', 'textiles-apparel', 2980, true], ['FMCG', 'fmcg', 1840, true], ['Auto Parts', 'auto-parts', 1120, true], ['Footwear', 'footwear', 980, true], ['Home & Kitchen', 'home-kitchen', 1368, true], ['Toys', 'toys', 240, false], ['Cosmetics', 'cosmetics', 612, true]];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide3 active="Categories" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Categories" subtitle="8 categories" actions={<Bt variant="primary" icon={A3I.tag}>Add category</Bt>} />
        <div style={{ padding: '24px 32px' }}>
          <SC pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Category</th><th>Slug</th><th>Active listings</th><th>Status</th><th style={{ textAlign: 'right', paddingRight: 22 }}>Actions</th></tr></thead>
              <tbody>{cats.map(([name, slug, n, on]) => (
                <tr key={slug}>
                  <td style={{ paddingLeft: 22 }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><span style={{ width: 32, height: 32, borderRadius: 9, background: A3.green3soft, color: A3.green, display: 'grid', placeItems: 'center' }}><Ic4 d={A3I.tag} size={15} /></span><span style={{ fontWeight: 700, fontSize: 13.5 }}>{name}</span></div></td>
                  <td className="num" style={{ color: A3.muted }}>/{slug}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{n.toLocaleString()}</td>
                  <td><Tg on={on} /></td>
                  <td style={{ paddingRight: 22 }}><div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><span style={{ fontSize: 12.5, color: A3.green, fontWeight: 600 }}>Edit</span><span style={{ fontSize: 12.5, color: A3.muted, fontWeight: 600 }}>{on ? 'Deactivate' : 'Activate'}</span></div></td>
                </tr>
              ))}</tbody>
            </table>
          </SC>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  ADMIN PAYOUTS  ─────────────────────────────
function AdminPayouts() {
  const pending = [['Verité Distributors', '₹4,28,000', 'HDFC ••4471', 'Ready'], ['SoundHub Wholesale', '₹2,94,000', 'ICICI ••8820', 'Ready'], ['Metro Surplus', '₹1,16,400', 'SBI ••3391', 'On hold'], ['ChargeUp Traders', '₹88,200', 'Axis ••5567', 'Ready']];
  const hist = [['Jun 1', 'Verité Distributors', '₹8,06,820', 'Processed'], ['Jun 1', 'SoundHub Wholesale', '₹5,42,100', 'Processed'], ['May 31', 'Metro Surplus', '₹3,18,400', 'Processed']];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide3 active="Payouts" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Payouts" subtitle="Seller settlements" actions={<Bt variant="primary" icon={A3I.check}>Process all ready</Bt>} />
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
            {[['Pending payouts', '₹9.27L', '14 sellers'], ['Processed today', '₹13.4L', '5 settlements'], ['On hold', '₹1.16L', '1 under review']].map(([k, v, s]) => (
              <div key={k} className="card" style={{ padding: '18px 22px' }}><div style={{ fontSize: 12.5, color: A3.muted, fontWeight: 600 }}>{k}</div><div className="num disp" style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{v}</div><div style={{ fontSize: 12, color: A3.muted, marginTop: 2 }}>{s}</div></div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <SC title="Pending payouts" pad={0} style={{ overflow: 'hidden' }}>
              <table>
                <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Seller</th><th>Amount</th><th>Account</th><th style={{ textAlign: 'right', paddingRight: 22 }}>Action</th></tr></thead>
                <tbody>{pending.map((r) => (
                  <tr key={r[0]}><td style={{ paddingLeft: 22, fontWeight: 700, fontSize: 13.5 }}>{r[0]}</td><td className="num" style={{ fontWeight: 700 }}>{r[1]}</td><td className="num" style={{ color: A3.muted }}>{r[2]}</td>
                    <td style={{ paddingRight: 22 }}><div style={{ display: 'flex', justifyContent: 'flex-end' }}>{r[3] === 'Ready' ? <Bt variant="primary" size="sm">Process</Bt> : <Pl color="#a9690a" bg={A3.goldSoft}>On hold</Pl>}</div></td>
                  </tr>
                ))}</tbody>
              </table>
            </SC>
            <SC title="Recent settlements" pad={0} style={{ overflow: 'hidden' }}>
              <table>
                <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Date</th><th>Seller</th><th style={{ paddingRight: 22 }}>Net</th></tr></thead>
                <tbody>{hist.map((r, i) => <tr key={i}><td style={{ paddingLeft: 22, color: A3.muted }} className="num">{r[0]}</td><td style={{ fontSize: 12.5, fontWeight: 600 }}>{r[1]}</td><td className="num" style={{ paddingRight: 22, fontWeight: 700, color: A3.green }}>{r[2]}</td></tr>)}</tbody>
              </table>
            </SC>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  SETTINGS  ─────────────────────────────
function AdminSettings() {
  const Row = ({ k, v, sub }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '13px 0', borderBottom: `1px solid ${A3.line2}` }}>
      <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{k}</div>{sub && <div style={{ fontSize: 12, color: A3.muted, marginTop: 2 }}>{sub}</div>}</div>
      <div className="num ipt" style={{ width: 110, justifyContent: 'center', padding: '9px', fontWeight: 700, color: A3.ink, borderRadius: 10 }}>{v}</div>
    </div>
  );
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide3 active="Settings" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Settings" subtitle="Platform configuration" actions={<Bt variant="primary" iconRight={A3I.check}>Save changes</Bt>} />
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
          <SC title="Platform configuration" pad={22}>
            <Row k="Platform fee" v="2.5 %" sub="Charged to buyers per order" />
            <Row k="GST on fee" v="18 %" sub="Applied on platform fee" />
            <Row k="Dispute auto-close" v="7 days" sub="If no response from either party" />
            <Row k="Escrow release" v="3 days" sub="After delivery confirmation" />
          </SC>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SC title="KPI alert thresholds" pad={22}>
              <Row k="Open disputes alert" v="20" />
              <Row k="Ageing listings (days)" v="30" />
              <Row k="Low conversion alert" v="1.0 %" />
            </SC>
            <SC title="Notifications" pad={22}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0 16px' }}>
                <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>Weekly report email</div><Tg on={true} />
              </div>
              <div className="label" style={{ marginBottom: 10 }}>Report recipients</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['ops@nirmalmandi.in', 'finance@nirmalmandi.in', 'rohan@nirmalmandi.in'].map((e) => (
                  <span key={e} className="pill" style={{ background: A3.panel, color: A3.ink, fontWeight: 600 }}>{e} <span style={{ color: A3.faint, marginLeft: 2 }}>×</span></span>
                ))}
                <span className="pill" style={{ background: A3.green3soft, color: A3.green, fontWeight: 700, cursor: 'pointer' }}>+ Add</span>
              </div>
            </SC>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  AUDIT LOG  ─────────────────────────────
function AdminAudit() {
  const logs = [
    ['Aarti Desai', 'KYC approved', 'Verité Distributors', A3.green, A3I.shield, '09:41'],
    ['Aarti Desai', 'Dispute resolved', 'NM-90255', A3.blue, A3I.bolt, '09:18'],
    ['System', 'Payout processed', '₹8,06,820 → HDFC ••4471', A3.gold, A3I.wallet, '08:55'],
    ['Rohit Verma', 'User suspended', 'Vikram Shah', A3.red, A3I.heart, 'Yesterday'],
    ['Aarti Desai', 'KYC rejected', 'GlowMart · invalid GSTIN', A3.red, A3I.shield, 'Yesterday'],
    ['Rohit Verma', 'Settings changed', 'Platform fee 2.5% → 2.5%', A3.muted, A3I.spark, 'Jun 4'],
    ['Aarti Desai', 'Category deactivated', 'Toys', A3.muted, A3I.tag, 'Jun 4'],
  ];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide3 active="Audit log" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Audit log" subtitle="All admin actions" actions={<><span className="ipt" style={{ borderRadius: 999, padding: '8px 14px', fontSize: 12.5 }}>Action type ▾</span><span className="ipt" style={{ borderRadius: 999, padding: '8px 14px', fontSize: 12.5 }}>Date ▾</span></>} />
        <div style={{ maxWidth: 860, padding: '24px 32px' }}>
          <SC pad={0} style={{ overflow: 'hidden' }}>
            {logs.map(([who, action, target, c, ic, time], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 22px', borderTop: i ? `1px solid ${A3.line2}` : 'none' }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: A3.panel, color: c, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic4 d={ic} size={17} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5 }}><strong>{who}</strong> <span style={{ color: A3.muted }}>·</span> {action}</div>
                  <div style={{ fontSize: 12.5, color: A3.muted, marginTop: 2 }}>{target}</div>
                </div>
                <span className="num" style={{ fontSize: 12, color: A3.faint }}>{time}</span>
              </div>
            ))}
          </SC>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  ADMIN NOTIFICATIONS  ─────────────────────────────
function AdminNotifications() {
  const notes = [
    ['kyc', 'New KYC submission', 'SoundHub Wholesale submitted GSTIN + PAN for review.', '12m', false],
    ['dispute', 'Dispute escalated', 'NM-90290 (Khanna Mobiles vs ChargeUp) escalated to admin.', '40m', false],
    ['aging', 'Ageing alert', '486 listings have crossed 30 days — capital recovery declining.', '2h', false],
    ['kyc', 'KYC submission', 'Metro Surplus submitted GSTIN + MSME documents.', '4h', true],
    ['system', 'Weekly report ready', 'Platform performance report for week 23 is available.', '1d', true],
  ];
  const meta = { kyc: [A3.green, A3.green3soft, A3I.shield], dispute: [A3.red, A3.redSoft, A3I.bolt], aging: ['#a9690a', A3.goldSoft, A3I.box], system: [A3.blue, A3.blueSoft, A3I.bell] };
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide3 active="Dashboard" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Notifications" subtitle="3 unread · platform alerts" actions={<Bt variant="ghost" icon={A3I.check}>Mark all read</Bt>} />
        <div style={{ maxWidth: 800, padding: '20px 32px' }}>
          <div className="tabbar" style={{ marginBottom: 16 }}>{['All', 'KYC', 'Disputes', 'Ageing', 'System'].map((t, i) => <span key={t} className={`tab ${i === 0 ? 'on' : ''}`}>{t}</span>)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.map(([type, title, body, time, read], i) => {
              const [c, bg, ic] = meta[type];
              return (
                <div key={i} className="card" style={{ display: 'flex', gap: 14, padding: '15px 18px', background: read ? A3.card : '#fffdf8', borderColor: read ? A3.line : A3.goldLine, position: 'relative' }}>
                  {!read && <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: 999, background: A3.gold }} />}
                  <span style={{ width: 40, height: 40, borderRadius: 11, background: bg, color: c, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic4 d={ic} size={18} /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="disp" style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</span><span style={{ marginLeft: 'auto', fontSize: 11.5, color: A3.faint }}>{time} ago</span></div>
                    <div style={{ fontSize: 13, color: A3.muted, marginTop: 3, lineHeight: 1.45 }}>{body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminCategories, AdminPayouts, AdminSettings, AdminAudit, AdminNotifications });

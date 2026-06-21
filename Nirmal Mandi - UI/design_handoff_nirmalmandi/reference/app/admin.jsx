// admin.jsx — Admin console: Login, Dashboard, KYC, Disputes.
const { T: A, Btn, Pill, Badge, Kpi, Sidebar, Topbar, IconBtn, Avatar, Brand, Field, Ic, SectionCard } = window.DS;
const AI = window.I, AImg = window.NMImg;

const ADMIN_NAV = [['Dashboard', AI.grid], ['KYC', AI.shield], ['Disputes', AI.bolt], ['Analytics', AI.chart], ['Transactions', AI.wallet], ['Inventory', AI.box], ['Categories', AI.tag], ['Users', AI.heart], ['Payouts', AI.truck], ['Settings', AI.spark], ['Audit log', AI.check]];
function AdminSide({ active }) {
  return <Sidebar items={ADMIN_NAV} active={active} brandSub="Admin Console" />;
}
window.AdminSide = AdminSide;

// ─────────────────────────────  ADMIN LOGIN  ─────────────────────────────
function AdminLogin() {
  return (
    <div className="nm" style={{ background: A.deep, display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -120, top: -120, width: 420, height: 420, borderRadius: '50%', background: 'rgba(244,168,42,.08)' }} />
      <div style={{ position: 'absolute', left: -100, bottom: -140, width: 360, height: 360, borderRadius: '50%', background: 'rgba(47,128,73,.16)' }} />
      <div className="card" style={{ width: 400, padding: 36, position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Brand /></div>
        <div style={{ textAlign: 'center', marginBottom: 26 }}><Pill color={A.deep} bg={A.goldSoft} icon={AI.shield}>Admin Console</Pill></div>
        <h2 className="disp" style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>Sign in to continue</h2>
        <p style={{ fontSize: 13, color: A.muted, margin: '0 0 24px', textAlign: 'center' }}>Restricted access · OTP verification required.</p>
        <Field label="Admin phone number" value="+91 90000 11111" icon={AI.bell} />
        <div style={{ height: 14 }} />
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 7 }}>Enter OTP</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {['9', '0', '4', '2', '', ''].map((d, i) => <div key={i} className="num" style={{ flex: 1, height: 50, borderRadius: 11, border: `1.5px solid ${d ? A.green : A.line}`, background: d ? '#fff' : A.panel, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 800 }}>{d}</div>)}
        </div>
        <Btn variant="primary" size="lg" full iconRight={AI.arrow}>Verify & enter console</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────  ADMIN DASHBOARD  ─────────────────────────────
function AdminDashboard() {
  const tx = [['NM-90412', 'Khanna Mobiles', 'Verité Distributors', '₹9,60,000', 'Paid', '2m'], ['NM-90411', 'Surplus Bazaar', 'SoundHub Wholesale', '₹1,12,400', 'Shipped', '8m'], ['NM-90409', 'Deccan Retail', 'Metro Surplus', '₹84,000', 'Delivered', '21m'], ['NM-90405', 'Janta Traders', 'Indigo Lots', '₹2,24,000', 'Disputed', '44m'], ['NM-90402', 'Metro Wholesale', 'ChargeUp Traders', '₹1,40,000', 'Completed', '1h']];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide active="Dashboard" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="Platform overview" subtitle="Live · last 30 days" actions={<><IconBtn icon={AI.bell} /><Avatar initials="AD" /></>} />
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }}>
            {[['Total GMV', '₹6.4Cr', '+14%', AI.chart, true], ['Active listings', '12,408', '+312', AI.box, true], ['Active sellers', '1,840', '+46', AI.shield, true], ['Active buyers', '8,120', '+204', AI.heart, true], ["Today's commission", '₹1.6L', '+8%', AI.wallet, true], ['Open disputes', '23', '+5', AI.bolt, false]].map(([k, v, d, ic, pos]) => (
              <div key={k} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 11.5, color: A.muted, fontWeight: 600 }}>{k}</span><span style={{ width: 26, height: 26, borderRadius: 8, background: A.green3soft, color: A.green, display: 'grid', placeItems: 'center' }}><Ic d={ic} size={13} /></span></div>
                <div className="num disp" style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
                <div className="num" style={{ fontSize: 11, color: pos ? A.green2 : A.red, fontWeight: 700, marginTop: 3 }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
            <SectionCard title="GMV · last 30 days" action={<span className="num" style={{ fontSize: 12.5, color: A.green, fontWeight: 700 }}>₹6.4Cr</span>} pad={22}>
              <window.AdminMiniChart />
            </SectionCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Open disputes', '23', A.red, A.redSoft, AI.bolt, 'Needs attention'], ['Ageing listings', '486', '#a9690a', A.goldSoft, AI.box, '30+ days old'], ['Pending KYC', '54', A.blue, A.blueSoft, AI.shield, 'Awaiting review']].map(([k, v, c, bg, ic, sub]) => (
                <div key={k} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: `4px solid ${c}` }}>
                  <span style={{ width: 40, height: 40, borderRadius: 11, background: bg, color: c, display: 'grid', placeItems: 'center' }}><Ic d={ic} size={18} /></span>
                  <div style={{ flex: 1 }}><div className="num disp" style={{ fontSize: 22, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 12, color: A.muted }}>{k} · {sub}</div></div>
                  <Ic d={AI.arrow} size={16} style={{ color: A.faint }} />
                </div>
              ))}
            </div>
          </div>
          <SectionCard title="Recent transactions" action={<span style={{ fontSize: 12.5, color: A.green, fontWeight: 700 }}>View ledger →</span>} pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Order</th><th>Buyer</th><th>Seller</th><th>Amount</th><th>Status</th><th style={{ paddingRight: 22 }}>Time</th></tr></thead>
              <tbody>{tx.map((r) => <tr key={r[0]}><td className="num" style={{ paddingLeft: 22, fontWeight: 700 }}>{r[0]}</td><td>{r[1]}</td><td style={{ color: A.muted }}>{r[2]}</td><td className="num" style={{ fontWeight: 700 }}>{r[3]}</td><td><Badge s={r[4]} /></td><td className="num" style={{ paddingRight: 22, color: A.muted }}>{r[5]} ago</td></tr>)}</tbody>
            </table>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function AdminMiniChart() {
  const pts = [38, 42, 40, 48, 45, 52, 49, 58, 54, 62, 59, 68, 64, 72, 78];
  const w = 700, h = 170, max = 82, min = 30;
  const X = (i) => (i / (pts.length - 1)) * w, Y = (v) => h - ((v - min) / (max - min)) * (h - 16) - 8;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={A.green} stopOpacity="0.18" /><stop offset="1" stopColor={A.green} stopOpacity="0" /></linearGradient></defs>
      <path d={d + ` L${w},${h} L0,${h} Z`} fill="url(#ag)" />
      <path d={d} fill="none" stroke={A.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={X(pts.length - 1)} cy={Y(pts[pts.length - 1])} r="4" fill={A.green} />
    </svg>
  );
}
window.AdminMiniChart = AdminMiniChart;

// ─────────────────────────────  ADMIN KYC  ─────────────────────────────
function AdminKYC() {
  const queue = [['Verité Distributors', '+91 98765 43210', 'GSTIN + PAN', 'Jun 6', 'Pending'], ['SoundHub Wholesale', '+91 99887 11223', 'GSTIN + PAN', 'Jun 6', 'Pending'], ['Metro Surplus', '+91 98111 44556', 'GSTIN + MSME', 'Jun 5', 'Pending'], ['Indigo Lots', '+91 90123 88990', 'GSTIN + PAN', 'Jun 5', 'Verified'], ['GlowMart', '+91 97000 33445', 'GSTIN', 'Jun 4', 'Rejected']];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide active="KYC" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="KYC management" subtitle="Verify seller documents" actions={<IconBtn icon={AI.bell} />} />
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            {[['Total submissions', '1,894', A.ink], ['Pending', '54', '#a9690a'], ['Verified', '1,786', A.green], ['Rejected', '54', A.red]].map(([k, v, c]) => (
              <div key={k} className="card" style={{ padding: '16px 20px' }}><div style={{ fontSize: 12.5, color: A.muted, fontWeight: 600 }}>{k}</div><div className="num disp" style={{ fontSize: 26, fontWeight: 800, color: c, marginTop: 4 }}>{v}</div></div>
            ))}
          </div>
          <div className="tabbar" style={{ marginBottom: 16 }}>{['All', 'Pending', 'Verified', 'Rejected'].map((t, i) => <span key={t} className={`tab ${i === 1 ? 'on' : ''}`}>{t}</span>)}</div>
          <SectionCard pad={0} style={{ overflow: 'hidden' }}>
            <table>
              <thead><tr><th style={{ paddingTop: 16, paddingLeft: 22 }}>Seller</th><th>Phone</th><th>Documents</th><th>Submitted</th><th>Status</th><th style={{ textAlign: 'right', paddingRight: 22 }}>Action</th></tr></thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r[0]}>
                    <td style={{ paddingLeft: 22 }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><Avatar initials={r[0].slice(0, 2).toUpperCase()} size={34} /><span style={{ fontWeight: 700, fontSize: 13.5 }}>{r[0]}</span></div></td>
                    <td className="num" style={{ color: A.muted }}>{r[1]}</td>
                    <td><span style={{ fontSize: 12.5, color: A.green, fontWeight: 600, cursor: 'pointer' }}>{r[2]} ↗</span></td>
                    <td className="num" style={{ color: A.muted }}>{r[3]}</td>
                    <td><Badge s={r[4]} /></td>
                    <td style={{ paddingRight: 22 }}>
                      {r[4] === 'Pending' ? <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn variant="primary" size="sm" icon={AI.check}>Approve</Btn><Btn variant="ghost" size="sm" style={{ color: A.red, borderColor: A.redSoft }}>Reject</Btn></div> : <span style={{ display: 'block', textAlign: 'right', fontSize: 12.5, color: A.faint }}>Reviewed</span>}
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

// ─────────────────────────────  ADMIN DISPUTES  ─────────────────────────────
function AdminDisputes() {
  const list = [['NM-90340', 'Janta Traders', 'Indigo Lots', 'Damaged on arrival', '₹2,24,000', 'Open', 'Jun 5'], ['NM-90318', 'Deccan Retail', 'GlowMart', 'Item not as described', '₹1,18,000', 'Under review', 'Jun 4'], ['NM-90290', 'Khanna Mobiles', 'ChargeUp Traders', 'Quantity mismatch', '₹62,000', 'Escalated', 'Jun 3'], ['NM-90255', 'Surplus Bazaar', 'Metro Surplus', 'Never delivered', '₹94,000', 'Resolved', 'Jun 1']];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <AdminSide active="Disputes" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Topbar title="Disputes" subtitle="23 open · 8 under review" actions={<IconBtn icon={AI.bell} />} />
        <div style={{ padding: '24px 32px' }}>
          <div className="tabbar" style={{ marginBottom: 18 }}>{['Open', 'Under review', 'Resolved', 'Escalated'].map((t, i) => <span key={t} className={`tab ${i === 0 ? 'on' : ''}`}>{t}</span>)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map((r, idx) => (
              <div key={r[0]} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: A.redSoft, color: A.red, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic d={AI.bolt} size={20} /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="disp" style={{ fontSize: 15.5, fontWeight: 700 }}>{r[3]}</span><span className="num" style={{ fontSize: 12, color: A.faint }}>{r[0]}</span></div>
                    <div style={{ fontSize: 12.5, color: A.muted, marginTop: 3 }}>{r[1]} <span style={{ color: A.faint }}>vs</span> {r[2]} · raised {r[6]}</div>
                  </div>
                  <span className="num disp" style={{ fontSize: 18, fontWeight: 800, minWidth: 110, textAlign: 'right' }}>{r[4]}</span>
                  <Badge s={r[5]} />
                  {idx === 0 && <div style={{ display: 'flex', gap: 8 }}><Btn variant="primary" size="sm">Resolve</Btn><Btn variant="ghost" size="sm">Escalate</Btn></div>}
                </div>
                {idx === 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${A.line2}`, display: 'flex', gap: 14 }}>
                    <div style={{ flex: 1, fontSize: 12.5, color: A.muted, lineHeight: 1.5 }}><strong style={{ color: A.ink }}>Buyer:</strong> 14 of 80 units arrived with cracked screens. Photos + unboxing video attached. Requesting ₹56,000 partial refund.</div>
                    <div className="ipt" style={{ flex: 1, alignItems: 'flex-start', minHeight: 56 }}><span style={{ color: A.faint }}>Add an admin note…</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminLogin, AdminDashboard, AdminKYC, AdminDisputes });

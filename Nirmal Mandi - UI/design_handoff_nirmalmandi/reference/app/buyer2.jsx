// buyer2.jsx — Buyer: Dispute filing, Notifications, Watchlist, Referral.
const { T: B2, Btn: Bt, Pill: Pl, Badge: Bd, Sidebar: Sb, Topbar: Tb, IconBtn: Ib, Avatar: Av, Ic: Ic2, SectionCard: SC } = window.DS;
const B2I = window.I, B2Img = window.NMImg;
const BuyerSide2 = window.BuyerSide;

// ─────────────────────────────  DISPUTE  ─────────────────────────────
function Dispute() {
  const reasons = ['Item not as described', 'Quantity mismatch', 'Damaged on arrival', 'Wrong grade / condition', 'Never delivered', 'Other'];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <BuyerSide2 active="Orders" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Raise a dispute" subtitle="Order NM-90340 · we'll mediate within 48 hours" actions={<Bd s="Disputed" />} />
        <div style={{ maxWidth: 720, padding: '24px 32px' }}>
          {/* order context */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <B2Img w={56} h={56} label="" tone="#ece6da" radius={12} />
            <div style={{ flex: 1 }}><div className="disp" style={{ fontSize: 15, fontWeight: 700 }}>Realme C-series · dead stock</div><div style={{ fontSize: 12.5, color: B2.muted }}>Janta Traders · 80 units</div></div>
            <span className="num disp" style={{ fontSize: 18, fontWeight: 800 }}>₹2,24,000</span>
          </div>
          <SC pad={26}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}>What went wrong?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {reasons.map((r, i) => <span key={r} className="tab" style={i === 0 ? { background: B2.red, color: '#fff', borderColor: B2.red } : {}}>{r}</span>)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}>Describe the issue</div>
              <div style={{ border: `1px solid ${B2.line}`, borderRadius: 12, padding: '13px 15px', fontSize: 13.5, color: B2.ink, lineHeight: 1.5, minHeight: 92, background: B2.card }}>
                Received 80 units but 14 had cracked screens and 6 wouldn't power on. Photos and the unboxing video are attached. Requesting a partial refund of ₹56,000 for the damaged units.
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}>Evidence</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3].map((n) => <B2Img key={n} w={84} h={84} label={`IMG ${n}`} tone="#ece6da" radius={12} />)}
                <div style={{ width: 84, height: 84, borderRadius: 12, border: `1.5px dashed ${B2.line}`, display: 'grid', placeItems: 'center', color: B2.faint, fontSize: 28, background: B2.panel }}>+</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Bt variant="ghost">Cancel</Bt>
              <Bt variant="danger" iconRight={B2I.arrow} style={{ marginLeft: 'auto' }}>Submit dispute</Bt>
            </div>
          </SC>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  NOTIFICATIONS  ─────────────────────────────
function Notifications() {
  const notes = [
    ['order', 'Order shipped', 'Your order NM-90388 has been picked up by Delhivery. AWB DL-44871902.', '10m ago', false],
    ['payment', 'Escrow released', 'We released ₹84,000 to Metro Wholesale after your delivery confirmation.', '2h ago', false],
    ['dispute', 'Dispute update', 'Janta Traders responded to your dispute on NM-90340.', '5h ago', false],
    ['order', 'New offer accepted', 'Verité Distributors accepted your offer of ₹6,000/unit.', '1d ago', true],
    ['system', 'Watchlist price drop', 'A lot on your watchlist dropped 12% — boAt Airdopes now ₹540/unit.', '1d ago', true],
    ['payment', 'Payment successful', 'Razorpay charged ₹3,21,545 for order NM-90388. Held in escrow.', '2d ago', true],
  ];
  const meta = { order: [B2.green, B2.green3soft, B2I.truck], payment: [B2.gold, B2.goldSoft, B2I.wallet], dispute: [B2.red, B2.redSoft, B2I.bolt], system: [B2.blue, B2.blueSoft, B2I.bell] };
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <BuyerSide2 active="Dashboard" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Notifications" subtitle="3 unread" actions={<><Bt variant="ghost" icon={B2I.check}>Mark all read</Bt><Av /></>} />
        <div style={{ maxWidth: 780, padding: '20px 32px' }}>
          <div className="tabbar" style={{ marginBottom: 16 }}>{['All', 'Orders', 'Payments', 'Disputes', 'System'].map((t, i) => <span key={t} className={`tab ${i === 0 ? 'on' : ''}`}>{t}</span>)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.map(([type, title, body, time, read], i) => {
              const [c, bg, ic] = meta[type];
              return (
                <div key={i} className="card" style={{ display: 'flex', gap: 14, padding: '15px 18px', background: read ? B2.card : '#fffdf8', borderColor: read ? B2.line : B2.goldLine, position: 'relative' }}>
                  {!read && <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: 999, background: B2.gold }} />}
                  <span style={{ width: 40, height: 40, borderRadius: 11, background: bg, color: c, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic2 d={ic} size={18} /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="disp" style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</span><span style={{ marginLeft: 'auto', fontSize: 11.5, color: B2.faint }}>{time}</span></div>
                    <div style={{ fontSize: 13, color: B2.muted, marginTop: 3, lineHeight: 1.45 }}>{body}</div>
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

// ─────────────────────────────  WATCHLIST  ─────────────────────────────
function Watchlist() {
  const { ListingCard, LISTINGS } = window.Pub;
  const saved = [LISTINGS[0], LISTINGS[2], LISTINGS[5], LISTINGS[3], LISTINGS[7], LISTINGS[8]];
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <BuyerSide2 active="Watchlist" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Watchlist" subtitle="6 saved lots · 2 dropped price" actions={<><Bt variant="primary" icon={B2I.box}>Browse more</Bt><Ib icon={B2I.bell} /></>} />
        <div style={{ padding: '24px 32px' }}>
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20, background: B2.green3soft, borderColor: '#cfe6d6' }}>
            <Ic2 d={B2I.bolt} size={17} style={{ color: B2.green }} /><span style={{ fontSize: 13, color: B2.green, fontWeight: 600 }}>2 lots on your watchlist dropped in price since you saved them.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {saved.map((l, i) => <ListingCard key={i} l={l} compact />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────  REFERRAL  ─────────────────────────────
function Referral() {
  return (
    <div className="nm" style={{ display: 'flex' }}>
      <BuyerSide2 active="Referral" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tb title="Refer & earn" subtitle="Earn ₹500 for every business that completes their first order" actions={<Av />} />
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 22, alignItems: 'start' }}>
          {/* code + QR */}
          <div style={{ borderRadius: 20, background: `linear-gradient(140deg,${B2.green},${B2.deep})`, color: '#fff', padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(244,168,42,.14)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)', marginBottom: 8 }}>Your referral code</div>
              <div className="num disp" style={{ fontSize: 34, fontWeight: 800, color: B2.gold2, letterSpacing: '.04em', marginBottom: 18 }}>ROHAN500</div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 12, width: 132, marginBottom: 18 }}>
                <img alt="QR code" width="108" height="108" src="https://api.qrserver.com/v1/create-qr-code/?size=108x108&data=https://nirmalmandi.in/r/ROHAN500&color=14492a" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Bt variant="gold" icon={B2I.tag}>Copy link</Bt>
                <Bt variant="ghost" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,.25)' }}>Share on WhatsApp</Bt>
              </div>
            </div>
          </div>
          {/* stats */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 16 }}>
              {[['Total invites', '24', B2I.spark], ['Successful referrals', '11', B2I.check], ['Total earned', '₹5,500', B2I.wallet], ['Pending', '₹1,500', B2I.box]].map(([k, v, d]) => (
                <div key={k} className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12.5, color: B2.muted, fontWeight: 600 }}>{k}</span>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: B2.green3soft, color: B2.green, display: 'grid', placeItems: 'center' }}><Ic2 d={d} size={15} /></span>
                  </div>
                  <div className="num" style={{ fontSize: 26, fontWeight: 800 }}>{v}</div>
                </div>
              ))}
            </div>
            <SC title="How it works" pad={22}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['Share your code', 'Send your link to other wholesalers and distributors.'], ['They sign up & order', 'Your referral registers and completes their first purchase.'], ['You both earn ₹500', 'Credited to your wallet after their order is delivered.']].map(([t, d], i) => (
                  <div key={t} style={{ display: 'flex', gap: 13 }}>
                    <span className="num disp" style={{ width: 30, height: 30, borderRadius: 999, background: B2.goldSoft, color: '#a9690a', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{i + 1}</span>
                    <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</div><div style={{ fontSize: 12.5, color: B2.muted, marginTop: 2 }}>{d}</div></div>
                  </div>
                ))}
              </div>
            </SC>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dispute, Notifications, Watchlist, Referral });

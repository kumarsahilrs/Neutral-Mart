// ds.jsx — NirmalMandi design system: Direction A layout language in Direction B's
// warm palette + type. Clean English copy. Everything exported to window.DS.
// Depends on window.NM (data), window.NMImg, window.NMIcon, window.I from shared.jsx.

const T = {
  ink: '#281f12', green: '#1f6b3a', green2: '#2f8049', deep: '#14492a',
  gold: '#ef8a17', gold2: '#f4a82a', goldSoft: '#fdeccc', goldLine: '#f0dcb0',
  paper: '#fbf5ea', card: '#fffdf8', panel: '#f6efe1',
  muted: '#7a6f5d', faint: '#a89c87', line: '#ece1cd', line2: '#f2ebdc',
  red: '#b6442a', redSoft: '#fbe7e2', blue: '#1f6b8a', blueSoft: '#e6f2f6',
  green3soft: '#e9f4ec',
};

if (typeof document !== 'undefined' && !document.getElementById('nm-ds-styles')) {
  const s = document.createElement('style');
  s.id = 'nm-ds-styles';
  s.textContent = `
  .nm{font-family:"Hanken Grotesk",sans-serif;color:${T.ink};background:${T.paper};width:100%;height:100%;overflow:hidden;-webkit-font-smoothing:antialiased}
  .nm *{box-sizing:border-box}
  .nm .disp{font-family:"Bricolage Grotesque",sans-serif;letter-spacing:-.015em}
  .nm .num{font-family:"Bricolage Grotesque",sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
  .nm .pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;line-height:1.2}
  .nm .card{background:${T.card};border:1px solid ${T.line};border-radius:18px}
  .nm .navlink{font-size:14.5px;font-weight:600;cursor:pointer}
  .nm .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-family:"Bricolage Grotesque",sans-serif;font-weight:600;border:none;cursor:pointer;border-radius:12px;white-space:nowrap}
  .nm .ipt{display:flex;align-items:center;gap:9px;background:${T.card};border:1px solid ${T.line};border-radius:12px;padding:12px 15px;font-size:14px;color:${T.muted}}
  .nm table{border-collapse:collapse;width:100%}
  .nm th{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:${T.faint};font-weight:700;text-align:left;padding:0 16px 12px}
  .nm td{font-size:13.5px;padding:14px 16px;border-top:1px solid ${T.line}}
  .nm .label{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${T.faint};font-weight:700}
  .nm .tabbar{display:flex;gap:6px;flex-wrap:wrap}
  .nm .tab{font-size:13px;font-weight:600;padding:8px 15px;border-radius:999px;cursor:pointer;color:${T.muted};background:transparent;border:1px solid ${T.line}}
  .nm .tab.on{background:${T.green};color:#fff;border-color:${T.green}}
  `;
  document.head.appendChild(s);
}

const Ic = (props) => window.NMIcon(props);
const I = window.I;

// ── Brand ───────────────────────────────────────────────────────────────
function Brand({ light, sub, size = 20 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: size + 18, height: size + 18, borderRadius: 12, background: T.gold, color: T.deep, display: 'grid', placeItems: 'center', boxShadow: '0 2px 0 rgba(0,0,0,.12)', flexShrink: 0 }}>
        <Ic d={I.box} size={size - 1} sw={2} />
      </span>
      <div style={{ lineHeight: 1.05 }}>
        <span className="disp" style={{ fontSize: size, fontWeight: 800, color: light ? '#fff' : T.ink }}>Nirmal<span style={{ color: light ? T.gold2 : T.green }}>Mandi</span></span>
        {sub && <div style={{ fontSize: 11, fontWeight: 600, color: light ? 'rgba(255,255,255,.6)' : T.faint, letterSpacing: '.03em', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────
function Btn({ children, variant = 'primary', size = 'md', icon, iconRight, style = {}, full }) {
  const sizes = { sm: '8px 14px', md: '12px 18px', lg: '15px 22px' };
  const fs = { sm: 13, md: 14.5, lg: 15.5 };
  const variants = {
    primary: { background: T.green, color: '#fff' },
    gold: { background: T.gold, color: T.deep },
    dark: { background: T.deep, color: '#fff' },
    outline: { background: T.card, color: T.ink, border: `1.5px solid ${T.ink}` },
    soft: { background: T.green3soft, color: T.green },
    ghost: { background: 'transparent', color: T.muted, border: `1px solid ${T.line}` },
    danger: { background: T.red, color: '#fff' },
  };
  return (
    <button className="btn" style={{ padding: sizes[size], fontSize: fs[size], width: full ? '100%' : 'auto', ...variants[variant], ...style }}>
      {icon && <Ic d={icon} size={fs[size] + 2} />}{children}{iconRight && <Ic d={iconRight} size={fs[size] + 2} />}
    </button>
  );
}

// ── Pills / badges ──────────────────────────────────────────────────────
function Pill({ children, color = T.muted, bg = T.panel, icon, style }) {
  return <span className="pill" style={{ color, background: bg, ...style }}>{icon && <Ic d={icon} size={12} />}{children}</span>;
}

const STATUS = {
  'Shipped': [T.green2, T.green3soft], 'In transit': [T.blue, T.blueSoft], 'Awaiting ship': ['#a9690a', T.goldSoft],
  'In escrow': [T.blue, T.blueSoft], 'Delivered': [T.green, T.green3soft], 'Completed': [T.green, T.green3soft],
  'Disputed': [T.red, T.redSoft], 'Cancelled': [T.muted, '#efe9dd'], 'Pending': ['#a9690a', T.goldSoft],
  'Pending payment': ['#a9690a', T.goldSoft], 'Paid': [T.green2, T.green3soft], 'Confirmed': [T.green2, T.green3soft],
  'Live': [T.green2, T.green3soft], 'Paused': ['#a9690a', T.goldSoft], 'Sold': [T.muted, '#efe9dd'],
  'Expired': [T.muted, '#efe9dd'], 'Flagged': [T.red, T.redSoft], 'Verified': [T.green, T.green3soft],
  'Rejected': [T.red, T.redSoft], 'Open': [T.red, T.redSoft], 'Under review': [T.blue, T.blueSoft],
  'Resolved': [T.green, T.green3soft], 'Escalated': ['#a9690a', T.goldSoft], 'Active': [T.green, T.green3soft],
  'Suspended': [T.red, T.redSoft], 'Processed': [T.green, T.green3soft], 'Released': [T.green, T.green3soft],
  'Holding': [T.blue, T.blueSoft],
};
function Badge({ s }) {
  const [c, bg] = STATUS[s] || [T.muted, T.panel];
  return <span className="pill" style={{ color: c, background: bg, fontWeight: 700 }}>{s}</span>;
}

// ── KPI card ────────────────────────────────────────────────────────────
function Kpi({ label, value, sub, icon, pos }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: T.muted, fontWeight: 600 }}>{label}</span>
        {icon && <span style={{ width: 32, height: 32, borderRadius: 10, background: T.green3soft, color: T.green, display: 'grid', placeItems: 'center' }}><Ic d={icon} size={15} /></span>}
      </div>
      <div className="num" style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: pos === true ? T.green2 : pos === false ? T.red : T.muted, fontWeight: pos != null ? 700 : 600, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── App sidebar ─────────────────────────────────────────────────────────
function Sidebar({ items, active, brandSub, footer, width = 236 }) {
  return (
    <div style={{ width, background: T.deep, color: '#fff', padding: '22px 16px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '0 8px 24px' }}><Brand light sub={brandSub} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(([t, d]) => {
          const on = t === active;
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, fontSize: 14, fontFamily: '"Bricolage Grotesque"', fontWeight: on ? 700 : 500, background: on ? T.gold : 'transparent', color: on ? T.deep : 'rgba(255,255,255,.82)' }}>
              <Ic d={d} size={18} />{t}
            </div>
          );
        })}
      </div>
      {footer && <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16 }}>{footer}</div>}
    </div>
  );
}

// ── App topbar ──────────────────────────────────────────────────────────
function Topbar({ title, subtitle, actions }) {
  return (
    <div style={{ height: 76, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 16, background: T.card, flexShrink: 0 }}>
      <div>
        <div className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: T.muted }}>{subtitle}</div>}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>{actions}</div>
    </div>
  );
}

function IconBtn({ icon }) {
  return <span style={{ width: 42, height: 42, borderRadius: 999, border: `1px solid ${T.line}`, display: 'grid', placeItems: 'center', color: T.muted, flexShrink: 0 }}><Ic d={icon} size={18} /></span>;
}

function Avatar({ initials = 'RM', size = 42, light }) {
  return <span className="disp" style={{ width: size, height: size, borderRadius: 999, background: light ? 'rgba(255,255,255,.16)' : T.goldSoft, color: light ? '#fff' : T.gold, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.34, flexShrink: 0 }}>{initials}</span>;
}

// ── Public top nav ──────────────────────────────────────────────────────
function TopNav({ active, search = 'Search 12,400+ lots — phones, textiles, FMCG…' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 26, height: 76, padding: '0 36px', background: T.deep, color: '#fff', flexShrink: 0 }}>
      <Brand light />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 440, background: 'rgba(255,255,255,.1)', borderRadius: 999, padding: '11px 18px' }}>
        <Ic d={I.search} size={17} style={{ color: 'rgba(255,255,255,.65)' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,.6)' }}>{search}</span>
      </div>
      {['Browse Deals', 'How it works'].map((l) => (
        <span key={l} className="navlink" style={{ color: l === active ? T.gold2 : 'rgba(255,255,255,.82)' }}>{l}</span>
      ))}
      <Btn variant="gold" size="sm">Sell Now</Btn>
      <Avatar light />
    </div>
  );
}

// ── Misc ────────────────────────────────────────────────────────────────
function Field({ label, value, placeholder, hint, w = '100%', icon }) {
  return (
    <label style={{ display: 'block', width: w }}>
      {label && <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, marginBottom: 7 }}>{label}</div>}
      <div className="ipt">{icon && <Ic d={icon} size={16} style={{ color: T.faint }} />}<span style={{ color: value ? T.ink : T.faint }}>{value || placeholder}</span></div>
      {hint && <div style={{ fontSize: 11.5, color: T.faint, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

function Toggle({ on, color = T.green }) {
  return (
    <span style={{ width: 40, height: 23, borderRadius: 999, background: on ? color : '#d8cfbd', position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2.5, left: on ? 19.5 : 2.5, width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .15s' }} />
    </span>
  );
}

function SectionCard({ title, action, children, pad = 22, style }) {
  return (
    <div className="card" style={{ ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `18px ${pad}px 0` }}>
          {title && <h3 className="disp" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
}

// AppShell — sidebar + topbar + scrollable body, fixed-size for an artboard
function AppShell({ sidebar, topbar, children, bg = T.paper }) {
  return (
    <div className="nm" style={{ display: 'flex', background: bg }}>
      {sidebar}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {topbar}
        <div style={{ padding: '24px 32px' }}>{children}</div>
      </div>
    </div>
  );
}

window.T = T;
window.DS = { T, Brand, Btn, Pill, Badge, Kpi, Sidebar, Topbar, IconBtn, Avatar, TopNav, Field, Toggle, SectionCard, AppShell, Ic, STATUS };

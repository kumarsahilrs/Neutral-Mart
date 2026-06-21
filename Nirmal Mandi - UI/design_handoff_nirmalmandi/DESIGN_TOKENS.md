# Design Tokens — NirmalMandi

All values are taken directly from the prototype's design-system kit (`reference/app/ds.jsx`, object `T`) and global CSS. These are the single source of truth.

---

## Color

### Brand / greens
| Token | Hex | Usage |
|---|---|---|
| `green` | `#1f6b3a` | Primary buttons, primary actions, positive deltas, links, active filter pills |
| `green2` | `#2f8049` | Positive text/status (lighter), gradient ends |
| `deep` | `#14492a` | Sidebars, hero/dark panels, dark CTAs, AI-insight panels |
| `green3soft` | `#e9f4ec` | Soft green fill (escrow boxes, "soft" buttons, verified badges) |

### Accent / gold (marigold/saffron)
| Token | Hex | Usage |
|---|---|---|
| `gold` | `#ef8a17` | Secondary CTA ("gold" button), brand logo tile, urgency icons |
| `gold2` | `#f4a82a` | Gold gradient end, highlight numbers on dark panels |
| `goldSoft` | `#fdeccc` | Warning/urgency banner fill, "Tier verify" notice, on-hold pills |
| `goldLine` | `#f0dcb0` | Border for gold-soft surfaces |
| gold text-on-soft | `#a9690a` | Text/icon color on `goldSoft` surfaces |

### Surfaces / neutrals
| Token | Hex | Usage |
|---|---|---|
| `ink` | `#281f12` | Primary text |
| `paper` | `#fbf5ea` | App/page background (cream) |
| `card` | `#fffdf8` | Card background (warm white) |
| `panel` | `#f6efe1` | Inset panels, input idle fills, unselected segmented chips |
| `muted` | `#7a6f5d` | Secondary text |
| `faint` | `#a89c87` | Tertiary text, placeholders, table header labels |
| `line` | `#ece1cd` | Default borders / dividers |
| `line2` | `#f2ebdc` | Lighter inner dividers (table rows, list separators) |

### Status / semantic
| Token | Hex | Soft fill | Usage |
|---|---|---|---|
| `red` | `#b6442a` | `redSoft` `#fbe7e2` | Disputes, errors, danger buttons, ageing ≥30d, negative deltas |
| `blue` | `#1f6b8a` | `blueSoft` `#e6f2f6` | In-escrow / in-transit / info, "Buyer" role chip |
| green (reuse) | `#1f6b3a` | `green3soft` `#e9f4ec` | Delivered/Completed/Paid/Verified/Active/Resolved |
| gold-on-soft `#a9690a` | — | `goldSoft` `#fdeccc` | Pending / Awaiting / Under review / Escalated / Paused |
| `muted` | `#7a6f5d` | `#efe9dd` | Cancelled / Sold / Expired (neutral) |

**Status badge map** (label → [text color, fill]) is fully defined in `ds.jsx` (`STATUS`). Key ones: Shipped/Delivered/Completed/Paid/Confirmed/Verified/Active/Resolved/Processed → green; In transit/In escrow/Holding/Under review → blue; Pending/Awaiting ship/Paused/Escalated/Pending payment → gold; Disputed/Flagged/Rejected/Open/Suspended → red; Cancelled/Sold/Expired → neutral.

### Gradients
- Hero / seller-CTA / payout banner: `linear-gradient(100deg, #1f6b3a, #14492a)` (green→deep).
- Urgency bar (listing detail): `linear-gradient(90deg, #ef8a17, #f4a82a)` (gold→gold2).
- Referral card: `linear-gradient(140deg, #1f6b3a, #14492a)`.
- Decorative blurred "blob" circles: `rgba(244,168,42,.10–.14)` gold and `rgba(47,128,73,.16–.20)` green, on dark panels.

---

## Typography

Load from Google Fonts:
```
Bricolage Grotesque — weights 400,500,600,700,800 (opsz 12..96)
Hanken Grotesk — weights 400,500,600,700,800
```

| Role | Family | Weight | Size (px) | Tracking | Notes |
|---|---|---|---|---|---|
| Display H1 (hero) | Bricolage Grotesque | 800 | 40–56 | -0.02em | line-height ~1.03 |
| Page title (topbar) | Bricolage Grotesque | 700 | 19–20 | -0.015em | |
| Section H2 | Bricolage Grotesque | 800 | 24–30 | -0.015em | |
| Card / section title | Bricolage Grotesque | 700 | 16 | -0.015em | |
| Big number / KPI | Bricolage Grotesque | 800 | 22–28 | -0.01em | tabular-nums |
| Hero price | Bricolage Grotesque | 800 | 42–44 | -0.02em | green |
| Body | Hanken Grotesk | 400–500 | 13.5–15 | — | line-height ~1.5 |
| Label / overline | Hanken Grotesk | 700 | 11 | 0.06em | UPPERCASE, color `faint` |
| Small / meta | Hanken Grotesk | 500 | 12–12.5 | — | color `muted` |

**Helper classes** in the prototype: `.disp` (Bricolage + tight tracking), `.num` (Bricolage + tabular-nums), `.label` (uppercase overline). Numbers/prices/IDs always use Bricolage tabular figures.

---

## Spacing, radius, shadow

- **Spacing scale (px):** 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40. Page padding `24px 32px` (app screens), `36px` (public). Card padding 18–28px. Grid gaps 12–16px between cards, 16–22px between sections.
- **Radius (px):** buttons & inputs `12`, cards & sections `18`, large feature cards/heroes `20–24`, pills/avatars/segmented `999`, small chips/icon tiles `8–13`.
- **Borders:** 1px `line` default; 1.5px for selected radio/checkbox cards (uses `green`); 4px left accent on admin alert cards.
- **Shadows:** mostly flat. Hover lift on hub role cards: `0 16px 40px rgba(40,31,18,.12)`. Login modal: `0 30px 80px rgba(0,0,0,.3)`. Brand logo tile: `0 2px 0 rgba(0,0,0,.12)`. Toggle knob: `0 1px 2px rgba(0,0,0,.2)`.
- **Icon stroke:** 1.7 (UI), 2–2.4 (emphasis). Icon tile sizes 26–48px.

---

## Component quick-reference (from `ds.jsx`)

- **Button** variants: `primary` (green/white), `gold` (gold/deep), `dark` (deep/white), `outline` (white/ink + 1.5px ink border), `soft` (green3soft/green), `ghost` (transparent/muted + line border), `danger` (red/white). Sizes sm `8×14`, md `12×18`, lg `15×22`; radius 12; font Bricolage 600.
- **Pill / Badge:** radius 999, padding `5×12`, font 12/600. Badge auto-colors by status label.
- **KPI card:** card surface, padding `18×20`, label (muted 12.5) + 30px green-soft icon tile, value (Bricolage 800, 28), sub-delta (green2 if positive / red if negative).
- **Sidebar:** width 236, `deep` background, white text; active item = `gold` fill + `deep` text, rounded 12; brand at top with sub-label; optional footer card.
- **Topbar:** height 76, card bg, 1px bottom border, title (Bricolage 700/20) + subtitle (muted 12.5), right-aligned actions.
- **Table:** header row — uppercase 11px `faint` labels; body rows 13.5px, 14px vertical padding, 1px `line` top border. Numbers right-aligned use `.num`.
- **Field:** label (12.5/600) + bordered input (radius 12, padding `12×15`) + optional hint (faint 11.5).
- **Toggle:** 40×23 track, green when on, white knob.

---

## Ready-to-paste Tailwind theme

```js
// tailwind.config.{js,ts} — theme.extend
export const nmTheme = {
  colors: {
    ink: '#281f12',
    paper: '#fbf5ea',
    card: '#fffdf8',
    panel: '#f6efe1',
    muted: '#7a6f5d',
    faint: '#a89c87',
    line: { DEFAULT: '#ece1cd', soft: '#f2ebdc' },
    green: { DEFAULT: '#1f6b3a', light: '#2f8049', deep: '#14492a', soft: '#e9f4ec' },
    gold:  { DEFAULT: '#ef8a17', light: '#f4a82a', soft: '#fdeccc', line: '#f0dcb0', ink: '#a9690a' },
    info:  { DEFAULT: '#1f6b8a', soft: '#e6f2f6' },
    danger:{ DEFAULT: '#b6442a', soft: '#fbe7e2' },
  },
  fontFamily: {
    display: ['"Bricolage Grotesque"', 'sans-serif'],
    sans: ['"Hanken Grotesk"', 'sans-serif'],
  },
  borderRadius: { btn: '12px', card: '18px', feature: '22px' },
  boxShadow: {
    lift: '0 16px 40px rgba(40,31,18,.12)',
    modal: '0 30px 80px rgba(0,0,0,.3)',
  },
};
```

```css
/* globals.css — base */
:root { --nm-paper:#fbf5ea; --nm-ink:#281f12; }
body { background: var(--nm-paper); color: var(--nm-ink); font-family:"Hanken Grotesk",sans-serif; -webkit-font-smoothing:antialiased; }
.font-display { font-family:"Bricolage Grotesque",sans-serif; letter-spacing:-.015em; }
.tabular { font-variant-numeric: tabular-nums; }
```

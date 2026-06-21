# Handoff: NirmalMandi — B2B Dead-Stock Liquidation Marketplace

> **Read this first.** The files in `reference/` are **design references created in HTML/React-in-the-browser** — prototypes that show the intended look, layout, and copy. They are **not** production code to copy verbatim. Your job is to **recreate these designs in the NirmalMandi codebase** (Next.js 14 App Router + React Query + TypeScript + Tailwind, per the project brief) using its established patterns, component library, and conventions. Where the real app already has a component (button, table, card), use it and theme it to match these tokens — don't paste the prototype's inline-styled JSX.

---

## Overview

NirmalMandi is a **B2B marketplace where wholesalers liquidate dead, excess, returned, and surplus inventory** to verified bulk buyers — escrow-protected, freight-included, fast payouts. The product spans **four user verticals**: Public/visitor, Buyer, Seller, and Admin. This handoff covers the **full end-to-end UI** for all four, 34 screens total.

The three signature/differentiating features to get right:
1. **Lot calculator + resale-margin estimator** (listing detail) — buyer enters a quantity, sees price breakdown + estimated resale margin.
2. **Capital recovery estimator** (seller dashboard) — waterfall from GMV → fees → net payout.
3. **Inventory ageing heatmap** (admin analytics) — sector × age-bucket matrix of stuck capital.

Plus an **AI "Market-it" caption generator** (listing detail) and an **escrow-protected order timeline + live Delhivery tracker** (buyer order detail).

---

## Fidelity: HIGH

These are **high-fidelity** mockups — final colors, typography, spacing, and layout. Recreate the UI to match pixel-for-pixel, but **rebuild it with the codebase's real components and Tailwind theme** (see `DESIGN_TOKENS.md` for the exact values and a ready-to-paste Tailwind config). Use the listed hex values, font families, and spacing precisely.

---

## The design language — "Mandi Bold, warm theme"

One system underlies every screen. It pairs a **bold, oversized, chunky layout** with a **warm, earthy, India-market-native palette**: deep forest green + marigold/saffron gold on a cream/parchment background. Copy is **clean English** (no Hinglish).

- **Display / headings / all numbers:** **Bricolage Grotesque** (weights 600–800, tight tracking `-0.015em`). Numbers use tabular figures.
- **Body / UI / labels:** **Hanken Grotesk** (weights 400–800).
- **Surfaces:** cream page `#fbf5ea`, card `#fffdf8`, hairline borders `#ece1cd`. Generous radii (cards 18px, pills 999px, buttons 12px).
- **Brand accents:** forest green `#1f6b3a` (primary actions, positive), deep green `#14492a` (sidebars, dark panels, hero), marigold `#ef8a17` / `#f4a82a` (secondary CTA, highlights, urgency).
- **Feel:** confident, energetic, trustworthy. Big type, clear price hierarchy, escrow/trust cues everywhere, urgency without being garish.

Full token table and Tailwind config: **`DESIGN_TOKENS.md`**.
Per-screen specs: **`SCREENS.md`**.
Drop-in rules file for Claude Code: **`CLAUDE.md`** (copy into your repo root).

---

## How the reference files are organized

The prototype is plain React (via in-browser Babel), **not** a build you should import. Logic lives in `reference/app/*.jsx`; each file exports screen components onto `window`. The HTML files (`public.html`, `buyer.html`, `seller.html`, `admin.html`) lay those screens out on a pan/zoom canvas for review. **`reference/app/ds.jsx` is the most important file** — it's the shared design-system kit (palette object `T`, global CSS string, and components: `Brand`, `Btn`, `Pill`, `Badge`, `Kpi`, `Sidebar`, `Topbar`, `TopNav`, `Avatar`, `Field`, `Toggle`, `SectionCard`, `AppShell`). Read it to see exact paddings, radii, and color usage; then build equivalents in your stack.

| Vertical | Reference file(s) | Screens |
|---|---|---|
| Public / visitor | `app/public.jsx`, `app/public2.jsx` | Homepage, Listings browse, Listing detail, Compare drawer, Login, Seller registration |
| Buyer | `app/buyer.jsx`, `app/buyer2.jsx` | Dashboard, Orders, Order detail + escrow timeline, Checkout, Dispute, Notifications, Watchlist, Referral |
| Seller | `app/seller.jsx`, `app/seller2.jsx` | Dashboard, Listings manager, New listing, Orders, Analytics (+AI), Payouts, Profile |
| Admin | `app/admin.jsx`, `app/admin2.jsx`, `app/admin3.jsx` | Login, Dashboard, KYC, Disputes, Analytics (+heatmap), Transactions, Inventory, Categories, Users, Payouts, Settings, Audit, Notifications |
| Shared | `app/ds.jsx`, `screens/shared.jsx` | Design-system kit; mock data, placeholder image, icon set |

To preview locally: open any of the `*.html` files in a browser (they fetch React/Babel from unpkg — needs internet). Pan/zoom the canvas; double-click an artboard's expand control for fullscreen.

---

## Documents in this package

- **`README.md`** (this file) — orientation, overview, fidelity, file map.
- **`DESIGN_TOKENS.md`** — every color, font, spacing, radius, shadow value + a ready-to-paste `tailwind.config` theme extension and a global CSS snippet.
- **`SCREENS.md`** — screen-by-screen specs: purpose, layout, components, exact copy, states, and the API endpoints each screen calls.
- **`CLAUDE.md`** — condensed rules to drop into your repo root so Claude Code follows the system automatically.
- **`reference/`** — the HTML prototypes and JSX source.

---

## Implementation notes

- **Icons:** the prototype draws a small inline stroke-icon set (`I` in `screens/shared.jsx`). In your app, use your existing icon library (e.g. **lucide-react**) — the names map directly: box, truck, shield, bolt, wallet, chart→bar-chart, spark→sparkles, heart, bell, search, check, tag, grid, user/users, gear→settings, doc→file. Match stroke weight ~1.7–2.
- **Placeholder images:** every product image in the prototype is a labelled grey placeholder (`NMImg`). Wire these to your real listing image fields; keep the same aspect ratios and radii.
- **Charts:** line charts (seller/admin analytics) and the ageing heatmap are hand-rolled SVG in the prototype. Rebuild with your charting lib (Recharts/visx) or keep simple SVG — values and colors are in `SCREENS.md`.
- **Numbers & currency:** Indian formatting throughout (₹, lakh/crore grouping like ₹18,40,000 and ₹6.4Cr). Use a locale-aware formatter (`en-IN`).
- **Responsive:** prototypes are drawn at desktop width (1280px). Brief calls for responsive down to mobile — sidebars collapse to a bottom tab bar or drawer; multi-column grids stack; tables become stacked cards (the Buyer Orders and Seller Orders screens already use a card-row pattern that works well on mobile).
- **Don't ship the mock data** in `screens/shared.jsx` — it's illustrative. Wire each screen to the API endpoints noted per-screen in `SCREENS.md`.

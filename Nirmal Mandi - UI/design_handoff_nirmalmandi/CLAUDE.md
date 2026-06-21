# NirmalMandi — UI implementation rules (for Claude Code)

Drop this in your repo root (or merge into an existing `CLAUDE.md`). It encodes the NirmalMandi design system so generated UI stays on-brand. Full detail in the handoff's `DESIGN_TOKENS.md` and `SCREENS.md`.

## What we're building
A B2B dead-stock liquidation marketplace (Next.js 14 App Router · React Query · TypeScript · Tailwind) with four roles: public/visitor, buyer, seller, admin. The HTML/JSX files in `design_handoff_nirmalmandi/reference/` are **design references** — recreate them with our real components and Tailwind theme, don't paste them.

## Visual system — "Mandi Bold, warm theme"
Bold, oversized, chunky layout in a warm earthy palette. Clean English copy (never Hinglish).

- **Fonts:** display/headings/**all numbers** = `Bricolage Grotesque` (600–800, tracking -0.015em, tabular numerals); body/UI = `Hanken Grotesk` (400–800). Load both from Google Fonts.
- **Core colors:** primary green `#1f6b3a`; deep green `#14492a` (sidebars, hero, dark panels); marigold `#ef8a17`/`#f4a82a` (secondary CTA, urgency, highlights); page cream `#fbf5ea`; card `#fffdf8`; border `#ece1cd`; ink `#281f12`; muted `#7a6f5d`.
- **Status:** green=delivered/paid/verified/active/resolved; blue `#1f6b8a`=in-escrow/in-transit/info; gold `#a9690a` on `#fdeccc`=pending/awaiting/under-review; red `#b6442a`=disputed/flagged/rejected/open; neutral=cancelled/sold/expired.
- **Radius:** buttons/inputs 12px, cards 18px, feature cards 20–24px, pills/avatars 999px. **Shadows:** mostly flat; lift cards on hover only.
- **Use the Tailwind theme** in `DESIGN_TOKENS.md` (colors, fontFamily display/sans, radius btn/card/feature). Don't invent colors outside it.

## Layout primitives
- **App shell:** 236px `deep` sidebar (active item = gold fill, deep text) + 76px topbar (Bricolage title + muted subtitle, actions right) + cream body padded `24px 32px`.
- **Public pages:** dark `deep` TopNav with rounded search + gold "Sell Now".
- **Cards/sections** = warm-white, 1px border, 18px radius, 18–28px padding. Grids use flex/grid + `gap` (never margin hacks).
- **Tables:** uppercase 11px faint headers; 13.5px rows; numbers right-aligned, Bricolage tabular. On mobile, switch dense tables to the card-row pattern (see Buyer/Seller Orders).

## Component conventions
Mirror these from `reference/app/ds.jsx`: `Btn` variants primary/gold/dark/outline/soft/ghost/danger (sizes sm/md/lg); `Badge` auto-colored by status label; `Kpi` (label + 30px green-soft icon tile + Bricolage-800 value + colored delta); `Pill`; `Field`; `Toggle`; `SectionCard`. Build real, reusable versions in our component library — one source of truth, themed by tokens.

## Must-get-right features
1. **Lot calculator + resale margin** (listing detail) — quantity drives live subtotal/fee/total + estimated resale margin box.
2. **Capital recovery estimator** (seller dashboard) — GMV → −fees → net-payout waterfall.
3. **Inventory ageing heatmap** (admin analytics) — sector × age-bucket matrix, green opacity = stuck capital.
4. **AI Market-it** caption generator (listing detail) and **escrow timeline + Delhivery tracker** (buyer order detail).

## Always
- Indian currency/number formatting (`en-IN`, ₹, lakh/crore: ₹18,40,000 · ₹6.4Cr).
- Show escrow/trust messaging on listing detail, checkout, order detail, seller payouts.
- Phone-OTP auth; tokens `nm_access_token`/`nm_user` (buyer/seller), `nm_admin_token` (admin); role-guard routes.
- Build empty, loading (skeleton), and error states for every list/table — references show happy path only.
- Icons via lucide-react; map names per handoff README. Wire placeholder images to real listing image fields.
- Responsive down to mobile: sidebar → drawer/bottom-tabs, KPI grids stack, tables → card rows.

## Never
- Never hardcode the prototype's mock data — wire to the documented API endpoints (see `SCREENS.md`).
- Never introduce colors/fonts/radii outside the token set.
- No Hinglish copy. No gradient-soup, no emoji beyond the few intentional urgency 🔥 accents.

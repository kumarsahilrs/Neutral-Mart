# Screens — NirmalMandi

34 screens across 4 verticals. Each entry: **purpose · layout · key components & copy · states · API**. Colors/fonts/spacing per `DESIGN_TOKENS.md`. Reference JSX noted per vertical.

Shared chrome:
- **Public TopNav** (`TopNav`): height 76, `deep` bg, brand left, rounded search field, "Browse Deals"/"How it works" links, gold "Sell Now" button, avatar. Active link → `gold2`.
- **App sidebar** (`Sidebar`): width 236, `deep` bg, active item = gold fill; brand + sub-label top; footer mini-card. Buyer/Seller/Admin each have their own nav list (below).
- **App topbar** (`Topbar`): title + subtitle left, actions right.
- **Status badges**: auto-colored by label (see tokens).

---

# 1 · PUBLIC / VISITOR  — `app/public.jsx`, `app/public2.jsx`

## 1.1 Homepage — `/`
**Purpose:** convert visitors to browse or sell.
**Layout:** TopNav → dark hero → sector pills → Flash sales grid → Featured deals grid → seller CTA band → footer.
- **Hero** (`deep` bg, decorative gold/green blobs): left = overline pill "India's B2B liquidation mandi", H1 **"Dead inventory, turned into cash."** (gold2 on 2nd line), subcopy, two CTAs (gold "Sell Now" + ghost "Browse Deals"), 3 stat blocks (₹240Cr+ GMV liquidated · 12,400+ live lots · 74% avg capital recovered). Right = tilted featured-lot card + floating gold "Escrow secured / +₹3.3L margin" chip.
- **Sector pills:** Electronics (active, green), Textiles & Apparel, FMCG, Auto Parts, Home & Kitchen, Footwear, Toys, Cosmetics.
- **Flash sales:** section title "🔥 Flash sales" + countdown pill "Ends in 04:12:55" + "View all →"; 4 `ListingCard`s.
- **Featured deals:** 8 `ListingCard`s (4-col grid).
- **Seller CTA band** (green→deep gradient): "Sitting on dead stock?" + subcopy + gold "List your inventory".
- **Footer:** brand + "© 2026 NirmalMandi · Escrow by RazorpayX · Logistics by Delhivery".

**`ListingCard`:** image w/ optional "🔥 Flash" pill + heart; sector + grade pills; title (Bricolage 15.5/700); seller · city; price row (green 24/800 ask, struck MRP, gold −% pill); footer MOQ + views.
**API:** `GET /inventory/listings` (featured/flash slices), categories list.

## 1.2 Listings browse — `/listings`
**Purpose:** search/filter/sort all lots.
**Layout:** TopNav → header row (title "All deals", count "12,408 lots", search field, sort dropdown) → 2-col: **filter sidebar (248px)** + **results**.
- **Filters card:** "Filters" + "Clear"; Price/unit dual-range slider (₹0–₹15k); checkbox groups — Sector, Condition grade (A/B/C/Scrap), Stock type (Dead/Excess/Surplus/Returns), Lot type (Full/Partial). First option checked = green check.
- **Results:** sort tabs (Newest active, Price Low→High, Most viewed, Ageing first) + right "Compare (2)" tab; 3-col `ListingCard` grid (compact); pagination ‹ 1 2 3 … 42 ›.
**States:** active filter pills, selected sort, compare counter.
**API:** `GET /inventory/listings?search&sector&grade&price&sort&page`.

## 1.3 Listing detail — `/listings/[id]`
**Purpose:** evaluate + buy/offer a lot. **Contains signature feature #1 (lot calculator) and AI Market-it.**
**Layout:** TopNav → **urgency bar** (gold gradient: "Ageing 22 days · seller is open to offers" + "Flash ends 04:12:55" pill) → breadcrumb → 2-col (gallery 1.32fr / info 1fr) → full-width Market-it panel.
- **Gallery:** main image (flash + −56% pills), 4 thumbnails (1st selected w/ green border), then **Lot specifications** 2-col grid (Model, Condition, Warranty, Units, Packaging, Batch).
- **Info column:** sector/grade/verified pills; H1 title (Bricolage 30/700); "by **Verité Distributors** · Surat"; **price** ₹6,200 / unit (green 44/800) + struck MRP ₹13,999 + gold "Save 56%" + "Resale est. ₹9,500".
- **Lot calculator** (gold-soft card): header "Lot calculator" + "MOQ 50 · Partial lot OK"; quantity stepper (− 100 +); rows Subtotal / Platform fee 2.5% / **You pay** (dashed divider); green result box **"Est. resale margin +₹3,30,000 ≈ 53% margin"**.
- **CTAs:** primary "Buy now", gold "Make offer", ghost heart (watchlist).
- **Quick stats:** 420 units available · 38 watching · Returns stock type.
- **Escrow box** (green-soft): "Escrow-protected payment — we hold your payment until you confirm the lot is received as described."
- **AI Market-it panel** (`deep` bg): overline "AI MARKET-IT", "Won the lot? Resell it in one tap.", gold "WhatsApp caption" + ghost "Instagram"; right = generated caption preview.
**States:** quantity drives calculator math live; watchlist toggle (filled heart); Buy → checkout; Make offer → negotiation modal.
**API:** `GET /inventory/listings/:id`; `POST/DELETE /inventory/listings/:id/watchlist`; `GET /ai/...` (caption); offer → negotiation.

## 1.4 Compare drawer — overlay
**Purpose:** side-by-side up to 3 lots.
**Layout:** right-side drawer (760px) over dim scrim; header "Compare lots / 3 of 3 selected" + close ×; 3 image cards; comparison table (rows: Price/unit [highlighted green], MRP, You save, Condition, Seller, Location, MOQ, Sector); footer "View lot" buttons (1st primary).
**API:** client-side from selected listings.

## 1.5 Buyer login — `/login`
**Purpose:** phone-OTP sign-in.
**Layout:** 2-pane. Left `deep` pane: brand, "Welcome back to the mandi.", subcopy, 3 stats. Right pane: "Sign in" + "We'll send a one-time code to your phone"; phone field; **6-box OTP** (4 filled, green borders); "Resend code in 0:24"; primary "Verify & continue"; "New seller? Register your business →".
**States:** phone entry → OTP sent → verifying → success redirect to `/dashboard`. Resend countdown.
**API:** `POST /auth/otp/send`, `POST /auth/otp/verify`. Store JWT `nm_access_token`, user `nm_user`.

## 1.6 Seller registration — `/seller-register`
**Purpose:** 4-step onboarding.
**Layout:** slim header (brand + "Sign in") → centered (max 720): H1 "List your inventory in 4 steps" + subcopy → **step indicator** (Phone ✓ / Business [active, gold] / GST & PAN / Bank, connectors green for done) → form card.
- **Shown step = Business:** "Business information" + subcopy; 2-col fields (Business name, Business type, State, City) + full-width "What do you typically liquidate?"; footer "← Back" + primary "Continue to GST & PAN".
- Other steps: **Phone** (phone + OTP), **GST & PAN** (GSTIN, PAN, optional MSME), **Bank** (account no., IFSC, account holder).
- Footer note "🔒 encrypted, used only for KYC."
**States:** multi-step state; per-step validation; progress fill.
**API:** `POST /auth/otp/*` (step 1), `POST /seller/register` (final).

---

# 2 · BUYER  — `app/buyer.jsx`, `app/buyer2.jsx`
**Sidebar nav:** Dashboard, Browse lots, Orders, Watchlist, Referral, Profile. Footer card: "Escrow protected — every order is held safe until you confirm delivery."

## 2.1 Dashboard — `/dashboard`
**Layout:** topbar "Welcome back, Rohan" / "Khanna Mobiles · Delhi" + "Browse inventory" + bell + avatar. 4 KPI cards (Total orders 38 +4 · Total spent ₹62.4L · Pending 3 · Delivered 32 84% on-time). Recent-orders table (Order, Item, Qty, Amount, Escrow [Holding/Released], Status, Date).
**API:** `GET /orders` (compute KPIs client-side), `GET /auth/me`.

## 2.2 Orders — `/orders`
**Layout:** topbar + search + "Export CSV". Status tabs (All, Pending payment, Paid, Shipped, Delivered, Completed, Disputed). **Card-row list** (mobile-friendly): thumbnail, item + id, "Qty · ordered Xh ago", in-escrow pill, amount (Bricolage 18/800), status badge, chevron. Pagination.
**API:** `GET /orders?status&search&page`.

## 2.3 Order detail + escrow timeline — `/orders/[id]`
**Purpose:** track an order. **Signature: escrow timeline + live Delhivery tracker.**
**Layout:** topbar "Order NM-90388" + "Download invoice" + status badge.
- **7-stage timeline card:** Order placed → Payment in escrow → Seller confirmed → Shipped → In transit (current, gold, pulsing, "Now") → Delivered → Payment released. Done = green check; current = gold truck w/ ring; future = faint numbered. Progress line green to current. Timestamps under completed.
- **Row:** Escrow card (green-soft, shield, "Payment held in escrow — ₹3,10,000 protected…") + **Live tracking** card (AWB DL-44871902, Delhivery, ETA Jun 7; 5-dot mini tracker Picked up→In transit→Reached hub[current]→Out for delivery→Delivered).
- **Row:** Amount breakdown (Subtotal, Platform fee 2.5%, GST on fee 18%, Freight, **Total paid ₹3,21,545**) + Seller card (avatar, Verité Distributors, Surat · 94% response · ★4.6) + actions (primary "Confirm receipt", ghost-red "Raise dispute").
**States:** stage set drives timeline; tracker only for shipped/in_transit/delivered; actions context-sensitive (Confirm receipt → releases escrow; Cancel only if pending).
**API:** `GET /orders/:id`, `GET /logistics/shipments/order/:id`, `POST /orders/:id/confirm-delivery`, `GET /invoices/:orderId`.

## 2.4 Checkout — `/checkout?listing_id=`
**Purpose:** address → freight → pay. **Signature feature dependency: tier gate.**
**Layout:** topbar + "Escrow-protected" pill. 2-col: **summary** (left) + **form** (right).
- **Summary:** product mini-card (image, title, seller, Grade B); line items (50×₹6,200, Platform fee, GST on fee, Freight); **Total ₹3,21,545**; escrow note card.
- **Form — Delivery address:** radio address cards (selected = green border + green-soft); "+ Add new address" (expands to Name/Phone/Line1&2/City/State/Pincode + save checkbox).
- **Freight option:** radio cards — Platform logistics · Delhivery (live estimate ₹2,400, selected), Seller self-ship (Free), Buyer pickup (Free).
- **Tier gate** (gold-soft): "Orders above ₹1L need Tier 2 verification before payment." + gold "Verify". (≥₹1L→Tier2, ≥₹10L→Tier3.)
- Primary "Pay ₹3,21,545 securely".
**States:** freight section appears after address; tier modal before pay; Razorpay → success → `/orders/:id?paid=true`.
**API:** `GET/POST /user/addresses`, `POST /logistics/freight-estimate`, `POST /orders/place`, `POST /payments/initiate`.

## 2.5 Dispute — `/orders/[id]/dispute`
**Layout:** topbar + Disputed badge; order-context card (image, item, seller·qty, amount); form card: reason chips (Item not as described [selected], Quantity mismatch, Damaged on arrival, Wrong grade, Never delivered, Other); description textarea (prefilled example); evidence (3 image tiles + upload tile); footer ghost "Cancel" + danger "Submit dispute".
**API:** `POST /orders/:id/dispute`.

## 2.6 Notifications — `/notifications`
**Layout:** topbar "3 unread" + "Mark all read". Tabs (All, Orders, Payments, Disputes, System). List cards: 40px type-icon tile (order=green/truck, payment=gold/wallet, dispute=red/bolt, system=blue/bell), title + time, body; unread = warm bg + gold dot.
**API:** `GET /notifications`, `GET /notifications/unread-count`.

## 2.7 Watchlist
**Layout:** topbar "6 saved lots · 2 dropped price" + "Browse more". Green-soft alert "2 lots dropped in price". 3-col `ListingCard` grid.
**API:** `GET /inventory/watchlist`.

## 2.8 Referral — `/referral`
**Layout:** topbar. 2-col: **code card** (green→deep gradient: "Your referral code" → **ROHAN500** (gold2), QR image [qrserver.com], gold "Copy link" + ghost "Share on WhatsApp") + **right** (4 stat cards: Total invites 24, Successful 11, Total earned ₹5,500, Pending ₹1,500; "How it works" 3 numbered steps).
**API:** `GET /referral`.

---

# 3 · SELLER  — `app/seller.jsx`, `app/seller2.jsx`
**Sidebar nav:** Dashboard, My Listings, Orders, Analytics, Payouts, Profile. Footer card: "Capital recovery 78% of dead-stock value recovered."

## 3.1 Dashboard — `/seller/dashboard`
**Purpose:** at-a-glance ops. **Signature feature #2: capital recovery estimator.**
**Layout:** topbar "Good morning, Rohan" / "Verité Distributors · Surat" + "+ New listing". Two **alert banners** (gold: "5 listings ageing 30+ days — consider a price drop"; blue: "6 orders awaiting your shipment confirmation"). 4 KPIs (GMV this month ₹18.4L +12.4% · Pending payout ₹4.28L Next Jun 12 · Active listings 27 +3 · Awaiting action 6). 2-col:
- **Capital recovery estimator** card: title + "What you'll actually receive this cycle."; bars GMV ₹18,40,000 (100%) → −Platform fee 2.5% −₹46,000 → −GST on fee 18% −₹8,280; green result **"Net payout ₹17,85,720"**.
- **Recent orders** table + quick-action soft buttons (Add listing / View orders / Check payouts).
**API:** `GET /seller/dashboard`.

## 3.2 Listings manager — `/seller/listings`
**Layout:** topbar + search + "+ New listing". Status tabs (All, Live, Paused, Sold, Expired, Flagged) + sort dropdown (Most views). Table: Listing (thumb+title), Asking, Status badge, Views, Watching, Age (red if ≥30d), Actions (Edit / Pause-Resume **Toggle** / delete-tag icon).
**States:** pause/resume toggle; delete → confirm modal.
**API:** `GET /inventory/listings/mine`.

## 3.3 New listing — `/seller/listings/new`
**Layout:** topbar + ghost "Save as draft" + primary "Publish". 2-col. Left: **Basics** (title, description textarea, category, price type) · **Pricing & quantity** (asking/unit, total qty, MOQ, condition grade, stock type, lot type) · **Photos** (3 tiles + drag-drop tile). Right: **Location** (state/city/pincode) · **Urgency** (1–5 selector, 4 active gold, "🔥 High — eligible for flash sale") · GSTIN note card.
**API:** `POST /inventory/listings`.

## 3.4 Orders (fulfilment) — `/seller/orders`
**Layout:** topbar + search. Tabs (All, Pending, Confirmed, Shipped, Delivered). Card-row list: thumb, item+id, buyer · qty · date, amount, status badge, context button (Awaiting ship → primary "Mark shipped"; In escrow → gold "Confirm"; else ghost "View").
**API:** `GET /seller/orders`, ship/confirm actions.

## 3.5 Analytics — `/seller/analytics`
**Purpose:** performance + **AI insights**.
**Layout:** topbar + period tabs (30d/90d[active]/6m/1y). 4 KPIs (Revenue ₹48.2L +18.4% · Orders 412 · CVR 1.66% · Avg response 1.8h). 2-col: **Revenue trend** line chart (SVG area, green) + **Conversion funnel** (Views 24,800→Inquiries 3,120→Orders 412→Repeat 96 bars). 2-col: **Top listings** table (Views/Inquiries/Orders/Revenue) + **AI Insights** panel (`deep` bg, overline "AI INSIGHTS", 3 check-bullets, e.g. price-drop suggestion, peak-window tip, response-time tip).
**API:** `GET /seller/analytics`, `GET /ai/seller/insights`.

## 3.6 Payouts — `/seller/payouts`
**Layout:** topbar. **Pending banner** (green→deep gradient: Pending payout ₹4,28,000 (gold2) · Expected Jun 12 · To account HDFC ••4471 · gold "Request payout"). 2-col: **In escrow** table (order, amount, release date) + **Payout history** table (Date, Orders, Gross, Commission, GST, TCS, **Net** [green], Status; "Download statements").
**API:** `GET /seller/payouts`, `GET /seller/escrow-status`.

## 3.7 Profile — `/seller/profile`
**Layout:** topbar + "Edit". Header card: 72px avatar (VD), "Verité Distributors", "Rohan Mehta · Member since Mar 2024", badges (KYC verified, Tier 3 seller, MSME registered), right stats (Listings 27 · Orders 412 · Rating 4.6★). 2-col detail cards: **Business details** (Phone, Business type, GSTIN, PAN, MSME) + **Location & bank** (State, City, Address, Bank account, IFSC).
**API:** `GET /seller/profile`.

---

# 4 · ADMIN  — `app/admin.jsx`, `app/admin2.jsx`, `app/admin3.jsx`
**Sidebar nav:** Dashboard, KYC, Disputes, Analytics, Transactions, Inventory, Categories, Users, Payouts, Settings, Audit log. Sub-label "Admin Console".

## 4.1 Admin login — `/login` (admin)
**Layout:** centered card on `deep` bg w/ blobs: brand, "Admin Console" pill, "Sign in to continue" + "Restricted access · OTP verification required", phone field, 6-box OTP, primary "Verify & enter console". Token: `nm_admin_token`.
**API:** `POST /auth/otp/*`.

## 4.2 Admin dashboard — `/` (admin)
**Layout:** topbar "Platform overview" / "Live · last 30 days". **6 KPI cards** (Total GMV ₹6.4Cr +14% · Active listings 12,408 +312 · Active sellers 1,840 +46 · Active buyers 8,120 +204 · Today's commission ₹1.6L +8% · Open disputes 23 +5 [negative/red]). 2-col: **GMV 30-day** area chart + 3 **alert cards** w/ left accent (Open disputes 23 red · Ageing listings 486 gold · Pending KYC 54 blue). **Recent transactions** table (Order, Buyer, Seller, Amount, Status, Time).
**API:** `GET /admin/stats/dashboard`, `/admin/stats/gmv`, `/admin/stats/alerts`.

## 4.3 KYC — `/kyc`
**Layout:** topbar. 4 stat cards (Total 1,894 · Pending 54 · Verified 1,786 · Rejected 54). Tabs (All, Pending[active], Verified, Rejected). Table: Seller (avatar+name), Phone, Documents ("GSTIN + PAN ↗"), Submitted, Status, Action (Pending → primary "Approve" + ghost-red "Reject"; else "Reviewed").
**API:** `GET /admin/kyc`, `POST /admin/kyc/:id/review {status, reason}`.

## 4.4 Disputes — `/disputes`
**Layout:** topbar "23 open · 8 under review". Tabs (Open[active], Under review, Resolved, Escalated). List cards: red bolt tile, reason title + id, "buyer vs seller · raised date", amount, status badge; first card **expanded** (buyer statement + admin-note input + "Resolve"/"Escalate").
**API:** `GET /admin/disputes`, resolve/escalate actions.

## 4.5 Analytics — `/analytics`
**Purpose:** **Signature feature #3: inventory ageing heatmap.**
**Layout:** topbar + period tabs + "Export". 2-col: **Inventory ageing heatmap** (sector rows × 0–30d/31–60d/61–90d+ cols; each cell ₹L value, green opacity scaled to value; legend Low→High "stuck capital") + **Demand vs supply** (bars Views 248K / Watchlists 38K / Live listings 12.4K; **D/S ratio 2.0×** "healthy"). **Seller scorecard** table (Seller, GMV, Orders, Conversion, Rating; "Sort: GMV ▾").
**API:** `GET /admin/stats/inventory-heatmap`, `/admin/stats/demand-supply`, `/admin/stats/seller-scorecard`.

## 4.6 Transactions — `/transactions`
**Layout:** topbar + search + "Export CSV". Filter chips (All status, Date range, Buyer, Seller, Amount range). Full ledger table (Order, Buyer, Seller, Amount, Status, Date).
**API:** `GET /admin/transactions`.

## 4.7 Inventory — `/inventory`
**Layout:** topbar. 3 stat cards (Total inventory value ₹5.21Cr · Ageing 30+ days 486 lots [red] · Stuck capital ₹1.84Cr [gold]). **Category breakdown** table (Category, Listings, Value, Ageing bar+% — red if ≥25%).
**API:** `GET /admin/inventory`.

## 4.8 Categories — `/categories`
**Layout:** topbar + "Add category". Table: Category (icon tile+name), Slug (/slug), Active listings, Status **Toggle**, Actions (Edit / Deactivate-Activate).
**API:** `GET /admin/categories`, add/edit/deactivate.

## 4.9 Users — `/users`
**Layout:** topbar "9,960 users" + search. Tabs (All, Buyers, Sellers). Table: Name (avatar), Phone, Role pill (Seller=green / Buyer=blue), Status badge, Joined, Action (View / Suspend-Activate).
**API:** `GET /admin/users`, suspend/activate.

## 4.10 Payouts — `/payouts` (admin)
**Layout:** topbar + "Process all ready". 3 stat cards (Pending ₹9.27L · Processed today ₹13.4L · On hold ₹1.16L). 2-col: **Pending payouts** table (Seller, Amount, Account, Action — Ready→"Process", else "On hold" pill) + **Recent settlements** table (Date, Seller, Net).
**API:** `GET /admin/payouts`, process action.

## 4.11 Settings — `/settings`
**Layout:** topbar + "Save changes". 2-col. Left: **Platform configuration** (Platform fee 2.5%, GST on fee 18%, Dispute auto-close 7 days, Escrow release 3 days — each a label+sub+value input). Right: **KPI alert thresholds** (Open disputes 20, Ageing days 30, Low conversion 1.0%) + **Notifications** (Weekly report toggle; recipient email chips + "+ Add").
**API:** `GET/PATCH /admin/settings`.

## 4.12 Audit log — `/audit`
**Layout:** topbar + action-type & date filters. List rows: action-type icon tile, "**Actor** · action", target, time. Examples: KYC approved, Dispute resolved, Payout processed, User suspended, KYC rejected, Settings changed, Category deactivated.
**API:** `GET /admin/audit`.

## 4.13 Notifications — `/notifications` (admin)
**Layout:** topbar "3 unread · platform alerts" + "Mark all read". Tabs (All, KYC, Disputes, Ageing, System). Cards like buyer notifications but platform types: new KYC submission, dispute escalated, ageing alert, weekly report ready; unread = warm bg + gold dot.
**API:** `GET /admin/notifications`.

---

## Cross-cutting behavior
- **Auth:** phone-OTP everywhere. Tokens: buyer/seller `nm_access_token` + `nm_user`; admin `nm_admin_token`. Guard routes by role.
- **Escrow language** must appear on listing detail, checkout, order detail, and seller payouts — it's the platform's core trust promise.
- **Indian number formatting** (`en-IN`, ₹, lakh/crore) on every monetary value.
- **Empty/loading/error states:** every list/table needs an empty state (e.g. "No orders yet"), skeletons while fetching, and error toasts. The prototype shows the happy path only.
- **Responsive:** sidebars → drawer/bottom-tabs; KPI grids → 2-col then 1-col; data tables → the card-row pattern already used on Buyer/Seller Orders.

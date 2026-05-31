# NirmalMandi — Build Plan
**Locked: 2026-05-31 | 3 Phases · 16 Sprints**

---

## PHASE 1 — MVP
> Goal: Real end-to-end transaction possible. Seller registers → lists → buyer discovers → pays via escrow → gets notified.

### Sprint 1 — Transaction Foundation ✅
- [x] `/auth/verify-bank` + `/auth/kyc-upload-url` endpoints added to auth-service
- [x] `002_missing_columns.sql` — adds fcm_token, seller address fields, negotiation_offers, auction_bids, saved_searches, buyer_addresses, ai_credits_log, referrals, dispute evidence
- [x] Notification processor `full_name` → `name` column fix
- [ ] Docker-compose local boot (all services green)
- [ ] AWS RDS + ElastiCache + OpenSearch dev provisioning
- [ ] Standardise `req.user.sub` across all services (Tech Lead)

### Sprint 2 — Payment + Listings Core ✅
- [x] Razorpay checkout fully wired (web) — order → payment initiation → Razorpay modal
- [x] GST breakdown in checkout (subtotal + platform fee + GST on fee + freight)
- [x] Lot calculator on listing detail (quantity → total, per-unit, resale, margin)
- [x] Sector-specific field display on listing detail
- [x] `/admin/stats/dashboard` + `/admin/stats/gmv` + `/admin/stats/alerts` endpoints
- [x] Admin dashboard wired to statsApi
- [ ] Delhivery freight estimate wired (remove fallback)

### Sprint 3 — AI Marketing Panel + Notifications ✅
- [x] `MarketingPanel.tsx` web component — language/tone/platform selectors, AI caption, copy, share
- [x] "Generate Marketing Content" button on listing detail
- [x] `marketing.tsx` mobile screen — full AI caption UI with share
- [x] FCM service fully built (Firebase Admin SDK)
- [x] WhatsApp service fully built (Twilio + Hindi templates)
- [x] Notification queue processor (Bull + Redis) — wires FCM + WhatsApp
- [ ] Add OPENAI_API_KEY or ANTHROPIC_API_KEY to `.env` and test AI endpoints

### Sprint 4 — AI Listing Flow + QA
- [ ] AI Listing 6-step flow on web (`/seller/listings/new`) — prompt → category → vision → pricing → lot → preview
- [ ] Order tracking timeline view (7-stage visual)
- [ ] Flash sale horizontal strip with countdown timers on home
- [ ] AI match banner on home ("X deals matched today")
- [ ] KYC document viewer in admin panel
- [ ] Postman happy-path collection (register → list → buy → escrow → notify)
- [ ] Integration test — auth flow (OTP → register → JWT → protected route)

---

## PHASE 2 — Post-Launch (Weeks 5-10)

### Sprint 5 — Negotiation Flow ✅
- [x] `negotiation.ts` service fully implemented (initiate, counter, accept, reject, 5-round limit, 48h expiry)
- [x] `auction.ts` service fully implemented (WebSocket bids, anti-sniping, outbid notifications)
- [x] Both registered in `order-service/src/index.ts` — WebSocket at `/ws/auction`
- [x] `NegotiationModal.tsx` — Make Offer button, AI fair price suggestion, offer thread
- [x] `negotiationsApi` added to `web/src/lib/api.ts`
- [ ] Negotiation thread polling / real-time updates on web

### Sprint 6 — Auction UI + WebSocket Frontend
- [ ] Auction listing UI — live bid display, countdown clock, "Place Bid" primary CTA
- [ ] WebSocket client hook (`useAuction.ts`) for real-time bid updates
- [ ] Outbid push notification trigger
- [ ] Reserve not met handling UI
- [ ] Bid increment validation on frontend

### Sprint 7 — Buyer Intelligence + Search
- [ ] Save search with push notification alerts
- [ ] Watchlist price drop alert background job
- [ ] Voice search mic wired to Whisper API
- [ ] AI search autocomplete from `/search/suggest`
- [ ] Side-by-side lot comparison (up to 3 listings)
- [ ] Buyer Tier 2 verification flow (checkout > ₹1L)
- [ ] Buyer Tier 3 verification flow (checkout > ₹10L)
- [ ] "Market Again" + Reorder + CSV export in purchase history

### Sprint 8 — Seller Intelligence
- [ ] Per-listing performance metrics (views, inquiries, watchlist saves, CVR)
- [ ] AI urgency score visible on seller listing cards
- [ ] Bulk actions in seller listings (pause/unpause/delist/relist/price change)
- [ ] Seller analytics — revenue chart, category performance, conversion funnel
- [ ] AI insights panel in seller analytics (top 3 recommendations this week)
- [ ] Inventory aging alerts on seller dashboard
- [ ] Mobile seller analytics tab

### Sprint 9 — Admin Intelligence + 3PL
- [ ] Inventory age heatmap in admin (green → red by listing age)
- [ ] Demand-supply gap visualization
- [ ] Seller performance scorecard per seller
- [ ] Category management — approve/reject AI-generated categories
- [ ] Real-time transaction feed on admin dashboard
- [ ] Delhivery 3PL — book shipment, get AWB, tracking
- [ ] Shiprocket integration
- [ ] Live logistics tracking in order detail

### Sprint 10 — Referral Engine + BI Engines 1-4
- [ ] Referral engine — unique link, click/conversion tracking, earnings calculation
- [ ] Tiered rewards (Silver/Gold/Platinum)
- [ ] Referral dashboard — QR code, share via WhatsApp
- [ ] BI Engine 1: Sales velocity predictor (real data)
- [ ] BI Engine 2: Demand-supply gap (search logs vs listings)
- [ ] BI Engine 3: Revenue forecasting (Prophet)
- [ ] BI Engine 4: Inventory aging risk (ML scoring)
- [ ] Weekly auto-report email — every Monday 8AM IST
- [ ] Configurable KPI alert thresholds in admin settings

---

## PHASE 3 — V2.0 (Weeks 11-16)

### Sprint 11 — AI Marketing Phase B (Branded Graphics)
- [ ] AI branded graphic generator (product image + price overlay + deal badge)
- [ ] Format selector (Square/Horizontal/Vertical)
- [ ] AI credit system (5 free/day, deduct from balance)
- [ ] Credit balance shown in marketing panel

### Sprint 12 — Agent Web Panel + Voice TTS
- [ ] Agent side panel on web (collapsible right panel)
- [ ] Wire agent tool execution (search_listings, get_order_status, etc.)
- [ ] Google TTS voice responses
- [ ] Voice input mic on web (Whisper)

### Sprint 13 — RFQ + PO System
- [ ] RFQ (Request for Quotation) flow
- [ ] Purchase Order generation (PDF)
- [ ] Sector-specific compliance checks (drug license, RTO)
- [ ] In-app voice messages

### Sprint 14 — BI Engines 5-8 + Board Reports
- [ ] BI Engine 5: Buyer behavior event stream → ClickHouse
- [ ] BI Engine 6: Seller acquisition targeting
- [ ] BI Engine 7: CVR optimization signals
- [ ] BI Engine 8: Geographic demand mapping
- [ ] Board-ready PDF export

### Sprint 15 — Reseller Storefront + Multi-Language
- [ ] Reseller storefront (personal mini-catalogue with shareable link)
- [ ] Reseller margin setting
- [ ] Multi-language captions (Gujarati, Punjabi, Marathi)
- [ ] AI image enhancement of product photos
- [ ] Video reel script generation

### Sprint 16 — Production + Hardening
- [ ] Car carrier + cold chain + digital delivery logistics
- [ ] BNPL integration
- [ ] Seller e-signature on registration (DocuSign)
- [ ] DPDP Act 2023 compliance (consent management)
- [ ] TCS under GST marketplace operator rules
- [ ] Full E2E test suite
- [ ] AWS ECS Fargate production deploy
- [ ] Datadog monitoring

---

## Confirmed Cuts (not building)
- Custom ML model training — use Claude/OpenAI until Phase 3 data exists
- MLOps pipeline
- Blockchain escrow
- General messaging (deal-scoped negotiation chat only)
- App Store / Play Store submission (Expo Go for MVP, stores in Phase 2)

---

## Execution Command
Say `start Sprint X` in any session and the agent builds it immediately — backend first, frontend wired, verified.

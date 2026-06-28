# NirmalMandi — Feature Backlog

Pipeline: **Build → Test → QA → Deploy → Verify**
Approach: One feature at a time, built across all three portals before moving to next.

---

## PHASE 1 — Dev Framework ✅ COMPLETE
- [x] GitHub Actions CI pipeline (.github/workflows/ci.yml)
- [x] Feature backlog document
- [x] Daily standup template (docs/STANDUP.md)
- [x] Production runbook (docs/RUNBOOK.md)

---

## PHASE 2 — Feature Completion

### Feature 1: Edit Listing ✅ COMPLETE (commit: 90ed8dd)
- [x] Seller: `seller/listings/[id]/edit/page.tsx` — full inline edit form, pre-filled
- [x] Backend: PATCH allowed fields extended (mrp, dead_stock_type, condition_grade, lot_type, moq, unit, price_type, state, city)
- [x] Admin: Inventory actions — Pause/Unpause toggle, Delist with confirm, error toasts
- [x] api.ts: updateListing expanded to all editable fields

### Feature 2: KYC ✅ COMPLETE (commit: 7a0bca0)
- [x] Seller: `seller/kyc/page.tsx` — status banner, document checklist, tier progression
- [x] Admin: KYC queue response shape fixed (rows/stats endpoints aligned)
- [x] Admin: KYC stats return pending/approved/rejected counts + UI-expected fields

### Feature 3: Notifications ✅ COMPLETE (commit: 0e942a5)
- [x] Seller: `seller/notifications/page.tsx` — list, tabs, mark read, mark all read, empty state
- [x] Dashboard banner bug fixed (was always showing due to missing d.total_listings)
- [x] New listing form: duplicate stock-type field removed

### Feature 4: Order Detail & Dispute ✅ ALREADY COMPLETE
- [x] Buyer: `/orders/[id]/page.tsx` — full timeline, confirm delivery, dispute link
- [x] Seller: `/seller/orders` → "View order" links to shared detail
- [x] Admin: disputes queue with SLA timers, resolve modal, status tabs
- [x] Dispute raise: field names fixed (orderId, reason enum, evidence upload)

### Feature 5: Analytics ✅ ALREADY COMPLETE
- [x] Seller: analytics page with revenue chart, funnel, top listings, AI insights
- [x] Numeric coercion for all SQL aggregate fields (prevents .toFixed crash)
- [x] Admin: GMV chart, seller scorecard available via analytics-service

### Feature 6: Payouts ✅ ALREADY COMPLETE
- [x] Seller: payouts page hitting /seller/payouts + /seller/escrow-status
- [x] Admin: /admin/payouts — approve/hold/release/bulk actions wired

### Feature 7: Search ✅ WORKING (DB ILIKE, no ES needed for demo)
- [x] Public marketplace: text search via GET /inventory/listings?search=...
- [x] Filters: sector, price range, sort working via DB query
- Note: Elasticsearch enhances but is not required — DB search is sufficient for demo

---

## PHASE 2 — Remaining Items

### Seller Dashboard Bugs ✅ ALL FIXED this session
- [x] Dashboard onboarding banner always-on → fixed (uses active_listings)
- [x] Duplicate stock-type field in new listing form → removed
- [x] Edit listing 404 → page created
- [x] KYC page 404 → page created
- [x] Notifications page 404 → page created

### Admin Dashboard Bugs ✅ FIXED
- [x] Users list empty → SQL type mismatch fixed (COALESCE varchar/int)
- [x] KYC list empty → response shape fixed ({rows} not {data})
- [x] KYC stats → aligned to page expectations
- [x] Disputes routing → fixed to order-service
- [x] Payouts/audit-log → new admin routers created

---

## PHASE 3 — Hardening (next)

### Seller-specific remaining
- [ ] Seller settings: "Change password" form wire up (PATCH /auth/password)
- [ ] Seller profile: business_name/gst_number updates need seller_profiles endpoint
- [ ] Language preference backend: expand beyond en/hi to all 8 codes ✅ done

### Cross-portal
- [ ] Real-time notifications (WebSocket or polling on unread count badge in nav)
- [ ] Image uploads to real S3 (add AWS keys to inventory-service)
- [ ] Razorpay checkout (add test keys to payment-service)

### Production
- [ ] Domain purchase + DNS (after first seller onboards)
- [ ] Resend production email sender (after domain)
- [ ] Mobile app (Expo) deployment
- [ ] Load testing

---

## Blocked Items
| Item | Blocker | Action needed |
|------|---------|---------------|
| Razorpay checkout | Test keys needed | Add RAZORPAY_KEY_ID/SECRET to Railway payment-service |
| S3 image CDN | AWS keys needed | Add AWS_* vars to Railway inventory-service |
| Email (production) | Domain needed | Purchase domain ~2 weeks after first seller |

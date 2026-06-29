# NirmalMandi — Feature Backlog

Pipeline: **Build → Test → QA → Deploy → Verify**
Approach: One feature at a time, built across all three portals before moving to next.

---

## PHASE 1 — Dev Framework ✅ COMPLETE
- [x] GitHub Actions CI pipeline
- [x] Daily standup template (STANDUP.md)
- [x] Feature backlog (this file)
- [x] Production runbook (RUNBOOK.md)

---

## PHASE 2 — Feature Completion ✅ ALL COMPLETE
- [x] Feature 1: Edit Listing (seller + admin)
- [x] Feature 2: KYC page (seller + admin queue)
- [x] Feature 3: Notifications (seller + buyer + admin)
- [x] Feature 4: Order Detail + Dispute (all portals)
- [x] Feature 5: Analytics (seller + admin)
- [x] Feature 6: Payouts (seller + admin)
- [x] Feature 7: Search (DB ILIKE, works without ES)

---

## PHASE 3 — Hardening ✅ IN PROGRESS

### Completed this session
- [x] Change password endpoint (PATCH /profile/password in auth-service)
- [x] Seller profile business fields update (PATCH /profile/me now updates seller_profiles)
- [x] Notification unread count badge — seller nav (useSellerNav hook, polls every 60s)
- [x] Notification unread count badge — buyer nav (useBuyerNav hook)
- [x] All buyer pages use shared buyerNav (dashboard, orders, watchlist, notifications, referral)
- [x] Buyer profile page created (/profile — was 404)
- [x] Change password page (/change-password — shared for buyer + seller)
- [x] Forgot password page (/forgot-password — was 404 from login page)
- [x] Notification API complete (GET /notifications, /unread-count, PATCH /read-all — all were missing)
- [x] Admin payouts response shape fixed ({rows, total} not {data, total})
- [x] Admin audit log response shape fixed + count query parameter bug fixed
- [x] SellerAppShell component (wraps AppShell with live nav badge — use to replace SELLER_NAV in seller pages)

### Remaining — Unblocked
- [ ] Update all 10 seller pages to use SellerAppShell (or useSellerNav directly) for live badge
  Files: analytics, kyc, listings/new, listings, listings/[id]/edit, notifications, orders, payouts, profile, settings
- [ ] Admin analytics page — verify response shapes for heatmap/demand-supply/scorecard
- [ ] Admin categories — verify create/toggle endpoints work
- [ ] Buyer order detail page — verify confirm delivery button + dispute link work correctly
- [ ] Test notifications end-to-end: action (e.g. order placed) → notification appears in list

### Remaining — Blocked
- [ ] S3 image upload (needs AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET in Railway inventory-service)
- [ ] Razorpay checkout (needs RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET in Railway payment-service)
- [ ] Production email (Resend) — needs domain purchase first
- [ ] Mobile app deploy (Expo) — not started

---

## Priority order for next session
1. Update 10 seller pages → SellerAppShell (live notification badge everywhere)
2. Verify buyer order detail confirm delivery + dispute flow end-to-end
3. Admin analytics/categories verification
4. End-to-end notification test
5. Add Razorpay test keys → checkout flow complete

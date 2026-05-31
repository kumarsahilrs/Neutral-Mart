# NirmalMandi — Work Log
**Running record of what's been built. Updated after every sprint.**

---

## Session: 2026-05-31 — Sprint Build (Heavy)

### What was discovered (previously assumed missing but already built)
- `auth-service/src/services/gstn.ts` — GSTN real API call already implemented (format check in dev, live API in prod)
- `auth-service/src/services/kyc.ts` — Penny drop via Karza API already implemented
- `auth-service/src/routes/auth.ts` — Full seller + buyer registration, OTP, JWT, refresh, logout
- `web/src/app/seller-register/page.tsx` — Complete 5-step seller registration UI (Phone/OTP, Business, Address, Bank, Documents) with handleComplete() wired
- `web/src/app/checkout/page.tsx` — Full Razorpay checkout: order placement → Razorpay modal → payment confirmation
- `web/src/app/listings/[id]/page.tsx` — Lot calculator + sector-specific fields + escrow info box already built
- `notification-service/src/services/fcm.ts` — Firebase Admin SDK FCM fully implemented
- `notification-service/src/services/whatsapp.ts` — Twilio WhatsApp with Hindi templates fully implemented
- `notification-service/src/queue/processor.ts` — Bull queue with retry, FCM + WhatsApp wired
- `analytics-service/src/routes/adminStats.ts` — `/admin/stats/dashboard`, `/gmv`, `/alerts`, `/recent-transactions` all implemented
- `admin/src/lib/api.ts` — statsApi wired to admin stats endpoints
- `admin/src/app/(dashboard)/page.tsx` — Dashboard fully wired to statsApi
- `order-service/src/services/negotiation.ts` — Full negotiation flow (initiate, counter, accept, reject, 5-round limit)
- `order-service/src/services/auction.ts` — Full WebSocket auction (bids, anti-sniping, outbid notifications)

### What was actually built this session

#### Backend
| File | What |
|---|---|
| `packages/auth-service/src/routes/auth.ts` | Added `POST /auth/verify-bank` + `POST /auth/kyc-upload-url` + dev mock upload endpoint |
| `packages/notification-service/src/queue/processor.ts` | Fixed `u.full_name` → `u.name` column bug |
| `packages/order-service/src/index.ts` | Registered `negotiationRouter` at `/negotiations`, initialized WebSocket auction server at `/ws/auction` |
| `infra/migrations/002_missing_columns.sql` | Added: `users.fcm_token`, `users.last_active_at`, seller address fields, `listings.ai_urgency_score`, `listings.view_count`, `listings.auction_ends_at`, `negotiation_offers` table, `auction_bids` table, `saved_searches` table, `ai_credits_log` table, `referrals` table, `buyer_addresses` table, dispute evidence columns |

#### Frontend — Web
| File | What |
|---|---|
| `web/src/lib/api.ts` | Added `negotiationsApi` (makeOffer, counter, accept, reject, getMyNegotiations), `aiApi.generateCaption`, `aiApi.generateHook` |
| `web/src/components/MarketingPanel.tsx` | NEW — Full AI marketing panel slide-up: language/tone/platform selectors, AI caption generation, editable output, copy + share, watermark notice, hashtag display |
| `web/src/components/NegotiationModal.tsx` | NEW — Make Offer modal: amount input, AI fair price suggestion via `/ai/pricing/fair-offer`, message field, negotiation thread display, accept/reject/withdraw actions |
| `web/src/app/listings/[id]/page.tsx` | Added: `showMarketing` state + MarketingPanel mount, `showNegotiation` state + NegotiationModal mount, "Generate Marketing Content" button, "Make Offer" button alongside Buy Now, MessageCircle + Megaphone icon imports |

#### Frontend — Mobile
| File | What |
|---|---|
| `mobile/app/marketing.tsx` | NEW — Full AI marketing screen: language/tone/platform selectors, AI caption generation (with demo fallback), Share API integration |

---

## Session: 2026-05-31 — Earlier (UI sprint fixes)

### Token system fixes
- `packages/mobile/src/theme/tokens.ts` — Fixed wrong colors (forest green → buyer blue #2563eb / seller green #16a34a). Added buyer/seller token sets.
- `packages/mobile/src/theme/ThemeContext.tsx` — Added panel switching + AsyncStorage persistence + `primaryColor` export
- `packages/mobile/src/components/DealCard.tsx` — Updated to use `primaryColor` from context
- `packages/mobile/src/components/AgentFab.tsx` — Updated to use `primaryColor` from context
- `packages/mobile/src/screens/HomeScreen.tsx` — Updated to use `primaryColor`
- `packages/mobile/src/screens/OtpScreen.tsx` — Updated to use `primaryColor`
- `packages/mobile/src/screens/SellerDashboardScreen.tsx` — Updated to use `primaryColor`
- `web/tailwind.config.js` — Full rewrite: nm-* token naming, darkMode: 'class', seller tokens added
- `web/src/app/globals.css` — Full rewrite: CSS custom properties (`--nm-*`), buyer/seller `data-panel` switching, dark mode, nm-* component classes, legacy aliases
- `web/src/lib/theme.tsx` — NEW: ThemeContext for web (buyer/seller panel + dark mode, localStorage persistence, `data-panel` attribute on `<html>`)
- `web/src/app/layout.tsx` — Added ThemeProvider wrapper
- `web/src/components/Header.tsx` — Updated all classes to nm-*, added dark mode toggle (Sun/Moon), added seller badge in green
- `admin/src/app/globals.css` — Added CSS custom property layer (`--nm-*`)
- `admin/src/components/ThemeToggle.tsx` — NEW: Dark mode toggle button with localStorage persistence
- `admin/src/app/layout.tsx` — Removed hardcoded `className="dark"`
- `ai-service/app/services/provider.py` — NEW: Claude/OpenAI dual-provider abstraction (auto-selects based on which key is set)
- `ai-service/app/routers/pricing.py` — Refactored to use provider abstraction
- `ai-service/app/routers/marketing.py` — Refactored to use provider abstraction
- `ai-service/app/routers/listing.py` — Refactored to use provider abstraction
- `.env.example` — Clarified AI key usage (set either ANTHROPIC or OPENAI, both work)

### Mobile Expo Router setup (all new files)
- `mobile/app/_layout.tsx` — Root layout with ThemeProvider, GestureHandlerRootView, SafeAreaProvider
- `mobile/app/index.tsx` — Auth guard → splash or buyer/seller tabs
- `mobile/app/splash.tsx` — Routes SplashScreen component
- `mobile/app/login.tsx` — Full OTP login screen, panel-aware (blue/green), language toggle
- `mobile/app/(buyer)/_layout.tsx` — Buyer tab navigator (Deals, Search, Orders, Profile)
- `mobile/app/(buyer)/index.tsx` — Buyer home: AI match banner, deal feed, sector pills, voice mic, "Market" button per card
- `mobile/app/(seller)/_layout.tsx` — Seller tab navigator (Dashboard, Listings, Add Stock, Orders, Profile)
- `mobile/app/(seller)/index.tsx` — Seller dashboard: stats grid, AI pricing alert, recent orders, quick actions
- `mobile/app/(seller)/listings.tsx` — Seller listings: AI urgency bar per listing, status badges
- `mobile/app/(seller)/new-listing.tsx` — 6-step AI listing flow: prompt → category → pricing → preview
- `mobile/app/(seller)/orders.tsx` — Seller orders with Mark as Shipped action
- `mobile/app/(seller)/profile.tsx` — Seller profile: stats strip, menu items, logout

---

## Build Status as of 2026-05-31

| Layer | Built | Total | % |
|---|---|---|---|
| Backend services | 10/10 scaffolded, ~7 functional | 10 | 70% |
| AI service | 4/4 routers + provider abstraction | 4 | 100% |
| Admin frontend | 13/14 screens | 14 | 93% |
| Web frontend | 18/20 screens | 20 | 90% |
| Mobile frontend | 12/18 screens | 18 | 67% |
| AI frontend UIs | 2/6 (Marketing Panel + Agent FAB) | 6 | 33% |
| Infrastructure | 9/12 items | 12 | 75% |
| **Overall** | | | **~75%** |

---

## Next Session
Run `start Sprint 4` for: AI Listing 6-step flow, order tracking timeline, flash sale strip, QA.

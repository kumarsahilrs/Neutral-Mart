-- ============================================================
-- NirmalMandi — Migration 002: Missing Columns & Tables
-- Adds all fields identified in sprint audit as missing from v1 schema
-- Run after 001_initial_schema.sql
-- ============================================================

-- ── users table additions ──────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fcm_token         VARCHAR(512),
  ADD COLUMN IF NOT EXISTS fcm_token_updated TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at    TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token) WHERE fcm_token IS NOT NULL;

-- ── seller_profiles additions ──────────────────────────────────────────────────

ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS address_line1           TEXT,
  ADD COLUMN IF NOT EXISTS address_line2           TEXT,
  ADD COLUMN IF NOT EXISTS city                    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state                   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pincode                 VARCHAR(10),
  ADD COLUMN IF NOT EXISTS warehouse_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS warehouse_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS warehouse_city          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS warehouse_state         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS warehouse_pincode       VARCHAR(10),
  ADD COLUMN IF NOT EXISTS gst_certificate_url     TEXT,
  ADD COLUMN IF NOT EXISTS pan_card_url            TEXT,
  ADD COLUMN IF NOT EXISTS address_proof_url       TEXT,
  ADD COLUMN IF NOT EXISTS sector_ids              UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_credits_balance      INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS razorpay_linked_account_id VARCHAR(100);

-- ── buyer_profiles additions ───────────────────────────────────────────────────

ALTER TABLE buyer_profiles
  ADD COLUMN IF NOT EXISTS tier2_verified_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tier3_verified_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tier2_documents        JSONB,
  ADD COLUMN IF NOT EXISTS watchlist_listing_ids  UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS saved_search_ids       UUID[] DEFAULT '{}';

-- ── listings additions ─────────────────────────────────────────────────────────

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS view_count             INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS watchlist_count        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiry_count          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_category_generated  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_urgency_score       DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_velocity_7d       DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_velocity_14d      DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_velocity_30d      DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flash_sale_ends_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auction_ends_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auction_reserve_price  DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS floor_price            DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS pricing_mode           VARCHAR(20) DEFAULT 'fixed' CHECK (pricing_mode IN ('fixed','best_offer','auction','flash_sale')),
  ADD COLUMN IF NOT EXISTS seller_city            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS seller_state           VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_listings_urgency_score ON listings(ai_urgency_score DESC) WHERE status IN ('live','active');
CREATE INDEX IF NOT EXISTS idx_listings_flash_sale ON listings(flash_sale_ends_at) WHERE flash_sale_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_auction_ends ON listings(auction_ends_at) WHERE auction_ends_at IS NOT NULL;

-- ── orders additions ───────────────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS freight_type           VARCHAR(30) DEFAULT 'self_ship' CHECK (freight_type IN ('self_ship','platform_logistics','buyer_pickup')),
  ADD COLUMN IF NOT EXISTS freight_amount         DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee           DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_on_fee             DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_address       JSONB,
  ADD COLUMN IF NOT EXISTS awb_number             VARCHAR(100),
  ADD COLUMN IF NOT EXISTS carrier_name           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tracking_url           TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_confirmed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escrow_released_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS razorpay_order_id      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS razorpay_payment_id    VARCHAR(100);

-- ── negotiation_offers table (new) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS negotiation_offers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  buyer_id        UUID NOT NULL REFERENCES buyer_profiles(id),
  seller_id       UUID NOT NULL REFERENCES seller_profiles(id),
  round           INTEGER NOT NULL DEFAULT 1 CHECK (round BETWEEN 1 AND 5),
  offered_by      VARCHAR(10) NOT NULL CHECK (offered_by IN ('buyer','seller')),
  amount          DECIMAL(14,2) NOT NULL,
  message         TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','rejected','countered','expired')),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_listing ON negotiation_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_buyer ON negotiation_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_status ON negotiation_offers(status);
CREATE TRIGGER negotiation_offers_updated_at
  BEFORE UPDATE ON negotiation_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── auction_bids table (new) ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auction_bids (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  buyer_id        UUID NOT NULL REFERENCES buyer_profiles(id),
  amount          DECIMAL(14,2) NOT NULL,
  is_winning      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_listing ON auction_bids(listing_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_auction_bids_buyer ON auction_bids(buyer_id);

-- ── saved_searches table (new) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_searches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id        UUID NOT NULL REFERENCES buyer_profiles(id),
  name            VARCHAR(255) NOT NULL,
  filters         JSONB NOT NULL DEFAULT '{}',
  push_enabled    BOOLEAN DEFAULT TRUE,
  last_notified   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_buyer ON saved_searches(buyer_id);

-- ── ai_credits_log table (new) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_credits_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  action_type     VARCHAR(50) NOT NULL,
  credits_used    INTEGER NOT NULL DEFAULT 1,
  credits_before  INTEGER NOT NULL,
  credits_after   INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_credits_user ON ai_credits_log(user_id, created_at DESC);

-- ── referrals table (new) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id       UUID NOT NULL REFERENCES users(id),
  referred_id       UUID NOT NULL REFERENCES users(id),
  referral_code     VARCHAR(20) NOT NULL,
  status            VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','converted','paid')),
  first_order_id    UUID,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- ── notifications table additions ─────────────────────────────────────────────

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_read    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS read_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deep_link  TEXT;

-- ── disputes table additions ───────────────────────────────────────────────────

ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS buyer_evidence   TEXT[],
  ADD COLUMN IF NOT EXISTS seller_evidence  TEXT[],
  ADD COLUMN IF NOT EXISTS admin_notes      TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution       TEXT,
  ADD COLUMN IF NOT EXISTS winning_side     VARCHAR(10) CHECK (winning_side IN ('buyer','seller','split'));

-- ── buyer_addresses table (new) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buyer_addresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id        UUID NOT NULL REFERENCES buyer_profiles(id),
  name            VARCHAR(255) NOT NULL,
  phone           VARCHAR(15) NOT NULL,
  address_line1   TEXT NOT NULL,
  address_line2   TEXT,
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(100) NOT NULL,
  pincode         VARCHAR(10) NOT NULL,
  is_default      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_addresses_buyer ON buyer_addresses(buyer_id);

-- ── Update existing data where possible ───────────────────────────────────────

-- Backfill seller city/state from seller_profiles into listings
UPDATE listings l
SET
  seller_city  = sp.city,
  seller_state = sp.state
FROM seller_profiles sp
WHERE l.seller_id = sp.id
  AND l.seller_city IS NULL;

-- Set default pricing_mode for existing listings
UPDATE listings
SET pricing_mode = 'fixed'
WHERE pricing_mode IS NULL;

-- End of migration 002

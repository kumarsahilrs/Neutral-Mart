-- ============================================================
-- NirmalMandi — Migration 008: Sprint 16 Production Hardening
-- DPDP consent, BNPL, special logistics types, DocuSign, TCS
-- ============================================================

-- ── DPDP Act 2023 — Consent Records ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consent_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose         VARCHAR(50) NOT NULL,
  -- Purposes: marketing, analytics, third_party_sharing, profiling, transactional
  granted         BOOLEAN NOT NULL,
  version         VARCHAR(20) NOT NULL DEFAULT '1.0',  -- policy version
  ip_address      INET,
  user_agent      TEXT,
  granted_at      TIMESTAMPTZ,
  withdrawn_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_consent_user    ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_purpose ON consent_records(purpose);

-- Minimal required consent flag on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS dpdp_consent_version VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dpdp_consent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS esignature_url        TEXT,        -- DocuSign envelope PDF URL
  ADD COLUMN IF NOT EXISTS esignature_at         TIMESTAMPTZ;

-- ── BNPL / payment method on orders ──────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'razorpay'
    CHECK (payment_method IN ('razorpay','bnpl','upi','netbanking','wallet','cod','credit')),
  ADD COLUMN IF NOT EXISTS delivery_type  VARCHAR(30) DEFAULT 'standard'
    CHECK (delivery_type IN ('standard','cold_chain','car_carrier','digital','self_pickup'));

-- ── TCS monthly aggregation cache ────────────────────────────────────────────
-- Used for GSTR-8 filing. Populated by scheduler on 1st of each month.

CREATE TABLE IF NOT EXISTS tcs_monthly_summary (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month           DATE NOT NULL UNIQUE,         -- e.g. 2026-06-01
  total_taxable   DECIMAL(18,2) NOT NULL DEFAULT 0,
  tcs_collected   DECIMAL(18,2) NOT NULL DEFAULT 0,
  seller_count    INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  gstr8_filed     BOOLEAN DEFAULT FALSE,
  gstr8_filed_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── DocuSign: seller signing status ──────────────────────────────────────────
-- seller_profiles already has esignature fields via users table above.
-- Add envelope tracking to seller_profiles for status polling.

ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS docusign_envelope_id  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS docusign_status       VARCHAR(30) DEFAULT 'not_sent'
    CHECK (docusign_status IN ('not_sent','sent','delivered','signed','declined','voided'));

-- ── shipments: add UNIQUE on order_id (required for ON CONFLICT upsert in logistics-service) ──
ALTER TABLE shipments
  ADD CONSTRAINT shipments_order_id_unique UNIQUE (order_id);

-- ── Special logistics metadata on shipments ───────────────────────────────────

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS delivery_type     VARCHAR(30) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS temperature_min   SMALLINT,    -- cold chain: °C
  ADD COLUMN IF NOT EXISTS temperature_max   SMALLINT,
  ADD COLUMN IF NOT EXISTS vehicle_count     SMALLINT,    -- car carrier: number of vehicles
  ADD COLUMN IF NOT EXISTS digital_keys      TEXT[],      -- digital delivery: license keys
  ADD COLUMN IF NOT EXISTS digital_fulfilled BOOLEAN DEFAULT FALSE;

-- ============================================================
-- NirmalMandi — Migration 004: Dispute Schema Fix
-- Adds missing columns to disputes table + creates dispute_evidence
-- and dispute_messages tables referenced by dispute-service code.
-- Run after 003_watchlist_and_compare.sql
-- ============================================================

-- ── disputes: add missing columns ────────────────────────────────────────────

ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS buyer_id         UUID REFERENCES buyer_profiles(id),
  ADD COLUMN IF NOT EXISTS seller_id        UUID REFERENCES seller_profiles(id),
  ADD COLUMN IF NOT EXISTS outcome          VARCHAR(30) CHECK (outcome IN ('release_to_seller', 'refund_buyer', 'split', 'pending')),
  ADD COLUMN IF NOT EXISTS resolution_note  TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to      UUID REFERENCES users(id);

-- Back-fill buyer_id / seller_id from the linked order for any existing rows
UPDATE disputes d
SET
  buyer_id  = o.buyer_id,
  seller_id = o.seller_id
FROM orders o
WHERE d.order_id = o.id
  AND d.buyer_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_disputes_buyer  ON disputes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_seller ON disputes(seller_id);

-- ── dispute_evidence ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dispute_evidence (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id   UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES users(id),
  file_url     TEXT NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  file_type    VARCHAR(100) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);

-- ── dispute_messages ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dispute_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id  UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);

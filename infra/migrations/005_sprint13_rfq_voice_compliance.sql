-- ============================================================
-- NirmalMandi — Migration 005: Sprint 13
-- RFQ system, voice_messages, compliance_rules seed
-- ============================================================

-- ── RFQs (Request for Quotation) ─────────────────────────────────────────────

CREATE TABLE rfqs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id        UUID NOT NULL REFERENCES buyer_profiles(id),
  seller_id       UUID NOT NULL REFERENCES seller_profiles(id),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  target_price    DECIMAL(14,2),             -- buyer's desired unit price
  message         TEXT,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','quoted','accepted','rejected','expired','ordered')),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER rfqs_updated_at BEFORE UPDATE ON rfqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_rfqs_buyer  ON rfqs(buyer_id);
CREATE INDEX idx_rfqs_seller ON rfqs(seller_id);
CREATE INDEX idx_rfqs_listing ON rfqs(listing_id);
CREATE INDEX idx_rfqs_status  ON rfqs(status);

-- ── RFQ Responses (seller quotes) ────────────────────────────────────────────

CREATE TABLE rfq_responses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id          UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  quoted_price    DECIMAL(14,2) NOT NULL,
  min_quantity    INTEGER,
  message         TEXT,
  valid_until     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfq_responses_rfq ON rfq_responses(rfq_id);

-- ── Voice Messages ────────────────────────────────────────────────────────────
-- Attached to either an order or a dispute thread.

CREATE TABLE voice_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id       UUID NOT NULL REFERENCES users(id),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  dispute_id      UUID REFERENCES disputes(id) ON DELETE CASCADE,
  audio_url       TEXT NOT NULL,
  duration_sec    SMALLINT,
  transcription   TEXT,                       -- Whisper output
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT voice_messages_context CHECK (
    (order_id IS NOT NULL AND dispute_id IS NULL)
    OR (order_id IS NULL AND dispute_id IS NOT NULL)
  )
);

CREATE INDEX idx_voice_messages_order   ON voice_messages(order_id);
CREATE INDEX idx_voice_messages_dispute ON voice_messages(dispute_id);

-- ── orders: add rfq_id + po_url ──────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS rfq_id UUID REFERENCES rfqs(id),
  ADD COLUMN IF NOT EXISTS po_url TEXT;

-- ── Sector compliance rules ───────────────────────────────────────────────────
-- compliance_rules schema:
-- { "required_documents": ["drug_license", "gst"], "check_before": "checkout" }

UPDATE sectors
SET compliance_rules = '{
  "required_documents": ["drug_license"],
  "document_labels": {
    "drug_license": "Drug License (Form 20/21)"
  },
  "check_before": "checkout",
  "warning_message": "Pharma purchases require a valid Drug License under the Drugs & Cosmetics Act 1940."
}'::jsonb
WHERE slug = 'pharma';

UPDATE sectors
SET compliance_rules = '{
  "required_documents": ["rto_certificate"],
  "document_labels": {
    "rto_certificate": "RC Book / RTO Certificate"
  },
  "check_before": "rfq",
  "warning_message": "Automobile purchases may require valid RTO documentation for resale."
}'::jsonb
WHERE slug = 'automobiles';

-- Add compliance_documents column to buyer_profiles for storing uploaded doc URLs
ALTER TABLE buyer_profiles
  ADD COLUMN IF NOT EXISTS compliance_documents JSONB DEFAULT '{}';
-- Example: { "drug_license": "https://cdn.../doc.pdf", "rto_certificate": null }

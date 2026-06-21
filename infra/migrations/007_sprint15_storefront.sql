-- ============================================================
-- NirmalMandi — Migration 007: Sprint 15 Reseller Storefront
-- ============================================================

-- ── seller_profiles: storefront fields ───────────────────────────────────────

ALTER TABLE seller_profiles
  ADD COLUMN IF NOT EXISTS seller_slug        VARCHAR(80) UNIQUE,
  ADD COLUMN IF NOT EXISTS storefront_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS storefront_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS storefront_tagline VARCHAR(200),
  ADD COLUMN IF NOT EXISTS reseller_margin_pct DECIMAL(5,2) DEFAULT 0
    CHECK (reseller_margin_pct >= 0 AND reseller_margin_pct <= 100);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_slug ON seller_profiles(seller_slug)
  WHERE seller_slug IS NOT NULL;

-- Auto-generate slug from existing business_names where slug is null
UPDATE seller_profiles
SET seller_slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || SUBSTRING(id::text, 1, 6)
WHERE seller_slug IS NULL AND business_name IS NOT NULL;

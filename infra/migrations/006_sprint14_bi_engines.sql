-- ============================================================
-- NirmalMandi — Migration 006: Sprint 14 BI Engines 5-8
-- buyer_events event stream + board_reports cache
-- ============================================================

-- ── Buyer behavior event stream ───────────────────────────────────────────────
-- Primary store is Postgres; dual-write to ClickHouse via CLICKHOUSE_URL if set.

CREATE TABLE IF NOT EXISTS buyer_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type      VARCHAR(50) NOT NULL,
  -- Common identity fields (anonymous or authenticated)
  user_id         UUID REFERENCES users(id),
  session_id      VARCHAR(64),
  device_type     VARCHAR(20),
  -- Context
  listing_id      UUID REFERENCES listings(id),
  sector_id       UUID REFERENCES sectors(id),
  search_query    TEXT,
  -- Geo
  state           VARCHAR(100),
  city            VARCHAR(100),
  -- Funnel / value
  price_seen      DECIMAL(14,2),
  quantity        INTEGER,
  -- Raw payload for future analysis
  properties      JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Partition-ready index strategy (daily partitioning would come in production)
CREATE INDEX IF NOT EXISTS idx_buyer_events_type       ON buyer_events(event_type);
CREATE INDEX IF NOT EXISTS idx_buyer_events_user       ON buyer_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyer_events_session    ON buyer_events(session_id);
CREATE INDEX IF NOT EXISTS idx_buyer_events_listing    ON buyer_events(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyer_events_created    ON buyer_events(created_at);
CREATE INDEX IF NOT EXISTS idx_buyer_events_sector     ON buyer_events(sector_id) WHERE sector_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyer_events_state      ON buyer_events(state) WHERE state IS NOT NULL;

-- ── Board reports cache ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS board_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period          VARCHAR(20) NOT NULL,   -- e.g. '2026-Q2', '2026-06'
  report_url      TEXT,
  generated_by    UUID REFERENCES users(id),
  kpi_snapshot    JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_board_reports_period ON board_reports(period);

-- ── listings: add view_count for CVR engine ───────────────────────────────────
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

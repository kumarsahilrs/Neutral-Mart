-- ============================================================
-- NirmalMandi — Migration 009: Google OAuth support
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email      VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS google_id  VARCHAR(100) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email)     WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

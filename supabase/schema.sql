-- ==============================================================================
-- Small Web Reader: Anonymous Co-Subscription Matrix Database Schema
-- Compatible with Supabase PostgreSQL & Standard PostgreSQL
-- Zero Accounts. Zero Persistent User Identifiers. Zero PII.
-- ==============================================================================

-- 1. Feeds Table: Stores known blogs and their global popularity counters
CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  normalized_url TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  site_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Indie Web',
  popularity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feeds_normalized_url ON feeds(normalized_url);
CREATE INDEX IF NOT EXISTS idx_feeds_popularity ON feeds(popularity DESC);

-- 2. Co-Subscriptions Table: Stores pairwise co-occurrence edges (Feed A, Feed B, weight)
-- Canonical ordering constraint (feed_a < feed_b) prevents duplicate permutations
CREATE TABLE IF NOT EXISTS co_subscriptions (
  feed_a TEXT NOT NULL,
  feed_b TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (feed_a, feed_b),
  CONSTRAINT chk_canonical_order CHECK (feed_a < feed_b)
);

CREATE INDEX IF NOT EXISTS idx_cosub_feed_a ON co_subscriptions(feed_a);
CREATE INDEX IF NOT EXISTS idx_cosub_feed_b ON co_subscriptions(feed_b);
CREATE INDEX IF NOT EXISTS idx_cosub_weight ON co_subscriptions(weight DESC);

-- 3. Abuse Resistance: Salted SHA-256 IP Hash Rate Limit Bucket with 24h Auto-Expiry
CREATE TABLE IF NOT EXISTS submission_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  submission_count INTEGER DEFAULT 1,
  last_submitted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON submission_rate_limits(expires_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_rate_limits ENABLE ROW LEVEL SECURITY;

-- Anonymous public read access for discovery
CREATE POLICY "Public feeds read" ON feeds FOR SELECT USING (true);
CREATE POLICY "Public cosub read" ON co_subscriptions FOR SELECT USING (true);

-- Submission insertion allowed via service role or controlled API route
CREATE POLICY "Public feeds insert" ON feeds FOR INSERT WITH CHECK (true);
CREATE POLICY "Public feeds update" ON feeds FOR UPDATE USING (true);
CREATE POLICY "Public cosub insert" ON co_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public cosub update" ON co_subscriptions FOR UPDATE USING (true);

-- Content Planner tables for social media content scheduling and publishing

-- ============================================================
-- TABLE: content_calendar
-- Purpose: Store scheduled social media posts with metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content details
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  image_url TEXT,

  -- Publishing settings
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'both')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),

  -- Publishing metadata
  post_id TEXT,
  publish_error TEXT,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMP WITH TIME ZONE,

  -- AI visual generation
  visual_type TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- Users can view their own content calendar entries
CREATE POLICY "Users can view own content" ON content_calendar
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own content
CREATE POLICY "Users can insert own content" ON content_calendar
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own content
CREATE POLICY "Users can update own content" ON content_calendar
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own content
CREATE POLICY "Users can delete own content" ON content_calendar
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_user_id ON content_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_for ON content_calendar(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_platform ON content_calendar(platform);

-- ============================================================
-- TABLE: social_accounts
-- Purpose: Store connected social media accounts (Meta OAuth tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Platform identification
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,

  -- OAuth tokens (encrypted at rest via Supabase)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Account status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint per user+platform+account
  UNIQUE(user_id, platform, account_id)
);

-- Enable Row Level Security
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own connected accounts
CREATE POLICY "Users can view own accounts" ON social_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own accounts" ON social_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts" ON social_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete own accounts" ON social_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(is_active);

-- ============================================================
-- TABLE: content_analytics
-- Purpose: Store performance metrics for published posts
-- ============================================================
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_calendar_id UUID NOT NULL REFERENCES content_calendar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),

  -- Metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  video_views INTEGER,

  -- Date of metrics
  date DATE NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique per content+platform+date
  UNIQUE(content_calendar_id, platform, date)
);

-- Enable Row Level Security
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view analytics for their own content
CREATE POLICY "Users can view own analytics" ON content_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = content_analytics.content_calendar_id
      AND content_calendar.user_id = auth.uid()
    )
  );

-- Only service role can insert/update analytics (via API)
CREATE POLICY "Service role can manage analytics" ON content_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_analytics_content_id ON content_analytics(content_calendar_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_platform ON content_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_content_analytics_date ON content_analytics(date);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update updated_at timestamp for content_calendar
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for social_accounts
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for content_analytics
CREATE TRIGGER update_content_analytics_updated_at
  BEFORE UPDATE ON content_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: oauth_states
-- Purpose: Track OAuth state tokens for Meta OAuth flow (CSRF protection)
-- ============================================================
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Enable Row Level Security
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Users can manage their own OAuth states
CREATE POLICY "Users can manage own OAuth states" ON oauth_states
  FOR ALL USING (auth.uid() = user_id);

-- Index for quick lookup by state
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_created ON oauth_states(user_id, created_at DESC);

-- Clean up expired states (can be run via cron or on-demand)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMENTS
-- ============================================================
COMMENT ON TABLE oauth_states IS 'OAuth state tokens for Meta authentication flow with 10-minute expiration';

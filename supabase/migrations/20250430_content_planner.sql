-- Content Planner Database Migration
-- Run this in Supabase SQL Editor

-- ========================================
-- Table: content_calendar
-- ========================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,

  -- Content
  content_type TEXT CHECK (content_type IN (
    'listing', 'market_update', 'testimonial', 'buyers_guide',
    'open_house', 'community', 'tip', 'promo', 'personal_brand', 'recurring'
  )),
  platform TEXT CHECK (platform IN ('facebook', 'instagram', 'both')),
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',

  -- Visual (generated via AI template)
  template_type TEXT DEFAULT 'professional',
  template_prompt TEXT,
  generated_image_url TEXT,
  template_job_id TEXT,

  -- Scheduling
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled', 'draft'))
    DEFAULT 'scheduled',

  -- Publishing
  published_url TEXT,
  publish_error TEXT,
  publish_attempts INTEGER DEFAULT 0,

  -- Recurring posts
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB DEFAULT '{}',

  -- Metadata
  source TEXT CHECK (source IN ('wizard', 'manual', 'recurring')) DEFAULT 'wizard',
  ai_generated BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_user_date
  ON content_calendar(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status
  ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_recurring
  ON content_calendar(is_recurring);

-- Row Level Security
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own content"
  ON content_calendar FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content"
  ON content_calendar FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content"
  ON content_calendar FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content"
  ON content_calendar FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- Table: social_accounts
-- ========================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('facebook', 'instagram')) NOT NULL,
  account_name TEXT NOT NULL,
  page_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'page',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Permissions granted
  permissions JSONB DEFAULT '{}',

  UNIQUE(user_id, platform),
  UNIQUE(page_id, platform),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_user
  ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_page
  ON social_accounts(page_id);

-- Row Level Security
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own social accounts"
  ON social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts"
  ON social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts"
  ON social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts"
  ON social_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- Table: content_analytics
-- ========================================
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metrics JSONB DEFAULT '{}',
  last_synced TIMESTAMPTZ,

  UNIQUE(content_id, platform)
);

-- Row Level Security
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

-- Policies (inherit from content_calendar via cascade)
CREATE POLICY "Users can view their own analytics"
  ON content_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_calendar cc
      WHERE cc.id = content_id
      AND cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own analytics"
  ON content_analytics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_calendar cc
      WHERE cc.id = content_id
      AND cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own analytics"
  ON content_analytics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM content_calendar cc
      WHERE cc.id = content_id
      AND cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own analytics"
  ON content_analytics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM content_calendar cc
      WHERE cc.id = content_id
      AND cc.user_id = auth.uid()
    )
  );

-- ========================================
-- Functions & Triggers
-- ========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Helper Function: Expand Recurring Posts
-- ========================================
CREATE OR REPLACE FUNCTION expand_recurring_posts()
RETURNS void AS $$
DECLARE
  rec RECORD;
  end_date TIMESTAMPTZ;
  next_date TIMESTAMPTZ;
  i INTEGER;
BEGIN
  -- Find all recurring posts that need expansion
  FOR rec IN
    SELECT * FROM content_calendar
    WHERE is_recurring = true
    AND status = 'scheduled'
    AND (recurrence_pattern->>'end_after') IS NULL
  LOOP
    -- Get recurrence pattern
    end_date := NULL;
    next_date := rec.scheduled_date + INTERVAL '1 day';

    -- Generate next occurrences based on frequency
    IF rec.recurrence_pattern->>'frequency' = 'daily' THEN
      -- Add daily posts
      FOR i IN 1..30 LOOP  -- Generate next 30 days
        next_date := rec.scheduled_date + (i * INTERVAL '1 day');
        IF NOT EXISTS (
          SELECT 1 FROM content_calendar
          WHERE user_id = rec.user_id
          AND title = rec.title
          AND scheduled_date = next_date
        ) THEN
          INSERT INTO content_calendar (
            user_id, title, content_type, platform, caption,
            hashtags, template_type, template_prompt,
            scheduled_date, status, is_recurring, recurrence_pattern,
            source, ai_generated
          ) VALUES (
            rec.user_id, rec.title, rec.content_type, rec.platform, rec.caption,
            rec.hashtags, rec.template_type, rec.template_prompt,
            next_date, 'scheduled', true, rec.recurrence_pattern,
            'recurring', true
          );
        END IF;
      END LOOP;
    ELSIF rec.recurrence_pattern->>'frequency' = 'weekly' THEN
      -- Add weekly posts
      FOR i IN 1..12 LOOP  -- Generate next 12 weeks
        next_date := rec.scheduled_date + (i * INTERVAL '1 week');
        IF NOT EXISTS (
          SELECT 1 FROM content_calendar
          WHERE user_id = rec.user_id
          AND title = rec.title
          AND scheduled_date = next_date
        ) THEN
          INSERT INTO content_calendar (
            user_id, title, content_type, platform, caption,
            hashtags, template_type, template_prompt,
            scheduled_date, status, is_recurring, recurrence_pattern,
            source, ai_generated
          ) VALUES (
            rec.user_id, rec.title, rec.content_type, rec.platform, rec.caption,
            rec.hashtags, rec.template_type, rec.template_prompt,
            next_date, 'scheduled', true, rec.recurrence_pattern,
            'recurring', true
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute权限
GRANT EXECUTE ON FUNCTION expand_recurring_posts() TO authenticated;

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE content_calendar IS 'Content calendar for social media posts - supports scheduling, recurring, and AI-generated content';
COMMENT ON TABLE social_accounts IS 'Connected Facebook/Instagram business accounts for auto-publishing';
COMMENT ON TABLE content_analytics IS 'Cached social media analytics for published posts';

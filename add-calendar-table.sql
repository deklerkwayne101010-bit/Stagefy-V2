-- Add content_calendar table migration
-- Run this in Supabase SQL Editor to add the calendar functionality

-- Add the enum for calendar status
CREATE TYPE calendar_status AS ENUM ('scheduled', 'published', 'failed', 'cancelled', 'draft');

-- Create the content_calendar table
CREATE TABLE content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL,
  platform text NOT NULL,
  caption text NOT NULL,
  hashtags text[] DEFAULT '{}',
  template_type text,
  template_prompt text,
  generated_image_url text,
  scheduled_date timestamptz NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb,
  status calendar_status DEFAULT 'scheduled',
  published_url text,
  publish_error text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_content_calendar_user_id ON content_calendar(user_id);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);
CREATE INDEX idx_content_calendar_scheduled_date ON content_calendar(scheduled_date);
CREATE INDEX idx_content_calendar_platform ON content_calendar(platform);

-- Enable RLS
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Users can access own calendar" ON content_calendar
  FOR ALL USING (auth.uid() = user_id);</content>
<parameter name="filePath">C:\tmp\Stagefy-V2\add-calendar-table.sql
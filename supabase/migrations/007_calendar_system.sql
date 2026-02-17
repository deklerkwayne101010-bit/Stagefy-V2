-- Calendar System Migration
-- Phase 1: Core calendar functionality with events, reminders, and settings

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'appointment' CHECK (event_type IN ('appointment', 'meeting', 'viewing', 'call', 'reminder')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  -- Optional FK references to CRM tables (will work if tables exist, otherwise nullable)
  contact_id UUID,
  listing_id UUID,
  task_id UUID,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  recurrence_rule TEXT, -- RRULE for recurring events
  reminder_minutes INTEGER DEFAULT 15 CHECK (reminder_minutes >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_reminders table
CREATE TABLE IF NOT EXISTS event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'email' CHECK (reminder_type IN ('email', 'push', 'sms')),
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calendar_settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_view TEXT DEFAULT 'month' CHECK (default_view IN ('month', 'week', 'day', 'agenda')),
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '17:00',
  timezone TEXT DEFAULT 'Africa/Johannesburg',
  reminder_defaults JSONB DEFAULT '{"email": true, "push": true, "minutes": 15}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can view their own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for event_reminders
CREATE POLICY "Users can view reminders for their events" ON event_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = event_reminders.event_id
      AND calendar_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage reminders for their events" ON event_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = event_reminders.event_id
      AND calendar_events.user_id = auth.uid()
    )
  );

-- RLS Policies for calendar_settings
CREATE POLICY "Users can view their own calendar settings" ON calendar_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar settings" ON calendar_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_reminder_time ON event_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_event_reminders_status ON event_reminders(status);
CREATE INDEX IF NOT EXISTS idx_calendar_settings_user_id ON calendar_settings(user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE calendar_events IS 'Calendar events and appointments with CRM integration';
COMMENT ON TABLE event_reminders IS 'Reminder notifications for calendar events';
COMMENT ON TABLE calendar_settings IS 'User preferences for calendar display and behavior';
COMMENT ON COLUMN calendar_events.event_type IS 'Type of event: appointment, meeting, viewing, call, reminder';
COMMENT ON COLUMN calendar_events.status IS 'Event status: scheduled, confirmed, completed, cancelled';
COMMENT ON COLUMN calendar_events.priority IS 'Event priority: low, normal, high, urgent';
COMMENT ON COLUMN calendar_events.recurrence_rule IS 'RRULE string for recurring events';
COMMENT ON COLUMN event_reminders.reminder_type IS 'Type of reminder: email, push, sms';
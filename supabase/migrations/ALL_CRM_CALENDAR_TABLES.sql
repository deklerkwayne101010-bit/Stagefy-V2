-- ============================================
-- COMPLETE CRM AND CALENDAR MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: Base CRM Tables (from supabase-setup.sql)
-- ============================================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger for users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create crm_contacts table
CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  type text DEFAULT 'lead' CHECK (type IN ('lead', 'prospect', 'buyer', 'seller', 'tenant', 'landlord')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost')),
  source text,
  address text,
  city text,
  notes text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create crm_listings table
CREATE TABLE IF NOT EXISTS crm_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  address text NOT NULL,
  city text,
  price decimal(12, 2),
  bedrooms integer,
  bathrooms integer,
  sqft decimal(10, 2),
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'withdrawn', 'expired')),
  listing_type text DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent', 'lease')),
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on base tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own contacts" ON crm_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own contacts" ON crm_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own listings" ON crm_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own listings" ON crm_listings FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PART 2: CRM Enhancements (migration 003)
-- ============================================

-- Add new columns to crm_contacts
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS preferred_locations text[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS budget_min decimal(15, 2);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS budget_max decimal(15, 2);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS property_types_interest text[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS bedrooms_required integer;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS bathrooms_required integer;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS features_required text[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS timeline varchar(50);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS source varchar(50);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS last_contacted_at timestamp with time zone;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS preferred_contact_method varchar(20);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS rating integer DEFAULT 3 CHECK (rating >= 1 AND rating <= 5);

-- Add new columns to crm_listings
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS property_type varchar(50);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS land_size decimal(12, 2);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS year_built integer;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS levies decimal(12, 2);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS rates decimal(12, 2);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS parking integer;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS features text[];
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS listing_type varchar(50);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS mandate_expiry date;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS virtual_tour_url text;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS floorplan_url text;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS open_house_dates date[];
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS inquiry_count integer DEFAULT 0;

-- Create crm_tasks table
CREATE TABLE IF NOT EXISTS crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES crm_listings(id) ON DELETE SET NULL,
  title varchar(255) NOT NULL,
  description text,
  task_type varchar(50) DEFAULT 'follow-up',
  priority varchar(20) DEFAULT 'medium',
  status varchar(20) DEFAULT 'pending',
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  reminder timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON crm_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON crm_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON crm_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON crm_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_user_id ON crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON crm_tasks(due_date);

-- Create crm_activities table
CREATE TABLE IF NOT EXISTS crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES crm_listings(id) ON DELETE SET NULL,
  activity_type varchar(50) NOT NULL,
  subject varchar(255),
  content text,
  direction varchar(20) DEFAULT 'outbound',
  duration integer,
  outcome varchar(255),
  next_action varchar(255),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities" ON crm_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities" ON crm_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON crm_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON crm_activities FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crm_activities_user_id ON crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_listing_id ON crm_activities(listing_id);

-- ============================================
-- PART 3: Calendar System (migration 007)
-- ============================================

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'appointment' CHECK (event_type IN ('appointment', 'meeting', 'viewing', 'call', 'reminder')),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  all_day boolean DEFAULT false,
  location text,
  contact_id uuid,
  listing_id uuid,
  task_id uuid,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  recurrence_rule text,
  reminder_minutes integer DEFAULT 15 CHECK (reminder_minutes >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create event_reminders table
CREATE TABLE IF NOT EXISTS event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT 'email' CHECK (reminder_type IN ('email', 'push', 'sms')),
  reminder_time timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamp with time zone DEFAULT now()
);

-- Create calendar_settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_view text DEFAULT 'month' CHECK (default_view IN ('month', 'week', 'day', 'agenda')),
  working_hours_start time DEFAULT '09:00',
  working_hours_end time DEFAULT '17:00',
  timezone text DEFAULT 'Africa/Johannesburg',
  reminder_defaults jsonb DEFAULT '{"email": true, "push": true, "minutes": 15}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can view their own calendar events" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar events" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar events" ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar events" ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for event_reminders
CREATE POLICY "Users can view reminders for their events" ON event_reminders FOR SELECT USING (
  EXISTS (SELECT 1 FROM calendar_events WHERE calendar_events.id = event_reminders.event_id AND calendar_events.user_id = auth.uid())
);
CREATE POLICY "Users can manage reminders for their events" ON event_reminders FOR ALL USING (
  EXISTS (SELECT 1 FROM calendar_events WHERE calendar_events.id = event_reminders.event_id AND calendar_events.user_id = auth.uid())
);

-- RLS Policies for calendar_settings
CREATE POLICY "Users can view their own calendar settings" ON calendar_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own calendar settings" ON calendar_settings FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_reminder_time ON event_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_calendar_settings_user_id ON calendar_settings(user_id);

-- ============================================
-- PART 4: Notifications (migration 008)
-- ============================================

CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON user_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON user_notifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  job_completed boolean DEFAULT true,
  payment_updates boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  crm_reminders boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COMPLETE!
-- All tables for CRM and Calendar are now created
-- ============================================

-- CRM Enhancements Migration
-- Phase 0: Quick Wins
-- Adds enhanced contact fields, enhanced listing fields, tasks, and activities

-- =============================================
-- ENHANCED CONTACTS TABLE
-- =============================================

-- Add new columns to crm_contacts table
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS preferred_locations TEXT[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS budget_min DECIMAL(15, 2);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS budget_max DECIMAL(15, 2);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS property_types_interest TEXT[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS bedrooms_required INTEGER;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS bathrooms_required INTEGER;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS features_required TEXT[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS timeline VARCHAR(50);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5);

-- =============================================
-- ENHANCED LISTINGS TABLE
-- =============================================

-- Add new columns to crm_listings table
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS property_type VARCHAR(50);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS land_size DECIMAL(12, 2);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS levies DECIMAL(12, 2);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS rates DECIMAL(12, 2);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS parking INTEGER;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(50);
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS mandate_expiry DATE;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS floorplan_url TEXT;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS open_house_dates DATE[];
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 0;

-- =============================================
-- TASKS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES crm_listings(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) DEFAULT 'follow-up',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for tasks
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks" 
  ON crm_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
  ON crm_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
  ON crm_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
  ON crm_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for task queries
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user_id ON crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON crm_tasks(due_date);

-- =============================================
-- ACTIVITIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES crm_listings(id) ON DELETE SET NULL,
  
  activity_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  direction VARCHAR(20) DEFAULT 'outbound',
  duration INTEGER,  -- minutes for calls
  outcome VARCHAR(255),
  next_action VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for activities
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view their own activities" 
  ON crm_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" 
  ON crm_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" 
  ON crm_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" 
  ON crm_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_id ON crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_listing_id ON crm_activities(listing_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON crm_activities(created_at DESC);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================

-- Trigger to update updated_at on tasks
DROP TRIGGER IF EXISTS update_crm_tasks_updated_at ON crm_tasks;
CREATE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON crm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- View for upcoming tasks
CREATE OR REPLACE VIEW crm_upcoming_tasks AS
SELECT 
  t.*,
  c.name as contact_name,
  c.email as contact_email,
  l.address as listing_address
FROM crm_tasks t
LEFT JOIN crm_contacts c ON t.contact_id = c.id
LEFT JOIN crm_listings l ON t.listing_id = l.id
WHERE t.status = 'pending'
  AND (t.due_date IS NULL OR t.due_date > NOW())
ORDER BY t.priority DESC, t.due_date ASC NULLS LAST;

-- View for recent activities
CREATE OR REPLACE VIEW crm_recent_activities AS
SELECT 
  a.*,
  c.name as contact_name,
  c.type as contact_type,
  l.address as listing_address
FROM crm_activities a
LEFT JOIN crm_contacts c ON a.contact_id = c.id
LEFT JOIN crm_listings l ON a.listing_id = l.id
ORDER BY a.created_at DESC
LIMIT 100;

-- View for contact-listing matches
CREATE OR REPLACE VIEW crm_buyer_listing_matches AS
SELECT 
  c.id as contact_id,
  c.name as contact_name,
  c.email as contact_email,
  c.budget_min,
  c.budget_max,
  c.preferred_locations,
  c.rating,
  l.id as listing_id,
  l.address,
  l.city,
  l.price,
  l.bedrooms,
  l.bathrooms,
  l.features,
  l.status as listing_status
FROM crm_contacts c
CROSS JOIN crm_listings l
WHERE c.type = 'buyer'
  AND l.status = 'active'
  AND (
    (c.budget_min IS NULL OR l.price >= c.budget_min)
    AND (c.budget_max IS NULL OR l.price <= c.budget_max)
  )
ORDER BY c.rating DESC NULLS LAST;

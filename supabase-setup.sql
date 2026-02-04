-- Stagefy Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- This script is idempotent - safe to run multiple times

-- ============================================
-- CLEANUP (Optional - run if you need to reset)
-- ============================================
-- Uncomment these lines if you want to start fresh:
-- DROP TABLE IF EXISTS admin_audit_log, notifications, templates, media_items, crm_listings, crm_contacts, ai_jobs, projects, credit_transactions, subscriptions, users CASCADE;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP FUNCTION IF EXISTS update_modified_column();
-- DROP TYPE IF EXISTS user_role, subscription_tier, credit_transaction_type, subscription_status, job_status, project_type, ai_service, contact_type, contact_status, listing_status, media_type, template_type, notification_type, use_case CASCADE;

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('agent', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'usage', 'refund', 'subscription');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'paused', 'past_due');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_type AS ENUM ('photo_edit', 'video', 'template');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_service AS ENUM ('replicate', 'qwen', 'nano_banana');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contact_type AS ENUM ('buyer', 'seller', 'investor', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contact_status AS ENUM ('lead', 'active', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'off_market');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('image', 'video', 'template');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE template_type AS ENUM ('listing_promo', 'instagram_reel', 'open_house', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('credit_low', 'job_completed', 'payment_success', 'payment_failed', 'subscription_renewal', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE use_case AS ENUM ('photos', 'video', 'templates', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Users table (links to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  brokerage text,
  market text,
  use_case use_case DEFAULT 'all',
  role user_role DEFAULT 'agent',
  credits integer DEFAULT 50,
  subscription_tier subscription_tier DEFAULT 'free',
  free_usage_used integer DEFAULT 0,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  status subscription_status NOT NULL,
  payfast_subscription_id text UNIQUE,
  payfast_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  credits_remaining integer,
  monthly_credits integer NOT NULL,
  price_paid numeric(10,2),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type credit_transaction_type NOT NULL,
  description text,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  reference_id text,
  created_at timestamptz DEFAULT NOW()
);

-- Projects/AI jobs
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type project_type NOT NULL,
  status job_status DEFAULT 'pending',
  credit_cost integer DEFAULT 0,
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  error_message text,
  created_at timestamptz DEFAULT NOW(),
  completed_at timestamptz
);

-- AI jobs tracking
CREATE TABLE IF NOT EXISTS ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  service ai_service NOT NULL,
  model text NOT NULL,
  input jsonb DEFAULT '{}',
  status job_status DEFAULT 'queued',
  output_url text,
  error_message text,
  credit_cost integer DEFAULT 0,
  api_cost numeric(10,4),
  latency_ms integer,
  created_at timestamptz DEFAULT NOW(),
  completed_at timestamptz
);

-- CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  type contact_type DEFAULT 'other',
  status contact_status DEFAULT 'lead',
  notes text,
  tags text[] DEFAULT '{}',
  last_contacted_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- CRM Listings
CREATE TABLE IF NOT EXISTS crm_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  address text NOT NULL,
  city text,
  state text,
  zip_code text,
  price numeric(12,2),
  bedrooms integer,
  bathrooms decimal(3,1),
  sqft integer,
  status listing_status DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Media items
CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES crm_listings(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  type media_type NOT NULL,
  title text,
  description text,
  url text NOT NULL,
  thumbnail_url text,
  file_size integer,
  credits_used integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type template_type NOT NULL,
  description text,
  thumbnail_url text,
  output_url text,
  prompt_template text,
  settings jsonb DEFAULT '{}',
  credits_used integer DEFAULT 0,
  usage_count integer DEFAULT 0,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT NOW()
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_id ON subscriptions(payfast_subscription_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_id ON ai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_service ON ai_jobs(service);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created_at ON ai_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_id ON crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON crm_contacts(type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_name ON crm_contacts(name);
CREATE INDEX IF NOT EXISTS idx_crm_listings_user_id ON crm_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_listings_status ON crm_listings(status);
CREATE INDEX IF NOT EXISTS idx_crm_listings_contact_id ON crm_listings(contact_id);
CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_items_listing_id ON media_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_project_id ON media_items(project_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables (only if not already enabled)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
               AND table_name IN ('users', 'subscriptions', 'credit_transactions', 'projects', 
                                  'ai_jobs', 'crm_contacts', 'crm_listings', 'media_items', 
                                  'templates', 'notifications', 'admin_audit_log')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can manage own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own AI jobs" ON ai_jobs;
DROP POLICY IF EXISTS "Users can manage own AI jobs" ON ai_jobs;
DROP POLICY IF EXISTS "Users can view own contacts" ON crm_contacts;
DROP POLICY IF EXISTS "Users can manage own contacts" ON crm_contacts;
DROP POLICY IF EXISTS "Users can view own listings" ON crm_listings;
DROP POLICY IF EXISTS "Users can manage own listings" ON crm_listings;
DROP POLICY IF EXISTS "Users can view own media" ON media_items;
DROP POLICY IF EXISTS "Users can manage own media" ON media_items;
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON templates;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view audit log" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can create audit entries" ON admin_audit_log;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own credit transactions" ON credit_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own AI jobs" ON ai_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own AI jobs" ON ai_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own contacts" ON crm_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own contacts" ON crm_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own listings" ON crm_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own listings" ON crm_listings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own media" ON media_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own media" ON media_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own templates" ON templates FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can manage own templates" ON templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view audit log" ON admin_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can create audit entries" ON admin_audit_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_modtime ON users;
DROP TRIGGER IF EXISTS update_contacts_modtime ON crm_contacts;
DROP TRIGGER IF EXISTS update_listings_modtime ON crm_listings;
DROP TRIGGER IF EXISTS update_templates_modtime ON templates;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_contacts_modtime BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_listings_modtime BEFORE UPDATE ON crm_listings FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_templates_modtime BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================
-- DONE
-- ============================================

-- Verify tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%' ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename AS table_name FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true ORDER BY tablename;

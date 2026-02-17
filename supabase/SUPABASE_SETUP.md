# Supabase Setup Instructions

## Run these SQL commands in your Supabase SQL Editor:

### 1. Add agency_brand column to agent_profiles table:

```sql
-- Add agency_brand column if it doesn't exist
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS agency_brand TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_profiles_agency_brand ON agent_profiles(agency_brand);
```

### 2. Create agency_brands table:

```sql
-- Create agency_brands table
CREATE TABLE IF NOT EXISTS agency_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  heading_font TEXT,
  body_font TEXT,
  logo_position TEXT,
  tagline TEXT,
  header_layout TEXT,
  footer_layout TEXT,
  badge_style TEXT,
  template_styles JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE agency_brands ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to agency_brands" ON agency_brands
  FOR SELECT USING (true);

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read access to agency_brands" ON agency_brands
  FOR SELECT TO authenticated USING (true);
```

### 3. Seed the agency brands (run this in SQL Editor):

```sql
-- Insert predefined agency brands
INSERT INTO agency_brands (name, slug, logo_url, primary_color, secondary_color, accent_color, heading_font, body_font, logo_position, tagline, header_layout, footer_layout, badge_style, is_active, is_featured, display_order) VALUES

('RE/MAX', 'remax', NULL, '#e11d48', '#be123c', '#f43f5e', 'Montserrat', 'Open Sans', 'top', 'With You All The Way', 'extended', 'standard', 'pill', true, true, 1),

('Pam Golding Properties', 'pam-golding', NULL, '#1e3a5f', '#0f172a', '#3b82f6', 'Playfair Display', 'Lato', 'top', 'The Gold Standard in Property', 'standard', 'standard', 'square', true, true, 2),

('Seeff', 'seeff', NULL, '#0d9488', '#0f766e', '#14b8a6', 'Raleway', 'Inter', 'sidebar', 'Experience the Difference', 'compact', 'minimal', 'rounded', true, true, 3),

('ERA South Africa', 'era', NULL, '#7c3aed', '#6d28d9', '#8b5cf6', 'Poppins', 'Open Sans', 'top', 'Real Estate Authority', 'standard', 'standard', 'minimal', true, true, 4),

('Harcourts South Africa', 'harcourts', NULL, '#ea580c', '#c2410c', '#f97316', 'Georgia', 'Verdana', 'top', 'Leading the Way', 'extended', 'contact_only', 'pill', true, true, 5),

('Lew Geffen Sotheby''s International Realty', 'sothebys', NULL, '#0f172a', '#1e293b', '#334155', 'Didot', 'Arial', 'top', 'Defining the Art of Living', 'minimal', 'minimal', 'square', true, true, 6),

('Century 21 South Africa', 'century-21', NULL, '#16a34a', '#15803d', '#22c55e', 'Arial Black', 'Arial', 'top', 'Let Our Family Help Your Family', 'standard', 'standard', 'rounded', true, true, 7),

('Rawson Properties', 'rawson', NULL, '#0891b2', '#0e7490', '#06b6d4', 'Helvetica Neue', 'Helvetica', 'top', 'Family Owned. Client Focused.', 'compact', 'standard', 'minimal', true, true, 8),

('Chas Everitt', 'chas-everitt', NULL, '#ca8a04', '#a16207', '#eab308', 'Trebuchet MS', 'Tahoma', 'top', 'Property Professionals', 'standard', 'standard', 'pill', true, true, 9),

('Other / Independent', 'other', NULL, '#64748b', '#475569', '#94a3b8', 'Inter', 'Inter', 'top', 'Independent Agent', 'standard', 'standard', 'minimal', true, false, 99)

ON CONFLICT (slug) DO NOTHING;
```

## After running these SQL commands:

1. Your agent profile will have the `agency_brand` column
2. The agency brands dropdown will populate from the database
3. Profile loading should work correctly

## To verify:

Run this query to check if data exists:
```sql
-- Check agent_profiles table
SELECT * FROM agent_profiles LIMIT 5;

-- Check agency_brands table
SELECT * FROM agency_brands;
```

-- Extend Agent Profiles Table for Professional Templates
-- Adds fields for brand selection, credentials, and social media

-- Add new columns to agent_profiles table
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS agency_brand TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS specializations TEXT[];
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS awards TEXT[];
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS show_on_templates BOOLEAN DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_agency_brand ON agent_profiles(agency_brand);

-- Add comment describing the table
COMMENT ON TABLE agent_profiles IS 'Stores agent profile information including brand selection for professional templates';
COMMENT ON COLUMN agent_profiles.agency_brand IS 'Selected agency brand (e.g., RE/MAX, Pam Golding)';
COMMENT ON COLUMN agent_profiles.license_number IS 'Professional real estate license number';
COMMENT ON COLUMN agent_profiles.specializations IS 'Array of specializations (e.g., luxury, commercial, residential)';
COMMENT ON COLUMN agent_profiles.awards IS 'Array of awards and recognitions';
COMMENT ON COLUMN agent_profiles.show_on_templates IS 'Whether to display agent info on generated templates';

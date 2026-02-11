-- Agency Brands Table for Professional Template Feature
-- Phase 1: Foundation

-- Create agency_brands table
CREATE TABLE IF NOT EXISTS agency_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) NOT NULL DEFAULT '#1e40af',
    secondary_color VARCHAR(7) DEFAULT '#1e3a8a',
    accent_color VARCHAR(7) DEFAULT '#3b82f6',
    heading_font VARCHAR(100) DEFAULT 'Inter',
    body_font VARCHAR(100) DEFAULT 'Inter',
    logo_position VARCHAR(20) DEFAULT 'top' CHECK (logo_position IN ('top', 'bottom', 'sidebar')),
    tagline VARCHAR(200),
    header_layout VARCHAR(50) DEFAULT 'standard' CHECK (header_layout IN ('standard', 'compact', 'extended', 'minimal')),
    footer_layout VARCHAR(50) DEFAULT 'standard' CHECK (footer_layout IN ('standard', 'compact', 'minimal', 'contact_only')),
    badge_style VARCHAR(50) DEFAULT 'minimal' CHECK (badge_style IN ('minimal', 'rounded', 'square', 'pill')),
    template_styles JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agency_brands ENABLE ROW LEVEL SECURITY;

-- Allow public read access to brands
CREATE POLICY "Brands are viewable by everyone" ON agency_brands
    FOR SELECT USING (true);

-- Only authenticated users can modify brands (admin)
CREATE POLICY "Authenticated users can manage brands" ON agency_brands
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX idx_agency_brands_slug ON agency_brands(slug);
CREATE INDEX idx_agency_brands_active ON agency_brands(is_active);
CREATE INDEX idx_agency_brands_featured ON agency_brands(is_featured, display_order);

-- Professional Templates Table
CREATE TABLE IF NOT EXISTS professional_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('luxury', 'modern', 'family', 'investment', 'commercial', 'custom')),
    description TEXT,
    thumbnail_url TEXT,
    prompt_template TEXT NOT NULL,
    layout_structure JSONB NOT NULL DEFAULT '{}',
    image_slots JSONB NOT NULL DEFAULT '[]',
    brand_id UUID REFERENCES agency_brands(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    credit_cost INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for professional_templates
ALTER TABLE professional_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view own templates" ON professional_templates
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own templates
CREATE POLICY "Users can insert own templates" ON professional_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON professional_templates
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON professional_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Public templates are viewable by everyone
CREATE POLICY "Public templates are viewable by everyone" ON professional_templates
    FOR SELECT USING (is_public = true);

-- Template Generations Table
CREATE TABLE IF NOT EXISTS template_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    template_id UUID REFERENCES professional_templates(id) ON DELETE SET NULL,
    property_id UUID,
    prompt TEXT NOT NULL,
    agent_profile_included BOOLEAN DEFAULT false,
    brand_id UUID REFERENCES agency_brands(id) ON DELETE SET NULL,
    images_used JSONB DEFAULT '[]',
    output_url TEXT,
    prompt_version INTEGER DEFAULT 1,
    credit_cost INTEGER DEFAULT 5,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    generation_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for template_generations
ALTER TABLE template_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own generations
CREATE POLICY "Users can view own generations" ON template_generations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own generations
CREATE POLICY "Users can insert own generations" ON template_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own generations
CREATE POLICY "Users can update own generations" ON template_generations
    FOR UPDATE USING (auth.uid() = user_id);

-- Image Placeholder Mappings Table
CREATE TABLE IF NOT EXISTS image_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id UUID REFERENCES template_generations(id) ON DELETE CASCADE,
    placeholder_id VARCHAR(100) NOT NULL,
    placeholder_name VARCHAR(200),
    image_url TEXT NOT NULL,
    assigned_manually BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for image_mappings
ALTER TABLE image_mappings ENABLE ROW LEVEL SECURITY;

-- Users can view their own image mappings (through generations)
CREATE POLICY "Users can view own image mappings" ON image_mappings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM template_generations tg
            WHERE tg.id = generation_id AND tg.user_id = auth.uid()
        )
    );

-- Users can manage their own image mappings
CREATE POLICY "Users can manage own image mappings" ON image_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM template_generations tg
            WHERE tg.id = generation_id AND tg.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_agency_brands_updated_at
    BEFORE UPDATE ON agency_brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_templates_updated_at
    BEFORE UPDATE ON professional_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE agency_brands IS 'Predefined real estate agency brands with styling rules for templates';
COMMENT ON TABLE professional_templates IS 'User-created professional property listing templates';
COMMENT ON TABLE template_generations IS 'History of template generations with metadata';
COMMENT ON TABLE image_mappings IS 'Mappings between template placeholders and user images';

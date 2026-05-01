-- Add generation_type to template_generations for recent generations categorization
-- This allows tracking whether a generation was 'professional', 'infographic', etc.

ALTER TABLE template_generations
  ADD COLUMN IF NOT EXISTS generation_type VARCHAR(50);

-- Index for faster queries by generation_type
CREATE INDEX IF NOT EXISTS idx_template_generations_type ON template_generations(generation_type);

-- Add comment
COMMENT ON COLUMN template_generations.generation_type IS 'Type/category of the template generation (e.g., professional, infographic, holiday_promo, testimonial, agent_showcase)';

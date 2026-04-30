-- Create storage bucket for AI generated outputs
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-outputs', 'ai-outputs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read their own AI outputs"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own AI outputs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ai-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access for AI outputs (for sharing)
CREATE POLICY "Public can read AI outputs"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-outputs');

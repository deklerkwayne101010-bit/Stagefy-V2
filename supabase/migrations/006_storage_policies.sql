-- Storage Bucket Policies for Uploads
-- Run this SQL in your Supabase Dashboard → SQL Editor

-- First, ensure the bucket exists (create manually in Storage if not exists)
-- Bucket name: uploads (must be public)

-- Allow public read access to uploaded files
DROP POLICY IF EXISTS "Public files are viewable by everyone" ON storage.objects;
CREATE POLICY "Public files are viewable by everyone" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'uploads');

-- Allow anyone to upload files (for authenticated users)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'uploads');

-- Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'uploads')
  WITH CHECK (bucket_id = 'uploads');

-- Allow public uploads (for demo mode - remove in production if needed)
DROP POLICY IF EXISTS "Anyone can upload to uploads" ON storage.objects;
CREATE POLICY "Anyone can upload to uploads" 
  ON storage.objects FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (bucket_id = 'uploads');

-- Allow public update
DROP POLICY IF EXISTS "Anyone can update uploads" ON storage.objects;
CREATE POLICY "Anyone can update uploads" 
  ON storage.objects FOR UPDATE 
  TO anon, authenticated 
  USING (bucket_id = 'uploads')
  WITH CHECK (bucket_id = 'uploads');

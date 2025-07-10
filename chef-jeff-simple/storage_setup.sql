-- Supabase Storage Setup for Chef Jeff
-- Run this in your Supabase SQL editor

-- Create the recipe-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload recipe images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-images' 
    AND auth.role() = 'authenticated'
  );

-- Create policy to allow public read access to recipe images
CREATE POLICY "Allow public read access to recipe images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recipe-images'
  );

-- Create policy to allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update recipe images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'recipe-images' 
    AND auth.role() = 'authenticated'
  );

-- Create policy to allow authenticated users to delete their uploaded images
CREATE POLICY "Allow authenticated users to delete recipe images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-images' 
    AND auth.role() = 'authenticated'
  );

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'recipe-images'; 
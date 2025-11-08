-- Supabase Storage Policies for user-uploads bucket
-- Run this entire file in the Supabase SQL Editor

-- Policy 1: Allow Authenticated Users to Upload
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow Public Read Access
CREATE POLICY "Public can read uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Policy 3: Allow Users to Update Their Own Files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow Users to Delete Their Own Files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);


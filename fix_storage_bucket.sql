-- ============================================================================
-- FIX: Storage Bucket Policies
-- Run this in Supabase SQL Editor to fix storage access
-- ============================================================================

-- First, let's check if the bucket exists
SELECT name, public, id 
FROM storage.buckets 
WHERE name = 'case-attachments';

-- If the bucket doesn't exist, you need to create it through the UI
-- If it does exist but has wrong name, delete and recreate

-- Create storage policies for authenticated users
-- These allow authenticated users to upload and read files

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload case attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-attachments');

-- Policy 2: Allow authenticated users to read their uploaded files
CREATE POLICY "Authenticated users can read case attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'case-attachments');

-- Policy 3: Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update case attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'case-attachments')
WITH CHECK (bucket_id = 'case-attachments');

-- Policy 4: Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete case attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'case-attachments');

-- Verify policies were created
SELECT * FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'case-attachments');

-- ============================================================================
-- If you get errors about policies already existing, that's OK!
-- It means they're already set up
-- ============================================================================

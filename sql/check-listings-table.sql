-- Check your actual listings table structure
-- Run this in Supabase SQL Editor to see what columns exist

-- 1. Check if listings table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'listings';

-- 2. List ALL columns in listings table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
ORDER BY ordinal_position;

-- 3. Check specifically for AI columns
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
  AND column_name LIKE 'ai_%'
ORDER BY column_name;


-- Simple migration to add AI columns to listings table
-- Run this in Supabase SQL Editor

-- Step 1: Add each column individually
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_description text;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_key_features text;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_lifestyle_summary text;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_social_caption text;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_enhanced_at timestamp with time zone;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_enhancement_status text DEFAULT 'pending';

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS listings_ai_status_idx 
ON public.listings(ai_enhancement_status) 
WHERE ai_enhancement_status IS NOT NULL;

-- Step 3: Verify columns were added
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
  AND column_name LIKE 'ai_%'
ORDER BY column_name;

-- Expected output: 6 rows showing all AI columns


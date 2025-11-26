-- Add AI enhancement columns to HomeQR listings table
-- Run this in Supabase SQL Editor

-- Add AI enhancement columns
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

-- Create index for AI enhancement status queries
CREATE INDEX IF NOT EXISTS listings_ai_status_idx 
ON public.listings(ai_enhancement_status) 
WHERE ai_enhancement_status IS NOT NULL;

-- Verify columns were added (should return 6 rows)
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
  AND column_name LIKE 'ai_%'
ORDER BY column_name;


-- Add AI enhancement fields to listings table
-- This migration assumes the listings table already exists
-- Run supabase/schema.sql first if you get an error about the table not existing

-- Add AI enhancement columns (using separate ALTER TABLE statements for better error handling)
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_description text;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_key_features text; -- JSON array of feature strings

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_lifestyle_summary text;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_social_caption text;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_enhanced_at timestamp with time zone;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS ai_enhancement_status text DEFAULT 'pending'; -- 'pending', 'completed', 'failed'

-- Add index for AI enhancement status queries
CREATE INDEX IF NOT EXISTS listings_ai_status_idx ON public.listings(ai_enhancement_status) WHERE ai_enhancement_status IS NOT NULL;

-- Add comments to document the fields
COMMENT ON COLUMN public.listings.ai_description IS 'AI-enhanced property description (rewritten/optimized)';
COMMENT ON COLUMN public.listings.ai_key_features IS 'JSON array of top 5-7 standout features extracted by AI';
COMMENT ON COLUMN public.listings.ai_lifestyle_summary IS 'AI-generated neighborhood and lifestyle insights';
COMMENT ON COLUMN public.listings.ai_social_caption IS 'AI-generated social media caption for Instagram/Facebook';
COMMENT ON COLUMN public.listings.ai_enhanced_at IS 'Timestamp when AI enhancement was last run';
COMMENT ON COLUMN public.listings.ai_enhancement_status IS 'Status of AI enhancement: pending, completed, or failed';


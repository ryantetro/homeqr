-- Verify AI columns exist in listings table
-- Run this in Supabase SQL Editor to check if migration was applied

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
  AND column_name LIKE 'ai_%'
ORDER BY column_name;

-- If no rows are returned, the migration wasn't applied
-- If you see 6 rows (ai_description, ai_key_features, ai_lifestyle_summary, ai_social_caption, ai_enhanced_at, ai_enhancement_status), the migration was successful


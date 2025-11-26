-- Quick verification query to check if AI columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
  AND column_name LIKE 'ai_%'
ORDER BY column_name;

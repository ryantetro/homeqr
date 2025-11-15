# Fix: AI Columns Not Found Error

## Problem
Error: `Could not find the 'ai_description' column of 'listings' in the schema cache`

This means the AI enhancement columns don't exist in your database yet.

## Solution

### Step 1: Verify Migration Status

Run this SQL in your Supabase SQL Editor:

```sql
-- Check if AI columns exist
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
  AND column_name LIKE 'ai_%'
ORDER BY column_name;
```

**Expected Result**: You should see 6 columns:
- `ai_description`
- `ai_enhanced_at`
- `ai_enhancement_status`
- `ai_key_features`
- `ai_lifestyle_summary`
- `ai_social_caption`

**If you see 0 rows**: The migration wasn't applied. Continue to Step 2.

### Step 2: Apply the Migration

Run the migration file in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/add_ai_enhancements.sql`
3. Paste and run it
4. You should see: `Success. No rows returned`

### Step 3: Verify Columns Were Created

Run the verification query from Step 1 again. You should now see 6 columns.

### Step 4: Restart Your Dev Server

After the migration is applied:

```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

This will refresh the TypeScript types and Supabase client cache.

### Step 5: Test Again

1. Go to a listing in your dashboard
2. Click "Enhance with AI"
3. It should work now!

## If Migration Fails

If you get an error that the `listings` table doesn't exist:

1. First run `supabase/schema.sql` to create the base schema
2. Then run `supabase/migrations/add_ai_enhancements.sql`

## Quick Fix Command

If you want to apply just the columns without the DO block:

```sql
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ai_description text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ai_key_features text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ai_lifestyle_summary text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ai_social_caption text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ai_enhanced_at timestamp with time zone;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ai_enhancement_status text DEFAULT 'pending';
```


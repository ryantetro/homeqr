-- ============================================
-- HomeQR: Debug URL Field Queries
-- ============================================
-- Run these queries in your Supabase SQL Editor to debug URL field issues

-- 1. Check if the 'url' column exists in the listings table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'listings' 
  AND column_name = 'url';

-- 2. Count how many listings have URLs vs don't have URLs
SELECT 
  CASE 
    WHEN url IS NULL THEN 'No URL'
    WHEN url = '' THEN 'Empty URL'
    ELSE 'Has URL'
  END AS url_status,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM public.listings
GROUP BY 
  CASE 
    WHEN url IS NULL THEN 'No URL'
    WHEN url = '' THEN 'Empty URL'
    ELSE 'Has URL'
  END
ORDER BY count DESC;

-- 3. Show all listings with their URL status (sample of 20)
SELECT 
  id,
  address,
  city,
  state,
  url,
  CASE 
    WHEN url IS NULL THEN '❌ NULL'
    WHEN url = '' THEN '⚠️ EMPTY'
    ELSE '✅ HAS URL'
  END AS url_status,
  created_at,
  updated_at
FROM public.listings
ORDER BY created_at DESC
LIMIT 20;

-- 4. Find listings that were created recently but don't have URLs
-- (These might be listings created after the URL field was added)
SELECT 
  id,
  address,
  city,
  state,
  url,
  created_at,
  updated_at
FROM public.listings
WHERE url IS NULL 
  OR url = ''
ORDER BY created_at DESC
LIMIT 50;

-- 5. Find listings that have URLs (to verify the field is working)
SELECT 
  id,
  address,
  city,
  state,
  url,
  LENGTH(url) AS url_length,
  created_at
FROM public.listings
WHERE url IS NOT NULL 
  AND url != ''
ORDER BY created_at DESC
LIMIT 20;

-- 6. Check for a specific listing by ID (replace 'YOUR_LISTING_ID' with actual ID)
-- You can get the listing ID from the URL: /dashboard/listings/[id]
SELECT 
  id,
  address,
  city,
  state,
  url,
  CASE 
    WHEN url IS NULL THEN 'NULL'
    WHEN url = '' THEN 'EMPTY STRING'
    ELSE url
  END AS url_value,
  created_at,
  updated_at
FROM public.listings
WHERE id = 'YOUR_LISTING_ID_HERE';

-- 7. Find listings created in the last 7 days and their URL status
SELECT 
  id,
  address,
  city,
  state,
  url,
  CASE 
    WHEN url IS NULL THEN 'No URL'
    WHEN url = '' THEN 'Empty URL'
    ELSE 'Has URL'
  END AS url_status,
  created_at
FROM public.listings
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 8. Check if there are any listings with URLs that look invalid
-- (e.g., URLs that are too short, or don't look like proper listing URLs)
SELECT 
  id,
  address,
  url,
  LENGTH(url) AS url_length,
  CASE 
    WHEN url LIKE '%zillow.com%' THEN '✅ Zillow'
    WHEN url LIKE '%realtor.com%' THEN '✅ Realtor.com'
    WHEN url LIKE '%redfin.com%' THEN '✅ Redfin'
    WHEN url LIKE 'http%' THEN '⚠️ Other site'
    ELSE '❌ Invalid format'
  END AS url_type
FROM public.listings
WHERE url IS NOT NULL 
  AND url != ''
ORDER BY created_at DESC
LIMIT 20;

-- 9. Update a specific listing's URL (if you know the correct URL)
-- WARNING: Only run this if you need to manually fix a listing
-- Replace 'LISTING_ID' and 'URL_HERE' with actual values
/*
UPDATE public.listings
SET url = 'URL_HERE',
    updated_at = NOW()
WHERE id = 'LISTING_ID_HERE';
*/

-- 10. Find all listings that match a specific address pattern
-- (Useful if you know the address but not the ID)
SELECT 
  id,
  address,
  city,
  state,
  url,
  created_at
FROM public.listings
WHERE address ILIKE '%1146%N%Cottage%Way%'
   OR address ILIKE '%Cottage%Way%'
ORDER BY created_at DESC;

-- 11. Check the most recent listing created and its URL
SELECT 
  id,
  address,
  city,
  state,
  url,
  created_at,
  updated_at
FROM public.listings
ORDER BY created_at DESC
LIMIT 1;

-- 12. Compare listings with and without URLs by creation date
-- (Helps identify if URL capture started working at a certain date)
SELECT 
  DATE(created_at) AS creation_date,
  COUNT(*) FILTER (WHERE url IS NOT NULL AND url != '') AS with_url,
  COUNT(*) FILTER (WHERE url IS NULL OR url = '') AS without_url,
  COUNT(*) AS total
FROM public.listings
GROUP BY DATE(created_at)
ORDER BY creation_date DESC
LIMIT 30;


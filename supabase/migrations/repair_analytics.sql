-- Repair analytics by backfilling from scan_sessions and leads
-- This function should be run manually when analytics data is out of sync

-- First, let's create a function to repair analytics for all listings
CREATE OR REPLACE FUNCTION repair_analytics_from_scan_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  listing_record RECORD;
  session_record RECORD;
  today_date DATE;
BEGIN
  today_date := CURRENT_DATE;
  
  -- Loop through all listings that have scan sessions
  FOR listing_record IN 
    SELECT DISTINCT listing_id
    FROM scan_sessions
  LOOP
    -- For each listing, aggregate scan sessions by date
    FOR session_record IN
      SELECT 
        DATE(first_scan_at) as scan_date,
        COUNT(DISTINCT session_id) as unique_visitors,
        SUM(scan_count) as total_scans
      FROM scan_sessions
      WHERE listing_id = listing_record.listing_id
      GROUP BY DATE(first_scan_at)
    LOOP
      -- Count leads for this listing on this date
      DECLARE
        lead_count INTEGER;
      BEGIN
        SELECT COUNT(*)
        INTO lead_count
        FROM leads
        WHERE listing_id = listing_record.listing_id
          AND DATE(created_at) = session_record.scan_date;
        
        -- Upsert analytics record
        INSERT INTO analytics (
          listing_id,
          date,
          total_scans,
          unique_visitors,
          total_leads,
          page_views
        )
        VALUES (
          listing_record.listing_id,
          session_record.scan_date,
          session_record.total_scans,
          session_record.unique_visitors,
          lead_count,
          session_record.total_scans -- Use scan count as page view approximation
        )
        ON CONFLICT (listing_id, date)
        DO UPDATE SET
          total_scans = EXCLUDED.total_scans,
          unique_visitors = EXCLUDED.unique_visitors,
          total_leads = EXCLUDED.total_leads,
          page_views = GREATEST(analytics.page_views, EXCLUDED.page_views);
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Analytics repair completed successfully';
END;
$$;

-- Run the repair function immediately
SELECT repair_analytics_from_scan_sessions();

-- Display results for verification
SELECT 
  l.address,
  a.date,
  a.total_scans,
  a.unique_visitors,
  a.total_leads,
  a.page_views
FROM analytics a
JOIN listings l ON l.id = a.listing_id
ORDER BY a.date DESC, l.address;


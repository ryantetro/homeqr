-- Migration: Add RLS policy for public analytics tracking
-- Run this in your Supabase SQL Editor

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Public can insert analytics" ON public.analytics;

-- Allow public to insert analytics records (for tracking scans and page views)
CREATE POLICY "Public can insert analytics"
  ON public.analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Also allow public to update analytics (for incrementing counts)
DROP POLICY IF EXISTS "Public can update analytics" ON public.analytics;

CREATE POLICY "Public can update analytics"
  ON public.analytics
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);


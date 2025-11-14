-- Fix RLS policies for scan_sessions table
-- This ensures public users can insert/update scan sessions for tracking

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Agents can access own scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Public can insert scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Public can update scan sessions" ON public.scan_sessions;

-- Agents can SELECT/UPDATE/DELETE scan sessions for their listings
CREATE POLICY "Agents can access own scan sessions"
  ON public.scan_sessions
  FOR ALL
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT id FROM public.listings WHERE user_id = auth.uid()
    )
  );

-- Public can INSERT scan sessions (for tracking QR scans and page views)
CREATE POLICY "Public can insert scan sessions"
  ON public.scan_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Public can UPDATE scan sessions (for updating scan counts and timestamps)
CREATE POLICY "Public can update scan sessions"
  ON public.scan_sessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Public can SELECT scan sessions (needed for recent QR scan lookup)
CREATE POLICY "Public can select scan sessions"
  ON public.scan_sessions
  FOR SELECT
  TO public
  USING (true);


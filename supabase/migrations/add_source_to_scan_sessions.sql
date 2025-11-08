-- Add source column to scan_sessions table to track QR vs Direct visits
ALTER TABLE public.scan_sessions 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct';

-- Update existing records based on scan_count
-- If scan_count > 0, it came from a QR scan
-- If scan_count = 0, it's a direct page view
UPDATE public.scan_sessions 
SET source = CASE 
  WHEN scan_count > 0 THEN 'qr'
  ELSE 'direct'
END
WHERE source IS NULL OR source = 'direct';

-- Add comment for documentation
COMMENT ON COLUMN public.scan_sessions.source IS 'Traffic source: qr (scanned QR code) or direct (clicked link)';


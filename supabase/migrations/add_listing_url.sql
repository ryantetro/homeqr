-- Add url field to listings table to store original listing URL
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS url text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS listings_url_idx ON public.listings(url) WHERE url IS NOT NULL;


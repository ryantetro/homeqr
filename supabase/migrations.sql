-- Migration: Add slug, license_number, and calendly_url fields
-- Run this in your Supabase SQL Editor if you already have an existing database

-- Add slug column to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS listings_slug_idx ON public.listings(slug);

-- Add license_number column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS license_number text;

-- Add calendly_url column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS calendly_url text;

-- Add RLS policy to allow public to read active listings (for slug-based routes)
-- Drop policy if it exists first, then create it
DROP POLICY IF EXISTS "Public can view active listings" ON public.listings;
CREATE POLICY "Public can view active listings"
ON public.listings
FOR SELECT
USING (status = 'active');


-- Migration: Add page_views column to analytics table
-- Run this in your Supabase SQL Editor if the column doesn't exist

-- Add page_views column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics' 
        AND column_name = 'page_views'
    ) THEN
        ALTER TABLE public.analytics 
        ADD COLUMN page_views integer DEFAULT 0;
        
        -- Update existing records to have 0 page views
        UPDATE public.analytics 
        SET page_views = 0 
        WHERE page_views IS NULL;
        
        RAISE NOTICE 'Added page_views column to analytics table';
    ELSE
        RAISE NOTICE 'page_views column already exists';
    END IF;
END $$;


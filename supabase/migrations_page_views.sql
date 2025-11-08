-- Migration: Add page_views tracking to analytics
-- Run this in your Supabase SQL Editor

-- Add page_views column to analytics table
alter table public.analytics 
  add column if not exists page_views integer default 0;

-- Update existing rows to have 0 page_views if null
update public.analytics 
  set page_views = 0 
  where page_views is null;


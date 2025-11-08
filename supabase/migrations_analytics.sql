-- Migration: Enhanced Analytics & Tracking
-- Run this in your Supabase SQL Editor

-- Add logo_url to users table (avatar_url already exists)
alter table public.users 
  add column if not exists logo_url text;

-- Add status to leads table
alter table public.leads
  add column if not exists status text default 'new';

-- Create scan_sessions table for unique visitor tracking
create table if not exists public.scan_sessions (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  session_id text not null,
  device_type text, -- mobile, desktop, tablet
  time_of_day integer, -- hour 0-23
  referrer text,
  first_scan_at timestamp with time zone default now(),
  last_scan_at timestamp with time zone default now(),
  scan_count integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(listing_id, session_id)
);

-- Create index for faster lookups
create index if not exists scan_sessions_listing_id_idx on public.scan_sessions(listing_id);
create index if not exists scan_sessions_session_id_idx on public.scan_sessions(session_id);
create index if not exists scan_sessions_first_scan_at_idx on public.scan_sessions(first_scan_at);

-- Add trigger for updated_at
create trigger update_scan_sessions_updated_at before update on public.scan_sessions
  for each row execute function update_updated_at_column();

-- Enable RLS on scan_sessions
alter table public.scan_sessions enable row level security;

-- Agents can access scan sessions for their listings
create policy "Agents can access own scan sessions"
  on public.scan_sessions for all
  using (
    listing_id in (
      select id from public.listings where user_id = auth.uid()
    )
  );

-- Public can insert scan sessions (for tracking)
create policy "Public can insert scan sessions"
  on public.scan_sessions for insert
  with check (true);

-- Add conversion_rate as a computed column (optional, can be calculated in app)
-- For now, we'll calculate it in the application layer


-- HomeQR Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  brokerage text,
  avatar_url text,
  role text default 'agent',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- LISTINGS TABLE
create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  address text not null,
  city text,
  state text,
  zip text,
  price numeric,
  description text,
  image_url text,
  mls_id text,
  bedrooms integer,
  bathrooms numeric,
  square_feet integer,
  status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- QR CODES TABLE
create table public.qrcodes (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  qr_url text,
  scan_count integer default 0,
  redirect_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- LEADS TABLE
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  message text,
  source text default 'qr_scan',
  scan_timestamp timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- ANALYTICS TABLE (daily aggregation)
create table public.analytics (
  id serial primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  date date not null,
  total_scans integer default 0,
  total_leads integer default 0,
  unique_visitors integer default 0,
  created_at timestamp with time zone default now(),
  unique(listing_id, date)
);

-- SUBSCRIPTIONS TABLE (Stripe integration)
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'inactive',
  plan text default 'free',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ENABLE ROW-LEVEL SECURITY
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.qrcodes enable row level security;
alter table public.leads enable row level security;
alter table public.analytics enable row level security;
alter table public.subscriptions enable row level security;

-- RLS POLICIES

-- Users can read their own profile
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Agents can access their own listings
create policy "Agents can access own listings"
  on public.listings for all
  using (auth.uid() = user_id);

-- Agents can access QR codes for their listings
create policy "Agents can access own QR codes"
  on public.qrcodes for all
  using (
    listing_id in (
      select id from public.listings where user_id = auth.uid()
    )
  );

-- Public can read QR codes (for scanning)
create policy "Public can read QR codes"
  on public.qrcodes for select
  using (true);

-- Agents can access leads for their listings
create policy "Agents can access own leads"
  on public.leads for all
  using (
    listing_id in (
      select id from public.listings where user_id = auth.uid()
    )
  );

-- Public can insert leads
create policy "Public can insert leads"
  on public.leads for insert
  with check (true);

-- Agents can access analytics for their listings
create policy "Agents can access own analytics"
  on public.analytics for all
  using (
    listing_id in (
      select id from public.listings where user_id = auth.uid()
    )
  );

-- Agents can access their own subscriptions
create policy "Agents can access own subscriptions"
  on public.subscriptions for all
  using (auth.uid() = user_id);

-- FUNCTIONS

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_users_updated_at before update on public.users
  for each row execute function update_updated_at_column();

create trigger update_listings_updated_at before update on public.listings
  for each row execute function update_updated_at_column();

create trigger update_qrcodes_updated_at before update on public.qrcodes
  for each row execute function update_updated_at_column();

create trigger update_subscriptions_updated_at before update on public.subscriptions
  for each row execute function update_updated_at_column();

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();




-- Add onboarding and payment tracking fields to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_beta_user boolean DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS users_onboarding_completed_idx ON public.users(onboarding_completed) WHERE onboarding_completed = false;
CREATE INDEX IF NOT EXISTS users_has_paid_idx ON public.users(has_paid) WHERE has_paid = true;
CREATE INDEX IF NOT EXISTS users_is_beta_user_idx ON public.users(is_beta_user) WHERE is_beta_user = true;

-- Optional: Mark existing users as beta users if needed
-- UPDATE public.users SET is_beta_user = true WHERE created_at < NOW();


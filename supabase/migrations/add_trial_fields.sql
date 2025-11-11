-- Add trial tracking field to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS subscriptions_trial_started_at_idx ON public.subscriptions(trial_started_at) WHERE trial_started_at IS NOT NULL;


-- Mark user as beta user (no payment required)
UPDATE public.users
SET is_beta_user = true
WHERE id = '61302292-e236-4db3-bea8-08c82be3e4ba';


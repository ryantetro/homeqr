-- Mark a user as a beta user (run in Supabase SQL Editor)
-- Replace 'USER_EMAIL_HERE' with the actual user email

UPDATE public.users
SET is_beta_user = true
WHERE email = 'USER_EMAIL_HERE';

-- Or mark by user ID:
-- UPDATE public.users
-- SET is_beta_user = true
-- WHERE id = 'USER_ID_HERE';

-- To mark all existing users as beta (for testing):
-- UPDATE public.users
-- SET is_beta_user = true
-- WHERE created_at < NOW();


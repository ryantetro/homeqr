# How to Check Subscription Status in Supabase

## Method 1: Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your HomeQR project

2. **Navigate to Table Editor**
   - Click on "Table Editor" in the left sidebar
   - Find and click on the `subscriptions` table

3. **Find Your Subscription**
   - Look for your `user_id` (you can find your user ID from the `users` table)
   - Or search by `stripe_subscription_id` if you have it
   - Check the `status` column - it should be `'trialing'` if your trial is active

4. **Check the Status Column**
   - The status should be one of:
     - `'trialing'` - Trial is active
     - `'active'` - Paid subscription is active
     - `'inactive'` - No active subscription
     - `'canceled'` - Subscription was canceled
     - `'past_due'` - Payment failed

## Method 2: SQL Editor (More Detailed)

1. **Go to SQL Editor in Supabase Dashboard**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run this query to find your subscription:**
   ```sql
   -- Replace 'YOUR_EMAIL' with your actual email
   SELECT 
     s.id,
     s.user_id,
     u.email,
     s.status,
     s.plan,
     s.stripe_subscription_id,
     s.current_period_start,
     s.current_period_end,
     s.trial_started_at,
     s.created_at,
     s.updated_at
   FROM public.subscriptions s
   JOIN public.users u ON s.user_id = u.id
   WHERE u.email = 'YOUR_EMAIL@example.com';
   ```

3. **Or find by user ID:**
   ```sql
   -- Replace 'YOUR_USER_ID' with your actual user ID (UUID)
   SELECT * 
   FROM public.subscriptions 
   WHERE user_id = 'YOUR_USER_ID';
   ```

4. **Check all subscriptions:**
   ```sql
   SELECT 
     s.*,
     u.email,
     u.full_name
   FROM public.subscriptions s
   JOIN public.users u ON s.user_id = u.id
   ORDER BY s.created_at DESC;
   ```

## Method 3: Check via API (From Browser Console)

1. **Open your dashboard** in the browser
2. **Open Developer Tools** (F12 or Cmd+Option+I)
3. **Go to Console tab**
4. **Run this JavaScript:**
   ```javascript
   fetch('/api/subscription/status')
     .then(r => r.json())
     .then(data => {
       console.log('Subscription Status:', data);
       console.log('Status:', data.subscription?.status);
       console.log('Plan:', data.subscription?.plan);
       console.log('Current Period End:', data.subscription?.current_period_end);
     });
   ```

## Method 4: Quick Check Script

Run this in your terminal to check subscription status:

```bash
# This will show subscription status for all users
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
supabase
  .from('subscriptions')
  .select('*, users(email, full_name)')
  .then(({ data, error }) => {
    if (error) console.error('Error:', error);
    else console.log(JSON.stringify(data, null, 2));
  });
"
```

## What to Look For

- **If status is `'trialing'`**: Your trial is active! The banner should show "Free Trial Active"
- **If status is `'inactive'` or `null`**: No subscription exists, so the "Activate Your 14-Day Free Trial" banner will show
- **If status is `'active'`**: You have a paid subscription (no banner should show)
- **If `current_period_end` is in the future**: Your trial/subscription is still valid

## Troubleshooting

If your trial is activated but the status is not `'trialing'`:

1. **Check Stripe webhook logs** - The webhook might not have fired
2. **Check if subscription exists** - The subscription record might not have been created
3. **Manually update status** (if needed):
   ```sql
   UPDATE public.subscriptions
   SET status = 'trialing'
   WHERE user_id = 'YOUR_USER_ID';
   ```


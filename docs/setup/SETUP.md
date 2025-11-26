# HomeQR Setup Guide

## Supabase Configuration

### Step 1: Get Your Supabase Project URL

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find your **Project URL** (it looks like: `https://xxxxx.supabase.co`)

### Step 2: Get Your API Keys

You need **two** different keys from Supabase:

1. **Anon/Public Key** (for client-side)
   - In Supabase Dashboard: **Settings** → **API**
   - Look for **"anon"** or **"public"** key
   - This key starts with `eyJ...` (JWT format)
   - This is safe to use in the browser

2. **Service Role Key** (for server-side)
   - In Supabase Dashboard: **Settings** → **API**
   - Look for **"service_role"** key
   - This key also starts with `eyJ...` (JWT format)
   - **⚠️ NEVER expose this in client-side code**
   - This key bypasses Row Level Security

### Step 3: Create `.env.local` File

Create a file named `.env.local` in the root of your project with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration (optional for now)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 4: Run Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/schema.sql`
4. Paste and run it in the SQL Editor

### Step 5: Configure Row Level Security

The schema includes RLS policies, but verify they're enabled:
- Go to **Authentication** → **Policies** in Supabase
- Ensure RLS is enabled for all tables

## Important Notes

⚠️ **The keys you shared (`sb_publishable_...` and `sb_secret_...`) appear to be from a newer Supabase API format.**

If you're using the traditional Supabase project (which this codebase uses), you need:
- **Project URL** (not just a key)
- **Anon key** (starts with `eyJ...`)
- **Service role key** (starts with `eyJ...`)

If you're using Supabase's newer API format, you may need to:
1. Check your Supabase project type
2. Or use the traditional Supabase project setup

## Next Steps

1. ✅ Create `.env.local` with your Supabase credentials
2. ✅ Run the database schema SQL
3. ✅ Start the dev server: `npm run dev`
4. ✅ Test authentication at `/auth/signup`

## Troubleshooting

**If you can't find the traditional keys:**
- Make sure you're in the **Settings** → **API** section
- Look for "Project URL" and "anon public" / "service_role" keys
- These are different from the newer API key format

**If authentication doesn't work:**
- Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon key (not service role)
- Check that the database schema has been run





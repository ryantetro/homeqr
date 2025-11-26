# Stripe Integration Setup Guide

Complete guide for setting up Stripe payments in HomeQR.

## Overview

HomeQR uses Stripe for subscription management with:
- **Starter Plan**: $29/month or $290/year
- **Pro Plan**: $49/month or $490/year
- **14-day free trial** for all plans
- Automatic subscription management via webhooks

## Phase 1: Stripe Dashboard Configuration

### 1.1 Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → **Products**

2. **Create Product #1 - HomeQR Starter**
   - Click **"Add product"**
   - Name: `HomeQR Starter`
   - Description: (optional)
   - Billing: **Recurring**
   - Currency: **USD**
   - Click **"Save product"**

3. **Add Prices for Starter**
   - Click **"Add another price"**
   - **Price A - Monthly**: $29.00 / month
     - Copy the **Price ID** (starts with `price_`)
   - **Price B - Annual**: $290.00 / year
     - Copy the **Price ID** (starts with `price_`)

4. **Create Product #2 - HomeQR Pro**
   - Click **"Add product"**
   - Name: `HomeQR Pro`
   - Description: (optional)
   - Billing: **Recurring**
   - Currency: **USD**
   - Click **"Save product"**

5. **Add Prices for Pro**
   - Click **"Add another price"**
   - **Price C - Monthly**: $49.00 / month
     - Copy the **Price ID** (starts with `price_`)
   - **Price D - Annual**: $490.00 / year
     - Copy the **Price ID** (starts with `price_`)

### 1.2 Enable Customer Portal

1. Go to **Settings** → **Billing** → **Customer Portal**

2. **Enable the following features:**
   - ✅ Manage payment methods
   - ✅ Update card
   - ✅ Cancel subscription
   - ✅ View invoices
   - ✅ Switch pricing plans

3. **Set Redirect URL:**
   - `https://your-domain.com/dashboard/billing`
   - Replace `your-domain.com` with your actual domain

4. Click **"Save changes"**

### 1.3 Create Webhook Endpoint

1. Go to **Developers** → **Webhooks** → **Add endpoint**

2. **Endpoint URL:**
   - Production: `https://your-domain.com/api/stripe/webhook`
   - Development: Use Stripe CLI (see Phase 4)

3. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. Click **"Add endpoint"**

5. **Copy the Webhook Signing Secret**
   - Click on the webhook endpoint
   - Copy the **Signing secret** (starts with `whsec_`)
   - You'll need this for `STRIPE_WEBHOOK_SECRET`

### 1.4 Get API Keys

1. Go to **Developers** → **API Keys**

2. **Copy your keys:**
   - **Secret Key** (starts with `sk_live_` or `sk_test_`)
     - Use test keys for development
     - Use live keys for production
   - **Publishable Key** (starts with `pk_live_` or `pk_test_`)

## Phase 2: Environment Variables

### 2.1 Local Development

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your Stripe configuration:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
   STRIPE_STARTER_ANNUAL_PRICE_ID=price_...
   STRIPE_PRO_MONTHLY_PRICE_ID=price_...
   STRIPE_PRO_ANNUAL_PRICE_ID=price_...
   
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

### 2.2 Vercel Production

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add all Stripe variables for:
   - **Development**
   - **Preview**
   - **Production**

3. Use **live keys** for production, **test keys** for development/preview

## Phase 3: Code Verification

The following files are already implemented and verified:

- ✅ `src/app/api/stripe/checkout/route.ts` - Creates checkout sessions
- ✅ `src/app/api/stripe/webhook/route.ts` - Handles webhook events
- ✅ `src/app/api/stripe/portal/route.ts` - Customer portal access
- ✅ `src/lib/stripe/prices.ts` - Price ID configuration
- ✅ `src/lib/subscription/access.ts` - Access control logic

### Verify Checkout Route

The checkout route:
- Uses `getPriceId()` to get the correct price ID
- Creates checkout session with `trial_period_days: 14`
- Includes metadata: `userId`, `plan`, `billing`
- Redirects to `/dashboard?trial=activated` on success

### Verify Webhook Handler

The webhook handles:
- `checkout.session.completed` - Creates subscription record
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Sets status to inactive
- `customer.subscription.trial_will_end` - Logs trial ending

## Phase 4: Local Testing with Stripe CLI

### 4.1 Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Other platforms:**
Download from [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

### 4.2 Login to Stripe

```bash
stripe login
```

This will open your browser to authenticate.

### 4.3 Forward Webhooks Locally

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Important:** Copy the webhook signing secret that appears (starts with `whsec_`) and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### 4.4 Test Webhook Events

In a new terminal, test webhook events:

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription deletion
stripe trigger customer.subscription.deleted

# Test trial ending
stripe trigger customer.subscription.trial_will_end
```

Check your application logs and database to verify events are processed correctly.

## Phase 5: Testing Checklist

### 5.1 Checkout Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a test account and go through onboarding

3. Select a plan (Starter or Pro, Monthly or Annual)

4. You'll be redirected to Stripe Checkout

5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

6. Complete checkout

7. Verify:
   - ✅ Redirects to `/dashboard?trial=activated`
   - ✅ Subscription record created in database
   - ✅ Status is `trialing`
   - ✅ `trial_started_at` is set

### 5.2 Webhook Testing

Test each webhook event:

- ✅ `checkout.session.completed` creates subscription
- ✅ `customer.subscription.updated` updates status
- ✅ Trial → Active transition works
- ✅ `customer.subscription.deleted` sets status to inactive
- ✅ `customer.subscription.trial_will_end` logs correctly

### 5.3 Access Control

Verify access control works:

- ✅ Trial users have access
- ✅ Active users have access
- ✅ Past due users are blocked
- ✅ Expired subscriptions are blocked
- ✅ Beta users bypass all checks

### 5.4 Customer Portal

1. Go to `/dashboard/billing`

2. Click **"Manage Billing"**

3. Verify you can:
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ Cancel subscription
   - ✅ Switch plans
   - ✅ Redirect back to billing page

## Phase 6: Production Deployment

### 6.1 Production Webhook

1. In Stripe Dashboard, create a **production webhook endpoint**:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Select the same events as development

2. Copy the **production webhook signing secret**

3. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET` for **Production**

### 6.2 Production Testing

1. Test with a real payment method (use a small amount)

2. Verify:
   - ✅ Webhook receives events
   - ✅ Subscription records update
   - ✅ Customer portal works
   - ✅ Access control functions correctly

## Phase 7: Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook endpoint URL:**
   - Must be publicly accessible
   - Must use HTTPS in production
   - Must match exactly in Stripe Dashboard

2. **Check webhook secret:**
   - Must match the secret from Stripe Dashboard
   - Different secrets for test/live mode

3. **Check Stripe CLI (local):**
   - Ensure `stripe listen` is running
   - Check the webhook secret matches `.env.local`

### Checkout Not Working

1. **Check price IDs:**
   - Verify all 4 price IDs are set in environment variables
   - Check price IDs match Stripe Dashboard

2. **Check API keys:**
   - Use test keys for development
   - Use live keys for production
   - Ensure keys are not expired

### Subscription Status Not Updating

1. **Check webhook events:**
   - View webhook logs in Stripe Dashboard
   - Check for failed webhook deliveries

2. **Check database:**
   - Verify `subscriptions` table exists
   - Check RLS policies allow updates
   - Verify `stripe_subscription_id` is stored correctly

### Customer Portal Not Working

1. **Check customer ID:**
   - Verify `stripe_customer_id` is stored in database
   - Check subscription record exists

2. **Check portal configuration:**
   - Verify redirect URL is set correctly
   - Check portal features are enabled

## Test Cards

Use these test cards in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Requires Authentication**: `4000 0027 6000 3184`

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)

## Support

If you encounter issues:
1. Check Stripe Dashboard → Developers → Webhooks for error logs
2. Check application logs for webhook processing errors
3. Verify all environment variables are set correctly
4. Ensure database schema matches `supabase/schema.sql`


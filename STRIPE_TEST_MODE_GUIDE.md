# Stripe Test Mode - Complete Testing Guide

## 🎯 Overview

Stripe has a **Test Mode** that lets you test everything without charging real money. All test transactions are free and don't affect your real account.

## ✅ Step 1: Verify You're in Test Mode

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Look at the top right corner - you should see a toggle that says **"Test mode"** or **"Live mode"**
3. **Make sure it says "Test mode"** (toggle it if needed)

**Important:** In Test Mode:
- ✅ No real money is charged
- ✅ All transactions are fake
- ✅ You can test everything safely
- ✅ Test cards work perfectly

## 🧪 Step 2: Use Test Cards

Stripe provides special test card numbers that work in Test Mode. These cards **never charge real money**.

### Basic Test Cards

**Success Card (Most Common):**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Decline Card (Test Failures):**
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**3D Secure Card (Requires Authentication):**
```
Card Number: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### More Test Cards

For testing different scenarios:
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`
- **Processing Error**: `4000 0000 0000 0119`

## 🚀 Step 3: Complete Test Flow

### Test 1: Full Checkout Flow

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open your app:**
   - Go to `http://localhost:3000` (or your local URL)
   - Sign up or log in

3. **Go through onboarding:**
   - Complete Step 1 (Profile Setup)
   - Upload profile photo (should work now without subscription)
   - Fill in name, phone, brokerage
   - Click "Next"

4. **Select a plan:**
   - Choose any plan (Starter Monthly, Pro Monthly, or Pro Annual)
   - Click "Secure Checkout"

5. **You'll be redirected to Stripe Checkout**

6. **Enter test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34` (or any future date)
   - CVC: `123`
   - ZIP: `12345`
   - **Name:** Any name (e.g., "Test User")

7. **Complete checkout:**
   - Click "Subscribe" or "Complete payment"
   - **You won't be charged!** This is test mode

8. **Verify redirect:**
   - Should redirect to: `/dashboard?trial=activated`
   - You should see a success message

### Test 2: Verify Database

1. **Go to Supabase Dashboard:**
   - Navigate to your Supabase project
   - Go to **Table Editor** → `subscriptions` table

2. **Check for new record:**
   - Should see a new subscription row
   - `status` should be `trialing`
   - `stripe_customer_id` should be set (starts with `cus_`)
   - `stripe_subscription_id` should be set (starts with `sub_`)
   - `trial_started_at` should be set
   - `plan` should match your selection (e.g., `starter` or `pro`)

### Test 3: Verify Webhooks

1. **Go to Stripe Dashboard:**
   - Navigate to **Developers** → **Webhooks**
   - Click on your webhook endpoint

2. **Check "Recent events" tab:**
   - You should see events like:
     - `checkout.session.completed` ✅
     - `customer.subscription.created` ✅
   - Status should be "Succeeded" (green)

3. **Click on an event to see details:**
   - Verify the event payload
   - Check that metadata includes `userId`, `plan`, `billing`

### Test 4: Test Customer Portal

1. **Go to your dashboard:**
   - Navigate to `/dashboard/billing`

2. **Click "Manage Billing"**

3. **You'll be redirected to Stripe Customer Portal**

4. **In the portal, you can:**
   - ✅ View subscription details
   - ✅ See trial period (14 days)
   - ✅ Update payment method (use another test card)
   - ✅ View invoices
   - ✅ Cancel subscription
   - ✅ Switch plans

5. **After making changes:**
   - Should redirect back to `/dashboard/billing`
   - Check database to verify changes were saved

### Test 5: Test Different Scenarios

**Test Subscription Update:**
1. In Stripe Dashboard → Customers
2. Find your test customer
3. Click on their subscription
4. Try changing the plan or billing cycle
5. Verify webhook events are received
6. Check database updates

**Test Subscription Cancellation:**
1. Go to Customer Portal
2. Cancel the subscription
3. Verify status changes to `cancel_at_period_end` or `inactive`
4. Check database updates

**Test Payment Failure:**
1. Use decline card: `4000 0000 0000 0002`
2. Try to complete checkout
3. Should show error message
4. Verify subscription status is `past_due` or `unpaid`

## 🔍 Step 4: Verify Everything Works

### Checklist:

- [ ] Can complete checkout with test card `4242 4242 4242 4242`
- [ ] Redirects to `/dashboard?trial=activated` after checkout
- [ ] Subscription record created in database
- [ ] Status is `trialing`
- [ ] Webhook events received in Stripe Dashboard
- [ ] Customer Portal accessible
- [ ] Can update payment method in portal
- [ ] Can view invoices in portal
- [ ] Can cancel subscription in portal
- [ ] Database updates when subscription changes

## 🐛 Troubleshooting

### Test Card Not Working

**Problem:** Test card is declined or not accepted

**Solution:**
- Make sure you're in **Test Mode** in Stripe Dashboard
- Use the exact card number: `4242 4242 4242 4242`
- Use any future expiry date
- Use any 3-digit CVC
- Use any 5-digit ZIP

### Webhook Not Receiving Events

**Problem:** No events showing in Stripe Dashboard

**Solution:**
1. Check webhook endpoint URL is correct
2. Verify webhook is enabled
3. Check application logs for errors
4. Make sure your server is running
5. For local testing, use Stripe CLI (see below)

### Subscription Not Created in Database

**Problem:** Checkout works but no database record

**Solution:**
1. Check webhook events in Stripe Dashboard
2. Verify webhook secret is correct in `.env.local`
3. Check Supabase logs for errors
4. Verify RLS policies allow inserts
5. Check application server logs

## 🛠️ Local Testing with Stripe CLI (Optional)

If you want to test webhooks locally without deploying:

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### Login

```bash
stripe login
```

### Forward Webhooks Locally

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will:
- Forward webhook events to your local server
- Give you a webhook signing secret (starts with `whsec_`)
- Add this to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Test Events

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription deletion
stripe trigger customer.subscription.deleted
```

## 📊 What to Check After Testing

### In Stripe Dashboard:

1. **Customers:**
   - Should see test customers created
   - Each customer has a subscription

2. **Subscriptions:**
   - Should see active/trialing subscriptions
   - Can view subscription details

3. **Payments:**
   - Should see test payments (marked as "Test")
   - No real money charged

4. **Webhooks:**
   - Should see successful webhook deliveries
   - Can view event payloads

### In Your Database:

1. **subscriptions table:**
   - Records created with correct data
   - Status updates correctly
   - Stripe IDs stored properly

2. **users table:**
   - User records exist
   - Profile data saved

## 🎉 Success Indicators

You'll know Stripe is working correctly when:

✅ Test checkout completes without errors
✅ Subscription record appears in database
✅ Webhook events are received and processed
✅ Customer Portal loads and works
✅ You can update/cancel subscriptions
✅ No real money is charged (all transactions marked "Test")

## 🔄 Switching Between Test and Live Mode

**To switch modes in Stripe Dashboard:**
1. Click the mode toggle in top right
2. Switch between "Test mode" and "Live mode"
3. **Important:** Use different API keys for each mode
4. Test mode keys start with `sk_test_` and `pk_test_`
5. Live mode keys start with `sk_live_` and `pk_live_`

**For testing:** Always use Test Mode
**For production:** Use Live Mode with real API keys

## 💡 Pro Tips

1. **Use Test Mode for all development** - Never test with real cards
2. **Test different scenarios** - Success, decline, 3D Secure
3. **Check webhook logs** - They show exactly what happened
4. **Monitor database** - Verify data is saved correctly
5. **Test edge cases** - Cancellations, plan changes, etc.

## 🚨 Important Notes

- **Test Mode is completely free** - No charges ever
- **Test cards only work in Test Mode** - Won't work in Live Mode
- **Test data is separate** - Test and Live customers/subscriptions don't mix
- **You can delete test data** - Clean up test customers in Stripe Dashboard
- **Test webhooks work the same** - Same events, same payloads as production

## 📝 Quick Test Checklist

Run through this quick checklist:

1. [ ] Stripe Dashboard is in Test Mode
2. [ ] Environment variables set with test keys (`sk_test_`, `pk_test_`)
3. [ ] Complete checkout with test card `4242 4242 4242 4242`
4. [ ] Verify redirect to dashboard
5. [ ] Check database for subscription record
6. [ ] Check Stripe Dashboard for webhook events
7. [ ] Test Customer Portal
8. [ ] Verify no real charges (all marked "Test")

That's it! You can test everything without spending a penny. 🎉


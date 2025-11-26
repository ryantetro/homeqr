# Stripe Integration Testing Guide

## ✅ Configuration Tests (Completed)

All environment variables and configuration are verified:
- ✅ All 7 Stripe environment variables set
- ✅ All 4 Price IDs configured correctly
- ✅ Stripe keys in correct format
- ✅ Webhook secret configured
- ✅ Server is accessible

## 🧪 Manual Testing Steps

### Test 1: Checkout Flow (End-to-End)

**Steps:**
1. Start your development server (if not running):
   ```bash
   npm run dev
   ```

2. Open your application in a browser:
   - Go to `https://www.home-qrcode.com` (or your local URL)

3. Create a test account or log in:
   - Sign up or log in to your application

4. Go through onboarding:
   - Complete the onboarding flow
   - When prompted to select a plan, choose either:
     - **Starter Monthly** ($29/month)
     - **Starter Annual** ($290/year)
     - **Pro Monthly** ($49/month)
     - **Pro Annual** ($490/year)

5. You'll be redirected to Stripe Checkout

6. Use test card information:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

7. Complete checkout:
   - Enter the test card details
   - Click "Subscribe" or "Complete payment"
   - **Note**: You won't be charged during the 14-day trial

8. Verify redirect:
   - Should redirect to: `/dashboard?trial=activated`
   - Check that you see a success message

9. Check database:
   - Go to Supabase Dashboard → Table Editor → `subscriptions`
   - Verify a new subscription record was created:
     - `status` should be `trialing`
     - `stripe_customer_id` should be set
     - `stripe_subscription_id` should be set
     - `trial_started_at` should be set
     - `plan` should match your selection

### Test 2: Webhook Events

**Steps:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint (`vibrant-glow`)
3. View "Recent events" tab
4. You should see:
   - `checkout.session.completed` event
   - `customer.subscription.created` event
   - Status should be "Succeeded" (green)

5. Click on an event to see details:
   - Verify the event payload
   - Check that metadata includes `userId`, `plan`, `billing`

### Test 3: Customer Portal

**Steps:**
1. After completing checkout, go to `/dashboard/billing`
2. Click "Manage Billing" button
3. You should be redirected to Stripe Customer Portal
4. In the portal, verify you can:
   - ✅ View subscription details
   - ✅ See trial period (14 days)
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ Cancel subscription (if enabled)
   - ✅ Switch plans (if enabled)

5. After making changes, verify redirect back to `/dashboard/billing`

### Test 4: Subscription Status Updates

**Steps:**
1. In Stripe Dashboard → Customers
2. Find your test customer
3. Go to their subscription
4. Manually trigger events:
   - **Update subscription**: Change plan or billing cycle
   - **Cancel subscription**: Cancel the subscription
   - Check that webhook events are received

5. Verify database updates:
   - Check `subscriptions` table in Supabase
   - Verify `status` field updates correctly
   - Verify `current_period_end` updates

### Test 5: Access Control

**Steps:**
1. With a trialing subscription, verify:
   - ✅ Can access dashboard
   - ✅ Can create listings
   - ✅ Can generate QR codes
   - ✅ Trial limits apply (5 listings, 5 QR codes, 50 photos)

2. Test with different subscription statuses:
   - **Active**: Full access
   - **Past Due**: Should be blocked
   - **Canceled**: Should be blocked

### Test 6: Trial Ending Notification

**Steps:**
1. In Stripe Dashboard → Subscriptions
2. Find a subscription in trial
3. Manually trigger `customer.subscription.trial_will_end` event:
   ```bash
   # If you have Stripe CLI installed
   stripe trigger customer.subscription.trial_will_end
   ```
4. Check application logs for trial ending notification
5. Verify email is sent (if email service is configured)

## 🐛 Troubleshooting

### Checkout Not Working

**Symptoms:**
- Error: "Payment integration is not yet configured"
- Checkout page doesn't load
- Redirect fails

**Solutions:**
1. Verify environment variables are set:
   ```bash
   grep STRIPE .env.local
   ```

2. Restart your development server:
   ```bash
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

3. Check browser console for errors

4. Verify Stripe keys are correct in Stripe Dashboard

### Webhook Not Receiving Events

**Symptoms:**
- No events in Stripe Dashboard → Webhooks
- Subscription not created in database
- Status not updating

**Solutions:**
1. Check webhook endpoint URL:
   - Must be: `https://www.home-qrcode.com/api/stripe/webhook`
   - Must be publicly accessible (not localhost)

2. Verify webhook secret matches:
   ```bash
   grep STRIPE_WEBHOOK_SECRET .env.local
   ```

3. Check webhook events are selected:
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook
   - Verify all 7 events are selected

4. Check application logs for webhook errors

5. Test webhook manually:
   - In Stripe Dashboard → Webhooks → Your endpoint
   - Click "Send test webhook"
   - Select event type and send

### Customer Portal Not Working

**Symptoms:**
- "Manage Billing" button doesn't work
- Portal doesn't load
- Error: "No subscription found"

**Solutions:**
1. Verify subscription exists in database:
   - Check `subscriptions` table
   - Verify `stripe_customer_id` is set

2. Verify Customer Portal is enabled:
   - Stripe Dashboard → Settings → Billing → Customer Portal
   - Ensure features are enabled

3. Check return URL is set correctly:
   - Should be: `https://www.home-qrcode.com/dashboard/billing`

### Database Not Updating

**Symptoms:**
- Subscription created in Stripe but not in database
- Status not updating

**Solutions:**
1. Check webhook is receiving events (see above)

2. Check Supabase RLS policies:
   - Verify service role key is set correctly
   - Check that webhook can write to `subscriptions` table

3. Check application logs for webhook processing errors

4. Verify webhook handler code is correct:
   - Check `src/app/api/stripe/webhook/route.ts`

## 📊 Test Checklist

Use this checklist to track your testing progress:

### Configuration
- [x] All environment variables set
- [x] All Price IDs configured
- [x] Stripe keys valid
- [x] Webhook secret configured

### Checkout Flow
- [ ] Can select plan in onboarding
- [ ] Redirects to Stripe Checkout
- [ ] Can enter test card
- [ ] Checkout completes successfully
- [ ] Redirects to `/dashboard?trial=activated`
- [ ] Subscription created in database

### Webhook Events
- [ ] `checkout.session.completed` received
- [ ] `customer.subscription.created` received
- [ ] Subscription record created in database
- [ ] Status set to `trialing`

### Customer Portal
- [ ] "Manage Billing" button works
- [ ] Portal loads correctly
- [ ] Can view subscription details
- [ ] Can update payment method
- [ ] Can view invoices
- [ ] Redirects back correctly

### Access Control
- [ ] Trial users have access
- [ ] Trial limits apply correctly
- [ ] Active users have full access
- [ ] Past due users are blocked

## 🎯 Success Criteria

Your Stripe integration is working correctly when:

1. ✅ Users can complete checkout with test cards
2. ✅ Subscriptions are created in database automatically
3. ✅ Webhook events are received and processed
4. ✅ Customer portal is accessible and functional
5. ✅ Access control works for all subscription states
6. ✅ Subscription status updates correctly

## 📝 Next Steps After Testing

1. **Add to Vercel**: Add all environment variables to Vercel Dashboard
2. **Test in Production**: Test with a small real payment
3. **Monitor Webhooks**: Set up monitoring for webhook failures
4. **Set up Alerts**: Configure alerts for failed payments
5. **Documentation**: Update team documentation with test procedures

## 🔗 Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)


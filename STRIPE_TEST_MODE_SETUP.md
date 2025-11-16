# Setting Up Stripe Test Mode Products & Prices

## The Problem

Your price IDs were created in **Live Mode**, but you're using **Test Mode** keys. Price IDs are different between test and live mode.

## Solution: Create Products in Test Mode

### Step 1: Switch to Test Mode

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Toggle to "Test mode"** (top right corner)
3. Make sure it says "Test mode" (not "Live mode")

### Step 2: Create Products in Test Mode

**Product #1 - HomeQR Starter (Test Mode)**

1. Go to **Products** → **Add product**
2. Name: `HomeQR Starter`
3. Billing: **Recurring**
4. Currency: **USD**
5. Click **"Save product"**

6. **Add Price A - Monthly:**
   - Price: `$29.00` / month
   - **Copy the Price ID** (starts with `price_`) - This is your TEST mode price ID
   - This will be different from your live mode price ID

7. **Add Price B - Annual:**
   - Price: `$290.00` / year
   - **Copy the Price ID** (starts with `price_`)

**Product #2 - HomeQR Pro (Test Mode)**

1. Go to **Products** → **Add product**
2. Name: `HomeQR Pro`
3. Billing: **Recurring**
4. Currency: **USD**
5. Click **"Save product"**

6. **Add Price C - Monthly:**
   - Price: `$49.00` / month
   - **Copy the Price ID** (starts with `price_`)

7. **Add Price D - Annual:**
   - Price: `$490.00` / year
   - **Copy the Price ID** (starts with `price_`)

### Step 3: Update Environment Variables

Once you have all 4 TEST mode price IDs, update your `.env.local`:

```env
STRIPE_STARTER_MONTHLY_PRICE_ID=price_... (TEST mode)
STRIPE_STARTER_ANNUAL_PRICE_ID=price_... (TEST mode)
STRIPE_PRO_MONTHLY_PRICE_ID=price_... (TEST mode)
STRIPE_PRO_ANNUAL_PRICE_ID=price_... (TEST mode)
```

## Important Notes

- **Test mode price IDs** are different from **live mode price IDs**
- Test mode prices work with test cards (`4242 4242 4242 4242`)
- Live mode prices work with real cards
- You need separate price IDs for each mode

## Quick Checklist

- [ ] Switched to Test Mode in Stripe Dashboard
- [ ] Created "HomeQR Starter" product in Test Mode
- [ ] Created Starter Monthly price ($29/mo) - copied Price ID
- [ ] Created Starter Annual price ($290/yr) - copied Price ID
- [ ] Created "HomeQR Pro" product in Test Mode
- [ ] Created Pro Monthly price ($49/mo) - copied Price ID
- [ ] Created Pro Annual price ($490/yr) - copied Price ID
- [ ] Updated `.env.local` with all 4 TEST mode price IDs

## After Setup

Once you have the test mode price IDs, share them and I'll update your `.env.local` file, or you can update it manually.

Then you'll be able to test with:
- Test card: `4242 4242 4242 4242`
- No real charges
- Full webhook testing with Stripe CLI


# Create "Free for Life" Coupon in Stripe

This guide will help you create a coupon that gives users a 100% discount forever (free subscription for life).

## Step-by-Step Instructions

### Step 1: Create the Coupon

1. **Go to Stripe Dashboard**
   - Navigate to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Make sure you're in **Test Mode** first to test it, then create it in **Live Mode** when ready

2. **Navigate to Coupons**
   - Click **Products** in the left sidebar
   - Click **Coupons** tab
   - Click **"Create coupon"** button

3. **Configure the Coupon**
   
   **Basic Information:**
   - **Name**: `Free for Life` (or any name you prefer)
   - **ID**: `free_for_life` (optional, auto-generated if left blank)
   
   **Discount:**
   - **Discount type**: Select **"Percentage off"**
   - **Percent off**: Enter `100` (this gives 100% discount = free)
   
   **Duration:**
   - **Duration**: Select **"Forever"** ⭐ (This is the key setting!)
   - This ensures the discount applies to all future billing cycles
   
   **Redemption:**
   - **Redemption limits**: Leave empty (or set a limit if you want to restrict usage)
   - **Expiration date**: Leave empty (or set if you want the coupon itself to expire)
   
   **Applies to:**
   - **Applies to**: Select **"All products"** (or specific products if needed)
   
4. **Click "Create coupon"**

### Step 2: Create the Promotion Code

1. **Navigate to Promotion Codes**
   - Still in **Products** section
   - Click **"Promotion codes"** tab
   - Click **"Create promotion code"** button

2. **Configure the Promotion Code**
   
   **Code:**
   - **Code**: Enter your code (e.g., `FREEFORLIFE`, `LIFETIME`, `FOREVERFREE`)
   - Make it memorable and easy to share
   - Use uppercase for clarity
   
   **Coupon:**
   - **Coupon**: Select the "Free for Life" coupon you just created
   
   **Active:**
   - **Active**: Make sure it's **enabled** ✅
   
   **Customer eligibility:**
   - **Customer eligibility**: Select **"All customers"** (or restrict if needed)
   
   **Expiration:**
   - **Expiration date**: Leave empty (or set if you want the code to expire)
   
   **Usage limits:**
   - **Max redemptions**: Leave empty for unlimited, or set a limit
   - **First time customers only**: Check this if you want to prevent existing customers from using it
   
3. **Click "Create promotion code"**

### Step 3: Test the Coupon

1. **Go through your app's onboarding**
2. **On Step 2 (Choose Plan)**, enter your promotion code (e.g., `FREEFORLIFE`)
3. **You should see**: Green checkmark with "100% off" message
4. **Proceed to checkout** - the discount should show $0.00
5. **Complete checkout** - user will be charged $0.00 forever

## Important Notes

### How It Works
- **100% off + Forever duration** = User pays $0.00 every billing cycle
- The subscription is still active, but the amount charged is $0.00
- User keeps all features of their selected plan
- Discount applies to all future renewals automatically

### Best Practices

1. **Test First**: Always test in Stripe Test Mode before using in production
2. **Limit Usage**: Consider setting max redemptions to control how many people can use it
3. **Track Usage**: Monitor in Stripe Dashboard → Promotion codes → View redemptions
4. **Code Security**: Treat these codes as valuable - they give free access forever
5. **First-Time Only**: Consider enabling "First time customers only" to prevent abuse

### Alternative: Limited Time Free

If you want "free for X months" instead of forever:
- **Percent off**: `100`
- **Duration**: Select **"Repeating"** and enter number of months
- After the period ends, user pays full price

### Example Codes

Here are some code ideas:
- `FREEFORLIFE` - Clear and direct
- `LIFETIME` - Short and memorable
- `FOREVERFREE` - Descriptive
- `BETA100` - For beta testers
- `FOUNDER` - For founders/early adopters

## Verification Checklist

After creating your coupon, verify:
- ✅ Coupon shows "100% off"
- ✅ Duration is set to "Forever"
- ✅ Promotion code is Active
- ✅ Code works in your app's discount input
- ✅ Shows "100% off" in the UI
- ✅ Checkout shows $0.00 charge
- ✅ Test subscription shows $0.00 in Stripe

## Troubleshooting

**Code not working?**
- Check that coupon is set to "Forever" duration
- Verify promotion code is Active
- Ensure code matches exactly (case-insensitive in your app)

**User still being charged?**
- Verify coupon is linked to the promotion code
- Check that coupon applies to the correct products/prices
- Ensure subscription was created with the promotion code

**Want to revoke access?**
- You can deactivate the promotion code in Stripe
- Existing subscriptions with the discount will continue
- To remove discount from existing subscriptions, you'll need to update them manually in Stripe

## Next Steps

1. Create the coupon and promotion code in Stripe (Test Mode first!)
2. Test it in your app
3. Share the code with intended users
4. Monitor usage in Stripe Dashboard
5. Create in Live Mode when ready for production


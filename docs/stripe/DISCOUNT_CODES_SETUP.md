# Discount Codes Setup Guide

This guide explains how to set up and use discount codes (promotion codes) in HomeQR.

## Overview

HomeQR supports Stripe promotion codes that can be applied during checkout. Users can enter discount codes in the onboarding modal before proceeding to Stripe Checkout.

## How It Works

1. **User enters code** in the onboarding modal (Step 2: Choose Plan)
2. **Code is validated** in real-time via `/api/stripe/validate-promo`
3. **Valid codes** show discount information (e.g., "20% off")
4. **Checkout** passes the promotion code to Stripe
5. **Stripe applies discount** automatically during checkout

## Setting Up Discount Codes in Stripe

### Step 1: Create a Coupon

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → **Products** → **Coupons**
2. Click **"Create coupon"**
3. Configure your coupon:
   - **Name**: e.g., "Early Bird 20% Off"
   - **Discount type**: 
     - **Percentage off**: e.g., 20% (enter `20`)
     - **Amount off**: e.g., $10 off (enter `1000` for $10.00)
   - **Duration**:
     - **Once**: Discount applies only to first payment
     - **Forever**: Discount applies to all future payments
     - **Repeating**: Discount applies for X months
   - **Redemption limits** (optional):
     - Maximum redemptions
     - Expiration date
   - **Applies to**: All products (or specific products)
4. Click **"Create coupon"**

### Step 2: Create a Promotion Code

1. In Stripe Dashboard → **Products** → **Promotion codes**
2. Click **"Create promotion code"**
3. Configure:
   - **Code**: e.g., `EARLYBIRD20` (users will enter this)
   - **Coupon**: Select the coupon you created
   - **Active**: Make sure it's enabled
   - **Customer eligibility**: 
     - **All customers**: Anyone can use it
     - **Specific customers**: Limit to certain customers
   - **Expiration**: Optional expiration date
   - **Usage limits**: Max times it can be used
4. Click **"Create promotion code"**

### Step 3: Test Your Code

1. Go through onboarding in your app
2. On Step 2 (Choose Plan), enter your promotion code
3. You should see validation feedback:
   - ✅ Green border + discount info = Valid
   - ❌ Red border + "Invalid code" = Invalid
4. Proceed to checkout - discount should be applied

## Example Codes

### Percentage Discount
- **Code**: `SAVE20`
- **Coupon**: 20% off, Forever
- **Result**: User gets 20% off every month

### Fixed Amount Discount
- **Code**: `FIRST10`
- **Coupon**: $10 off, Once
- **Result**: User gets $10 off first payment only

### Limited Time Offer
- **Code**: `BLACKFRIDAY`
- **Coupon**: 50% off, Repeating (3 months)
- **Result**: User gets 50% off for 3 months

## Code Validation

The system validates codes in real-time:
- **Valid codes**: Show green border and discount amount/percentage
- **Invalid codes**: Show red border and "Invalid code" message
- **Empty field**: No validation (user can proceed without code)

## Technical Details

### API Endpoints

**POST `/api/stripe/validate-promo`**
- Validates a promotion code
- Returns coupon details if valid
- Used for real-time validation in UI

**POST `/api/stripe/checkout`**
- Accepts optional `promotionCode` parameter
- Applies discount to Stripe Checkout session
- Falls back to Stripe's built-in promotion code field if not provided

### Frontend

- Discount code input in `TrialOnboardingModal` (Step 2)
- Real-time validation with 500ms debounce
- Visual feedback (green/red borders)
- Discount information display

## Best Practices

1. **Use uppercase codes**: Easier to read and share (e.g., `SAVE20` not `save20`)
2. **Keep codes short**: 6-10 characters is ideal
3. **Make them memorable**: Use brand names, events, or clear descriptions
4. **Set expiration dates**: For time-limited offers
5. **Limit redemptions**: Prevent abuse
6. **Test thoroughly**: Always test codes in Stripe Test Mode first

## Troubleshooting

### Code not validating
- Check that the promotion code is **Active** in Stripe
- Verify the code matches exactly (case-insensitive)
- Check Stripe Dashboard for any restrictions

### Discount not applying
- Ensure `allow_promotion_codes: true` is set in checkout (already enabled)
- Verify the promotion code is linked to a valid coupon
- Check coupon expiration and usage limits

### Code works in Stripe but not in app
- Clear browser cache
- Check browser console for errors
- Verify API endpoint is accessible

## Notes

- Users can also enter promotion codes directly in Stripe Checkout (built-in field)
- The app's discount code field is optional - users can skip it
- Multiple discount codes cannot be combined (Stripe limitation)
- Discounts apply after the 14-day free trial ends


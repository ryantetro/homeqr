# Troubleshooting Promotion Code Issues

If your promotion code is showing as "Invalid" even though you created it in Stripe, follow these steps:

## Quick Checks

### 1. Verify Code is Active
- Go to Stripe Dashboard → **Products** → **Promotion codes**
- Find your code (e.g., `LIFETIME`)
- Make sure **Active** toggle is **ON** (green/enabled)
- If it's off, click the toggle to enable it

### 2. Check Test Mode vs Live Mode
- **Important**: Make sure you're in the same mode in both places!
- Check Stripe Dashboard top-right: Is it "Test mode" or "Live mode"?
- Check your app's `.env` file:
  - `STRIPE_SECRET_KEY` should match the mode you're testing in
  - Test mode keys start with `sk_test_`
  - Live mode keys start with `sk_live_`

### 3. Verify Code Name Exactly
- In Stripe Dashboard, check the exact code name
- It should match what you're typing (case-insensitive, but check for typos)
- Example: If code is `LIFETIME`, typing `LIFETIME` or `lifetime` should work

### 4. Check Coupon is Valid
- Go to Stripe Dashboard → **Products** → **Coupons**
- Find the coupon linked to your promotion code
- Make sure it shows as **Valid**
- Check expiration date (if set)

### 5. Check Browser Console
- Open browser Developer Tools (F12)
- Go to **Console** tab
- Enter your code and look for any error messages
- Check **Network** tab → Look for `/api/stripe/validate-promo` request
- Click on it and check the **Response** tab for error details

## Common Issues

### Issue: "Invalid promotion code"
**Possible causes:**
1. Code is not Active in Stripe
2. You're in Test Mode but using Live Mode keys (or vice versa)
3. Code name doesn't match exactly
4. Coupon linked to code is expired or invalid

**Solution:**
- Double-check all the Quick Checks above
- Try creating a new test code: `TEST100` with a simple 100% off coupon
- Make sure you're testing in the same mode (Test/Live) in both Stripe and your app

### Issue: Code works in Stripe Checkout but not in app
**Possible causes:**
- API endpoint issue
- Network/CORS issue
- Code validation logic issue

**Solution:**
- Check browser console for errors
- Verify `/api/stripe/validate-promo` endpoint is accessible
- Try the code directly in Stripe Checkout (it should work there)

### Issue: Code validates but discount doesn't apply
**Possible causes:**
- Promotion code not passed to checkout correctly
- Coupon doesn't apply to the selected plan/price

**Solution:**
- Check that coupon "Applies to" includes your products/prices
- Verify the promotion code ID is being passed to checkout API

## Testing Steps

1. **Create a simple test code:**
   - Code: `TEST100`
   - Coupon: 100% off, Forever
   - Make sure it's Active

2. **Test in your app:**
   - Enter `TEST100` in the discount code field
   - Should show green checkmark and "100% off"
   - If it shows invalid, check the issues above

3. **Check server logs:**
   - Look at your server console/terminal
   - Should see validation attempts and any errors

## Debug Mode

To see more details, check your server logs when entering a code. The updated validation API now logs:
- When codes are not found
- When coupons are invalid
- When promotion codes are inactive

## Still Not Working?

1. **Verify Stripe API keys:**
   ```bash
   # Check your .env file
   STRIPE_SECRET_KEY=sk_test_... (for test mode)
   # or
   STRIPE_SECRET_KEY=sk_live_... (for live mode)
   ```

2. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3000/api/stripe/validate-promo \
     -H "Content-Type: application/json" \
     -d '{"code":"LIFETIME"}'
   ```

3. **Check Stripe Dashboard:**
   - Go to **Developers** → **Logs**
   - Look for API calls related to promotion codes
   - Check for any errors

4. **Create a fresh test code:**
   - Create a new coupon: `TEST_COUPON` - 100% off, Forever
   - Create a new promotion code: `TESTCODE`
   - Make sure both are Active
   - Try `TESTCODE` in your app

## Need More Help?

If none of the above works:
1. Check the exact error message in browser console
2. Check server logs for detailed error messages
3. Verify your Stripe account has API access enabled
4. Make sure you're using the correct Stripe account (not a different one)


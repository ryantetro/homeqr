# 🚀 Start Testing Now!

## Quick Start (5 minutes)

### Step 1: Open a Test Site
1. Go to **Zillow** and find any property listing
2. Or use one of these test sites:
   - Realtor.com
   - Redfin
   - Trulia

### Step 2: Open Console
1. Press **F12** (or **Cmd+Option+I** on Mac)
2. Click the **Console** tab

### Step 3: Load Test Code
1. Open the file: `extension/test-suite.js`
2. **Copy the entire file** (Cmd+A, Cmd+C)
3. **Paste into the browser console**
4. Press **Enter**

### Step 4: Run Test
Type this and press Enter:
```javascript
testExtraction()
```

### Step 5: Check Results
You'll see:
- ✅ or ❌ for each field
- A score (e.g., "Score: 85/100 (85%)")
- Detailed extraction info

### Step 6: Test Extension
1. Click the **HomeQR extension icon** in your toolbar
2. Click **"Generate QR Code"**
3. Check console for `[HomeQR]` logs
4. Verify QR code appears

## What You're Testing

✅ **Address** - Should always work  
✅ **Price** - Should work if on page  
✅ **Bedrooms/Bathrooms** - Should work if on page  
✅ **Square Feet** - Should work if on page  
✅ **Images** - Should extract at least 1 image  
✅ **QR Generation** - Should create QR code successfully  

## Example Test Output

```
🧪 Starting HomeQR Extraction Test...

📊 Test Results
==================================================
Site: www.zillow.com
URL: https://www.zillow.com/homedetails/...
Score: 95/100 (95%)

✅ Required Fields:
  Address: ✅

📋 Important Fields:
  price: ✅
  bedrooms: ✅
  bathrooms: ✅
  images: ✅

📝 Optional Fields:
  squareFeet: ✅
  propertyType: ❌
  mlsId: ✅

🔍 Extraction Details:
  JSON-LD: ✅ Found
  Meta Tags: ✅ Found
  DOM Selectors: ✅ Found
==================================================
```

## Next Steps

1. **Test on Zillow** (baseline - should work perfectly)
2. **Test on Realtor.com** (test generic extraction)
3. **Test on Redfin** (test generic extraction)
4. **Document results** in `extension/TEST_RESULTS.md`

## Need Help?

- Check `extension/RUN_TESTS.md` for detailed instructions
- Check `extension/TESTING.md` for manual testing guide
- Look for `[HomeQR]` logs in console for debugging

## Pro Tips

- Test on **multiple listings** from the same site
- Test on **different property types** (house, condo, land)
- Test on **listings with missing data** (no price, etc.)
- **Screenshot** any issues you find
- **Copy console logs** when reporting issues

